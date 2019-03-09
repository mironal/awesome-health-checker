import {
  Messages,
  StartCheckMessage,
  BackgroundMessages,
  CancelCheckMessage,
} from "./message"

const clientId = "4be04a7e12249b9ea66a"
const clientSecret = "29c5784cff71998589bbad9e441a8f3b8ab6780e"
const redirectUri = "https://pkedcjkdefgpdelpbcmbmeomcjbeemfm.chromiumapp.org/"

var accessToken: string | null = null

const parseQuery = (query: string): { [key: string]: string } => {
  return query.split(/&/).reduce(
    (result, current) => {
      const pair = current.split(/=/)
      result[pair[0]] = pair[1]
      return result
    },
    {} as { [key: string]: string },
  )
}

const exchangeCodeForToken = async (code: string) => {
  const url =
    "https://github.com/login/oauth/access_token?" +
    "client_id=" +
    clientId +
    "&client_secret=" +
    clientSecret +
    "&redirect_uri=" +
    redirectUri +
    "&code=" +
    code

  const response = await fetch(url)

  if (response.status !== 200) {
    return Promise.reject(
      new Error(
        `Invalid response code: ${
          response.status
        }, body: ${await response.text()}`,
      ),
    )
  }

  const text = await response.text()
  const parsedQuery = parseQuery(text)
  console.log("parsed", parsedQuery)
  if (parsedQuery.access_token) {
    return parsedQuery.access_token
  } else {
    return Promise.reject(new Error(`Invalid response ${text}`))
  }
}

const getToken = async () => {
  if (accessToken) {
    return accessToken
  }

  const options = {
    interactive: true,
    url:
      "https://github.com/login/oauth/authorize" +
      "?client_id=" +
      clientId +
      "&redirect_uri=" +
      encodeURIComponent(redirectUri),
  }
  console.log("request authorize")

  return new Promise((resolve, reject) => {
    chrome.identity.launchWebAuthFlow(options, async redirect => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError)
        return
      }

      if (!redirect) {
        // user cancel
        reject(new Error("User canceled"))
        return
      }

      const code = parseQuery(new URL(redirect).search.replace(/^\?/, "")).code
      console.log("exchange code")
      const token = await exchangeCodeForToken(code)
      accessToken = token
      resolve(token)
    })
  })
}

const contextMenuIds = {
  progress: "context_menu_id_progress",
  checkHealth: "context_menu_id_check_health",
  cancel: "context_menu_id_cancel",
}

const processMessage = (
  msg: BackgroundMessages,
  sender: chrome.runtime.MessageSender,
  responseFn: (response?: any) => void,
) => {
  if (msg.type === "get_token") {
    getToken()
      .then(token => responseFn(token))
      .catch(error => responseFn(error))
  } else if (msg.type === "update_progress") {
    chrome.contextMenus.update(contextMenuIds.progress, {
      title: `Progress ${msg.data.current}/${msg.data.max}`,
    })

    if (chrome.runtime.lastError) {
      console.error(chrome.runtime.lastError)
      responseFn(chrome.runtime.lastError)
    } else {
      responseFn()
    }
  } else if (msg.type === "change_icon_visibility") {
    if (msg.data.visible) {
      chrome.pageAction.show(sender.tab!.id!)
    } else {
      chrome.pageAction.hide(sender.tab!.id!)
    }
  }
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: contextMenuIds.progress,
    title: "progreeee",
    contexts: ["page_action"],
    type: "normal",
    enabled: false,
    visible: false,
  })
  chrome.contextMenus.create({
    id: contextMenuIds.checkHealth,
    title: "Check health",
    contexts: ["page_action"],
  })

  chrome.contextMenus.create({
    id: contextMenuIds.cancel,
    title: "Cancel",
    contexts: ["page_action"],
    type: "normal",
    enabled: false,
  })
})

chrome.runtime.onMessage.addListener((msg, sender, sendResp) => {
  console.log("onMessage", msg)
  processMessage(msg, sender, sendResp)
  return true
})

chrome.runtime.onSuspend.addListener(() => console.log("onSuspend"))

chrome.contextMenus.onClicked.addListener((menu, tab) => {
  if (!tab) {
    return
  }
  if (menu.menuItemId === contextMenuIds.checkHealth) {
    const msg: StartCheckMessage = {
      type: "start_check",
    }
    chrome.tabs.sendMessage(tab.id!, msg, () => {
      chrome.contextMenus.update(contextMenuIds.checkHealth, {
        enabled: false,
      })
      chrome.contextMenus.update(contextMenuIds.cancel, {
        enabled: true,
      })
    })
  } else if (menu.menuItemId === contextMenuIds.cancel) {
    const msg: CancelCheckMessage = {
      type: "cancel_check",
    }
    chrome.tabs.sendMessage(tab.id!, msg, () => {
      chrome.tabs.sendMessage(tab.id!, msg, () => {
        chrome.contextMenus.update(contextMenuIds.checkHealth, {
          enabled: true,
        })
        chrome.contextMenus.update(contextMenuIds.cancel, {
          enabled: false,
        })
      })
    })
  }
})

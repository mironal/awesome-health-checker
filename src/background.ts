import {
  StartCheckMessage,
  BackgroundMessages,
  CancelCheckMessage,
} from "./message"
import {
  initializeContextMenu,
  updateProgress,
  contextMenuIds,
  updateContextMenu,
} from "./contextMenu"

const processMessage = (
  msg: BackgroundMessages,
  sender: chrome.runtime.MessageSender,
  responseFn: (response?: any) => void,
) => {
  if (msg.type === "update_progress") {
    updateProgress(msg.data)
    if (chrome.runtime.lastError) {
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
  } else if (msg.type === "finish_check") {
    updateContextMenu("finished")
  }
}

chrome.runtime.onInstalled.addListener(() => {
  initializeContextMenu()
})

chrome.runtime.onMessage.addListener((msg, sender, sendResp) => {
  processMessage(msg, sender, sendResp)
  return true
})

chrome.contextMenus.onClicked.addListener((menu, tab) => {
  if (!tab) {
    return
  }
  if (menu.menuItemId === contextMenuIds.start) {
    const msg: StartCheckMessage = {
      type: "start_check",
    }
    chrome.tabs.sendMessage(tab.id!, msg, () => updateContextMenu("started"))
  } else if (menu.menuItemId === contextMenuIds.cancel) {
    const msg: CancelCheckMessage = {
      type: "cancel_check",
    }
    chrome.tabs.sendMessage(tab.id!, msg, () => updateContextMenu("initial"))
  }
})

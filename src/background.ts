import {
  StartCheckMessage,
  BackgroundMessages,
  CancelCheckMessage,
} from "./message"
import {
  initializeContextMenu,
  contextMenuIds,
  updateContextMenu,
} from "./contextMenu"

const processMessage = (
  msg: BackgroundMessages,
  sender: chrome.runtime.MessageSender,
  responseFn: (response?: any) => void,
) => {
  if (msg.type === "update_content_script_state") {
    updateContextMenu(msg.state)

    if (chrome.runtime.lastError) {
      responseFn(chrome.runtime.lastError)
    } else {
      responseFn()
    }
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
    chrome.tabs.sendMessage(tab.id!, msg)
  } else if (menu.menuItemId === contextMenuIds.cancel) {
    const msg: CancelCheckMessage = {
      type: "cancel_check",
    }
    chrome.tabs.sendMessage(tab.id!, msg)
  }
})

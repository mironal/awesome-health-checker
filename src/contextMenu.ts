import { UpdateProgressMessage } from "./message"

export type ContextMenuState = "initial" | "started" | "finished"

export const contextMenuIds = {
  progress: "context_menu_id_progress",
  start: "context_menu_id_check_health",
  cancel: "context_menu_id_cancel",
}

export const initializeContextMenu = () => {
  chrome.contextMenus.create({
    id: contextMenuIds.progress,
    title: "Waiting start...",
    contexts: ["page_action"],
    type: "normal",
    enabled: false,
  })
  chrome.contextMenus.create({
    id: contextMenuIds.start,
    title: "Start check health",
    contexts: ["page_action"],
  })

  chrome.contextMenus.create({
    id: contextMenuIds.cancel,
    title: "Cancel",
    contexts: ["page_action"],
    type: "normal",
    enabled: false,
  })
}

export const updateContextMenu = (state: ContextMenuState) => {
  switch (state) {
    case "initial":
      chrome.contextMenus.update(contextMenuIds.progress, {
        enabled: false,
      })
      chrome.contextMenus.update(contextMenuIds.start, {
        enabled: true,
      })
      chrome.contextMenus.update(contextMenuIds.cancel, {
        enabled: false,
      })
      break
    case "started":
      chrome.contextMenus.update(contextMenuIds.progress, {
        enabled: false,
      })
      chrome.contextMenus.update(contextMenuIds.start, {
        enabled: false,
      })
      chrome.contextMenus.update(contextMenuIds.cancel, {
        enabled: true,
      })
      break
    case "finished":
      chrome.contextMenus.update(contextMenuIds.progress, {
        enabled: false,
      })
      chrome.contextMenus.update(contextMenuIds.start, {
        enabled: false,
      })
      chrome.contextMenus.update(contextMenuIds.cancel, {
        enabled: true,
      })
  }
}

export const updateProgress = (data: UpdateProgressMessage["data"]) => {
  chrome.contextMenus.update(contextMenuIds.progress, {
    title: `Remaining ${data.remaining}, Total: ${data.total}`,
  })
}

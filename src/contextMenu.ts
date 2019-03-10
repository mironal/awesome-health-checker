import { ContentScriptState } from "./message"

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

export const updateContextMenu = ({
  state,
  remaining,
  total,
}: ContentScriptState) => {
  switch (state) {
    case "initial":
    case "cancelled":
      chrome.contextMenus.update(contextMenuIds.progress, {
        enabled: false,
      })
      chrome.contextMenus.update(contextMenuIds.start, {
        enabled: false,
      })
      chrome.contextMenus.update(contextMenuIds.cancel, {
        enabled: false,
      })

      break
    case "ready":
    case "error_finished":
    case "success_finished":
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
    case "running":
      chrome.contextMenus.update(contextMenuIds.progress, {
        title: `Remaining ${remaining}, Total: ${total}`,
        enabled: false,
      })
      chrome.contextMenus.update(contextMenuIds.start, {
        enabled: false,
      })
      chrome.contextMenus.update(contextMenuIds.cancel, {
        enabled: true,
      })
      break
  }
}

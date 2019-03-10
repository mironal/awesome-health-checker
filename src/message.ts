export interface ContentScriptState {
  state:
    | "initial"
    | "ready"
    | "running"
    | "cancelled"
    | "success_finished"
    | "error_finished"
  remaining: number
  total: number
}

export interface UpdateContentScriptStateMessage {
  type: "update_content_script_state"
  state: ContentScriptState
}

export interface StartCheckMessage {
  type: "start_check"
}

export interface CancelCheckMessage {
  type: "cancel_check"
}

export type BackgroundMessages = UpdateContentScriptStateMessage

export type ContentMessages = CancelCheckMessage | StartCheckMessage

export const publisher = {
  publishToBackground: (
    message: BackgroundMessages,
    responseCb?: (response: any) => void,
  ) => chrome.runtime.sendMessage(message, responseCb),

  publishToContent: (
    message: ContentMessages,
    responseCb?: (response: any) => void,
  ) => chrome.runtime.sendMessage(message, responseCb),
}

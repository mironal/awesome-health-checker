export interface UpdateProgressMessage {
  type: "update_progress"
  data: {
    remaining: number
    total: number
  }
}

export interface ChangeIconVisibilityMessage {
  type: "change_icon_visibility"
  data: { visible: boolean }
}

export interface StartCheckMessage {
  type: "start_check"
}

export interface CancelCheckMessage {
  type: "cancel_check"
}

export interface FinishCheckMessage {
  type: "finish_check"
}

export type BackgroundMessages =
  | UpdateProgressMessage
  | ChangeIconVisibilityMessage
  | FinishCheckMessage

export type ContentMessages = StartCheckMessage | CancelCheckMessage

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

const inputValue = () => {
  const input = document.getElementById("github_token_input")
  if (!input || !(input instanceof HTMLInputElement)) {
    return
  }
  return input.value
}

const save = (github_access_token: string) => {
  if (!chrome.storage) {
    return
  }
  chrome.storage.sync.set(
    {
      github_access_token,
    },
    () => {
      const label = document.getElementById("message_label")
      if (label) {
        label.textContent = "Saved! φ(•ᴗ•๑)"
        label.classList.remove("hide")
        setTimeout(() => label.classList.add("hide"), 1000)
      }
    },
  )
}

const restore = () => {
  if (!chrome.storage) {
    return
  }
  chrome.storage.sync.get(
    {
      github_access_token: "",
    },
    items => {
      const input = document.getElementById("github_token_input")
      if (!input || !(input instanceof HTMLInputElement)) {
        return
      }
      input.value = items.github_access_token

      if (items.github_access_token.length > 0) {
        const label = document.getElementById("message_label")
        if (label) {
          label.textContent = "Restored φ(•ᴗ•๑)"
          label.classList.remove("hide")
          setTimeout(() => label.classList.add("hide"), 1000)
        }
        const deleteBtn = document.getElementById("delete_button")
        if (deleteBtn && deleteBtn instanceof HTMLButtonElement) {
          deleteBtn.disabled = false
        }
      }
    },
  )
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", restore)
} else {
  restore()
}

const button = document.getElementById("save_button")
if (button) {
  button.addEventListener("click", () => {
    const token = inputValue()
    if (token && token.length > 0) {
      save(token)
    }
  })
}

const deleteBtn = document.getElementById("delete_button")
if (deleteBtn) {
  deleteBtn.addEventListener("click", () => {
    if (confirm("Are you sure?")) {
      save("")
      const input = document.getElementById("github_token_input")
      if (input instanceof HTMLInputElement) {
        input.value = ""
      }
    }
  })
}

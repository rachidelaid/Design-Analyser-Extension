import { state } from "./state.js"
import { $, escapeHtml } from "./utils.js"
import { toast } from "./toast.js"

export function showPromptLoading() {
  const el = $("#promptOutput")
  el.innerHTML = `
    <div class="prompt-loading">
      <svg class="spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
      </svg>
      <span>Generating prompt with OpenAI…</span>
    </div>`
  $("#promptCard").style.display = ""
}

export function showPromptResult(text) {
  state.lastPrompt = text
  const el = $("#promptOutput")
  el.innerHTML = `<div class="prompt-text">${escapeHtml(text)}</div>`
}

export function showPromptError(msg, retryData, retryDone) {
  const el = $("#promptOutput")
  $("#promptCard").style.display = ""
  const retryBtn = retryData ? '<button class="btn btn-small btn-retry">Retry</button>' : ""
  el.innerHTML = `<div class="prompt-error">${escapeHtml(msg)}${retryBtn}</div>`

  const btn = el.querySelector(".btn-retry")
  if (btn && retryData) {
    btn.addEventListener("click", () => generatePrompt(retryData, retryDone))
  }
}

export function captureScreenshot() {
  return new Promise((resolve) => {
    chrome.storage.local.get({ aiModel: "gpt-4o-mini" }, (result) => {
      if (result.aiModel !== "gpt-4o") {
        resolve(null)
        return
      }
      chrome.tabs.captureVisibleTab(null, { format: "jpeg", quality: 70 }, (dataUrl) => {
        if (chrome.runtime.lastError) {
          console.warn("Screenshot failed:", chrome.runtime.lastError.message)
          resolve(null)
          return
        }
        resolve(dataUrl)
      })
    })
  })
}

export function generatePrompt(designData, onDone) {
  showPromptLoading()

  captureScreenshot().then((screenshot) => {
    const msg = { action: "generatePrompt", designData }
    if (screenshot) msg.screenshot = screenshot

    chrome.runtime.sendMessage(msg, (response) => {
      if (chrome.runtime.lastError) {
        showPromptError("Failed to reach background service", designData, onDone)
        onDone?.()
        return
      }
      if (response.success) {
        showPromptResult(response.prompt)
        $("#btnCopy").disabled = false
        toast("Prompt generated!")
      } else {
        showPromptError(response.error || "Unknown error", designData, onDone)
        toast("Prompt generation failed")
      }
      onDone?.()
    })
  })
}

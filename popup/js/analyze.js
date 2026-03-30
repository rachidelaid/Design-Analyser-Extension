import { state } from "./state.js"
import { $ } from "./utils.js"
import { toast } from "./toast.js"
import { renderResults } from "./renderer.js"
import { generatePrompt } from "./prompt.js"
import { saveToHistory } from "./history.js"

const SPINNER_SVG = `
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
  </svg>`

const CHECK_SVG = `
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>`

export function initAnalyze() {
  const genBtn = $("#btnGenerate")
  const copyBtn = $("#btnCopy")
  const statusText = $("#statusText")
  const defaultBtnHTML = genBtn.innerHTML

  genBtn.addEventListener("click", () => runAnalysis(genBtn, statusText, copyBtn, defaultBtnHTML))
  copyBtn.addEventListener("click", () => copyPrompt(copyBtn))
}

function runAnalysis(genBtn, statusText, copyBtn, defaultBtnHTML) {
  genBtn.classList.add("loading")
  genBtn.innerHTML = `${SPINNER_SVG} Analyzing…`
  statusText.textContent = "Analyzing…"
  state.lastPrompt = ""
  $("#promptCard").style.display = "none"

  chrome.tabs.query({ active: true, currentWindow: true }, (activeTabs) => {
    const tabId = activeTabs[0].id

    function onSuccess(response) {
      state.lastAnalysis = response
      renderResults(response)

      genBtn.innerHTML = `${SPINNER_SVG} Generating prompt…`
      statusText.textContent = "Generating prompt…"

      generatePrompt(response, () => {
        chrome.storage.local.get({ aiModel: "gpt-4o-mini" }, (r) => {
          saveToHistory(response, state.lastPrompt, r.aiModel)
        })

        genBtn.classList.remove("loading")
        genBtn.classList.add("success")
        genBtn.innerHTML = `${CHECK_SVG} Done`
        statusText.textContent = "Prompt ready"

        setTimeout(() => {
          genBtn.classList.remove("success")
          genBtn.innerHTML = defaultBtnHTML
          statusText.textContent = "Ready"
        }, 2200)
      })
    }

    function onError(err) {
      console.error("Analysis error:", err)
      genBtn.classList.remove("loading")
      genBtn.innerHTML = defaultBtnHTML
      statusText.textContent = "Ready"
      toast("Error — cannot analyze this page")
    }

    function sendExtract() {
      chrome.tabs.sendMessage(tabId, { action: "extractDesign" }, (response) => {
        if (chrome.runtime.lastError) return onError(chrome.runtime.lastError.message)
        onSuccess(response)
      })
    }

    chrome.tabs.sendMessage(tabId, { action: "ping" }, () => {
      if (chrome.runtime.lastError) {
        chrome.scripting.executeScript(
          {
            target: { tabId },
            files: [
              "content/utils.js",
              "content/extractors/identity.js",
              "content/extractors/colors.js",
              "content/extractors/typography.js",
              "content/extractors/layout.js",
              "content/extractors/sections.js",
              "content/extractors/forms.js",
              "content/extractors/interactions.js",
              "content/extractors/images.js",
              "content/extractors/assets.js",
              "content/extractors/spacing.js",
              "content/extractors/meta.js",
              "content/main.js",
            ],
          },
          () => {
            if (chrome.runtime.lastError) return onError(chrome.runtime.lastError.message)
            sendExtract()
          }
        )
      } else {
        sendExtract()
      }
    })
  })
}

function copyPrompt(copyBtn) {
  const text = state.lastPrompt || ""
  if (!text) return

  navigator.clipboard.writeText(text).then(() => {
    const orig = copyBtn.innerHTML
    copyBtn.classList.add("success")
    copyBtn.innerHTML = `
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
      Copied!`
    toast("Prompt copied to clipboard")
    setTimeout(() => {
      copyBtn.classList.remove("success")
      copyBtn.innerHTML = orig
    }, 1800)
  })
}

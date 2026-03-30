import { $, $$ } from "./utils.js"
import { toast } from "./toast.js"

export function initSettings() {
  const settingsBtn = $("#settingsToggle")
  const settingsCard = $("#settingsCard")
  const apiKeyInput = $("#apiKeyInput")
  const apiKeyStatus = $("#apiKeyStatus")

  loadSavedSettings(apiKeyInput, apiKeyStatus)

  settingsBtn.addEventListener("click", () => {
    settingsCard.classList.toggle("hidden")
  })

  $("#btnSaveKey").addEventListener("click", () => {
    saveApiKey(apiKeyInput, apiKeyStatus)
  })

  $$("#modelSelector .model-btn").forEach((btn) => {
    btn.addEventListener("click", () => selectModel(btn))
  })
}

function loadSavedSettings(apiKeyInput, apiKeyStatus) {
  chrome.storage.local.get({ openaiKey: "", aiModel: "gpt-4o-mini" }, (result) => {
    if (result.openaiKey) {
      apiKeyInput.value = result.openaiKey
      apiKeyStatus.textContent = "Key saved"
      apiKeyStatus.className = "api-key-status saved"
    }
    $$("#modelSelector .model-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.model === result.aiModel)
    })
  })
}

function saveApiKey(apiKeyInput, apiKeyStatus) {
  const key = apiKeyInput.value.trim()
  if (!key) {
    apiKeyStatus.textContent = "Please enter a key"
    apiKeyStatus.className = "api-key-status error"
    return
  }
  chrome.storage.local.set({ openaiKey: key }, () => {
    apiKeyStatus.textContent = "Key saved"
    apiKeyStatus.className = "api-key-status saved"
    toast("API key saved")
  })
}

function selectModel(btn) {
  $$("#modelSelector .model-btn").forEach((b) => b.classList.remove("active"))
  btn.classList.add("active")
  chrome.storage.local.set({ aiModel: btn.dataset.model })
  const label = btn.dataset.model === "gpt-4o" ? "GPT-4o + vision" : "GPT-4o mini"
  toast(`Model: ${label}`)
}

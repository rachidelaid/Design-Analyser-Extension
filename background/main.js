import { generateWithOpenAI } from "./openai.js"

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "generatePrompt") {
    handleGeneratePrompt(request, sendResponse)
    return true
  }
})

function handleGeneratePrompt(request, sendResponse) {
  chrome.storage.local.get({ openaiKey: "", aiModel: "gpt-4o-mini" }, (result) => {
    if (!result.openaiKey) {
      sendResponse({ success: false, error: "No API key configured" })
      return
    }

    const model = result.aiModel || "gpt-4o-mini"
    const screenshot = request.screenshot || null

    generateWithOpenAI(request.designData, result.openaiKey, model, screenshot)
      .then((prompt) => sendResponse({ success: true, prompt }))
      .catch((err) => sendResponse({ success: false, error: err.message }))
  })
}

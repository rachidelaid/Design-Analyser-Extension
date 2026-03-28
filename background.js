// Handle messages between popup and content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "analyzePage") {
    // Forward to content script
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(
        tabs[0].id,
        { action: "extractDesign" },
        (response) => {
          sendResponse(response)
        },
      )
    })
    return true // Keep message channel open for async response
  }
})

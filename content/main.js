if (!window.__designAnalyzerLoaded) {
  window.__designAnalyzerLoaded = true

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "ping") {
      sendResponse({ status: "ok" })
      return
    }
    if (request.action === "extractDesign") {
      sendResponse(extractDesignInfo())
    }
  })
}

function extractDesignInfo() {
  return {
    url: window.location.href,
    title: document.title,
    identity: extractIdentity(),
    colorMap: extractColorMap(),
    typography: extractTypography(),
    fontSources: detectFontSources(),
    layout: analyzeLayout(),
    sections: extractSections(),
    forms: extractForms(),
    interactions: detectInteractions(),
    images: extractImages(),
    assets: detectAssets(),
    responsive: detectResponsive(),
    cssVariables: extractCSSVariables(),
    domStructure: extractDOMStructure(),
    spacing: extractSpacing(),
  }
}

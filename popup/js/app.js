import { initToast } from "./toast.js"
import { initTheme } from "./theme.js"
import { initSettings } from "./settings.js"
import { initTabs } from "./tabs.js"
import { initHistory } from "./history.js"
import { initAnalyze } from "./analyze.js"

document.addEventListener("DOMContentLoaded", () => {
  initToast()
  initTheme()
  initSettings()
  initTabs()
  initHistory()
  initAnalyze()
  initRipple()
  loadCurrentTab()
})

function initRipple() {
  document.querySelectorAll(".btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const rect = btn.getBoundingClientRect()
      btn.style.setProperty("--ripple-x", ((e.clientX - rect.left) / rect.width) * 100 + "%")
      btn.style.setProperty("--ripple-y", ((e.clientY - rect.top) / rect.height) * 100 + "%")
      btn.classList.add("ripple")
      setTimeout(() => btn.classList.remove("ripple"), 500)
    })
  })
}

function loadCurrentTab() {
  try {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        document.getElementById("pageUrl").textContent = tabs[0].url || ""
        if (tabs[0].favIconUrl) {
          document.getElementById("favicon").src = tabs[0].favIconUrl
        }
      }
    })
  } catch {
    // Outside extension context
  }
}

import { $, $$ } from "./utils.js"
import { renderHistory } from "./history.js"

export function initTabs() {
  const tabsEl = $("#tabs")
  const tabBtns = tabsEl.querySelectorAll(".segment-btn")
  const panelAnalysis = $("#panelAnalysis")
  const panelHistory = $("#panelHistory")

  tabsEl.setAttribute("data-active", "0")

  tabBtns.forEach((btn, i) => {
    btn.addEventListener("click", () => {
      tabBtns.forEach((b) => b.classList.remove("active"))
      btn.classList.add("active")
      tabsEl.setAttribute("data-active", String(i))

      if (btn.dataset.value === "history") {
        panelAnalysis.classList.remove("active")
        panelHistory.classList.add("active")
        renderHistory()
      } else {
        panelHistory.classList.remove("active")
        panelAnalysis.classList.add("active")
      }
    })
  })
}

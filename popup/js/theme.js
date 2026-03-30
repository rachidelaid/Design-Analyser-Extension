import { $ } from "./utils.js"

export function initTheme() {
  const html = document.documentElement
  const themeBtn = $("#themeToggle")
  const savedTheme = localStorage.getItem("da-theme") || "dark"

  html.setAttribute("data-theme", savedTheme)

  themeBtn.addEventListener("click", () => {
    const next = html.getAttribute("data-theme") === "dark" ? "light" : "dark"
    html.setAttribute("data-theme", next)
    localStorage.setItem("da-theme", next)
  })
}

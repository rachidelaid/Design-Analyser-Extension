import { state } from "./state.js"
import { $, escapeHtml, getDomain } from "./utils.js"
import { toast } from "./toast.js"
import { renderResults } from "./renderer.js"
import { showPromptResult } from "./prompt.js"

export function initHistory() {
  $("#btnClearHistory").addEventListener("click", () => {
    chrome.storage.local.set({ history: [] }, () => {
      renderHistory()
      toast("History cleared")
    })
  })
}

export function saveToHistory(data, prompt, model) {
  const entry = {
    id: Date.now(),
    timestamp: new Date().toISOString(),
    url: data.url,
    title: data.title,
    favicon: $("#favicon").src || "",
    prompt: prompt || "",
    model: model || "",
    data,
  }

  chrome.storage.local.get({ history: [] }, (result) => {
    const history = result.history
    history.unshift(entry)
    if (history.length > 50) history.length = 50
    chrome.storage.local.set({ history })
  })
}

export function renderHistory() {
  chrome.storage.local.get({ history: [] }, (result) => {
    const history = result.history
    const list = $("#historyList")
    const empty = $("#historyEmpty")
    const clearBtn = $("#btnClearHistory")

    if (!history.length) {
      list.innerHTML = ""
      empty.style.display = ""
      clearBtn.style.display = "none"
      return
    }

    empty.style.display = "none"
    clearBtn.style.display = ""
    list.innerHTML = history.map((entry) => buildHistoryItem(entry)).join("")

    bindHistoryDeleteButtons(list)
    bindHistoryItemClicks(list, history)
  })
}

function buildHistoryItem(entry) {
  const date = new Date(entry.timestamp)
  const timeStr =
    date.toLocaleDateString(undefined, { month: "short", day: "numeric" }) +
    " · " +
    date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })

  const colorSource = entry.data.colorMap || entry.data.colors || []
  const colorDots = (Array.isArray(colorSource) ? colorSource : [])
    .slice(0, 4)
    .map((c) => {
      const hex = typeof c === "string" ? c : c.hex
      return hex ? `<span class="hist-dot" style="background:${hex}"></span>` : ""
    })
    .join("")

  const domain = getDomain(entry.url)
  const hasPrompt = entry.prompt ? "has-prompt" : ""
  const modelBadge = entry.model
    ? `<span class="hist-model ${entry.model === "gpt-4o" ? "hist-model--vision" : ""}">${entry.model === "gpt-4o" ? "4o" : "mini"}</span>`
    : ""

  return `
    <div class="history-item ${hasPrompt}" data-id="${entry.id}">
      <div class="hist-top">
        <img class="hist-favicon" src="${entry.favicon}" alt="">
        <div class="hist-info">
          <div class="hist-title">${escapeHtml(entry.title || domain)}</div>
          <div class="hist-url">${escapeHtml(domain)}</div>
        </div>
        ${modelBadge}
        <button class="hist-delete" data-id="${entry.id}" title="Remove">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
      <div class="hist-bottom">
        <div class="hist-colors">${colorDots}</div>
        <span class="hist-time">${timeStr}</span>
      </div>
    </div>`
}

function bindHistoryDeleteButtons(list) {
  list.querySelectorAll(".hist-delete").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation()
      const id = Number(btn.dataset.id)
      chrome.storage.local.get({ history: [] }, (res) => {
        const updated = res.history.filter((h) => h.id !== id)
        chrome.storage.local.set({ history: updated }, () => renderHistory())
      })
      toast("Entry removed")
    })
  })
}

function bindHistoryItemClicks(list, history) {
  list.querySelectorAll(".history-item").forEach((item) => {
    item.addEventListener("click", () => {
      const id = Number(item.dataset.id)
      const entry = history.find((h) => h.id === id)
      if (!entry) return

      state.lastAnalysis = entry.data
      state.lastPrompt = entry.prompt || ""
      renderResults(entry.data)

      if (entry.prompt) {
        showPromptResult(entry.prompt)
        $("#promptCard").style.display = ""
      } else {
        $("#promptCard").style.display = "none"
      }

      $("#btnCopy").disabled = !entry.prompt
      $("#pageUrl").textContent = entry.url || ""
      $("#favicon").src = entry.favicon || ""

      document.querySelector(".segment-btn").click()
      toast("Loaded from history")
    })
  })
}

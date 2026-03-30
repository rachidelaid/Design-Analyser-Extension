document.addEventListener("DOMContentLoaded", () => {
  const html = document.documentElement
  let lastAnalysis = null
  let lastPrompt = ""

  // ── Toast ─────────────────────────────────────────────────
  const toastEl = document.createElement("div")
  toastEl.className = "toast"
  document.body.appendChild(toastEl)

  function toast(msg, duration = 1800) {
    toastEl.textContent = msg
    toastEl.classList.add("show")
    setTimeout(() => toastEl.classList.remove("show"), duration)
  }

  // ── Ripple on buttons ─────────────────────────────────────
  function attachRipple(btn) {
    btn.addEventListener("click", (e) => {
      const rect = btn.getBoundingClientRect()
      btn.style.setProperty("--ripple-x", ((e.clientX - rect.left) / rect.width) * 100 + "%")
      btn.style.setProperty("--ripple-y", ((e.clientY - rect.top) / rect.height) * 100 + "%")
      btn.classList.add("ripple")
      setTimeout(() => btn.classList.remove("ripple"), 500)
    })
  }
  document.querySelectorAll(".btn").forEach(attachRipple)

  // ── Theme toggle ──────────────────────────────────────────
  const themeBtn = document.getElementById("themeToggle")
  const savedTheme = localStorage.getItem("da-theme") || "dark"
  html.setAttribute("data-theme", savedTheme)

  themeBtn.addEventListener("click", () => {
    const next = html.getAttribute("data-theme") === "dark" ? "light" : "dark"
    html.setAttribute("data-theme", next)
    localStorage.setItem("da-theme", next)
  })

  // ── Settings toggle ───────────────────────────────────────
  const settingsBtn = document.getElementById("settingsToggle")
  const settingsCard = document.getElementById("settingsCard")
  const apiKeyInput = document.getElementById("apiKeyInput")
  const apiKeyStatus = document.getElementById("apiKeyStatus")

  chrome.storage.local.get(
    { openaiKey: "", aiModel: "gpt-4o-mini" },
    (result) => {
      if (result.openaiKey) {
        apiKeyInput.value = result.openaiKey
        apiKeyStatus.textContent = "Key saved"
        apiKeyStatus.className = "api-key-status saved"
      }
      document.querySelectorAll("#modelSelector .model-btn").forEach((btn) => {
        btn.classList.toggle("active", btn.dataset.model === result.aiModel)
      })
    },
  )

  settingsBtn.addEventListener("click", () => {
    settingsCard.classList.toggle("hidden")
  })

  document.getElementById("btnSaveKey").addEventListener("click", () => {
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
  })

  document.querySelectorAll("#modelSelector .model-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document
        .querySelectorAll("#modelSelector .model-btn")
        .forEach((b) => b.classList.remove("active"))
      btn.classList.add("active")
      chrome.storage.local.set({ aiModel: btn.dataset.model })
      const label =
        btn.dataset.model === "gpt-4o" ? "GPT-4o + vision" : "GPT-4o mini"
      toast(`Model: ${label}`)
    })
  })

  // ── URL & Favicon ─────────────────────────────────────────
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

  // ── Tab switching (Analysis / History) ────────────────────
  const tabsEl = document.getElementById("tabs")
  const tabBtns = tabsEl.querySelectorAll(".segment-btn")
  const panelAnalysis = document.getElementById("panelAnalysis")
  const panelHistory = document.getElementById("panelHistory")
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

  // ── Render extracted data into UI ─────────────────────────
  function renderResults(data) {
    renderColors(data.colorMap || [])
    renderTypography(data.typography || {})
    renderLayout(
      data.layout || {},
      data.interactions || {},
      data.sections || [],
    )
    const resultsEl = document.getElementById("results")
    resultsEl.classList.remove("hidden")
    resultsEl.classList.add("visible")
  }

  function renderColors(colorMap) {
    const container = document.getElementById("colorPalette")
    if (!colorMap.length) {
      container.innerHTML = '<span class="no-data">No colors detected</span>'
      return
    }
    container.innerHTML = colorMap
      .slice(0, 6)
      .map(
        (c) => `
      <div class="color-swatch" data-color="${c.hex}" title="${c.roles.join(", ")}">
        <div class="swatch-fill" style="background:${c.hex}"></div>
        <span class="swatch-label">${c.hex}</span>
      </div>`,
      )
      .join("")

    container.querySelectorAll(".color-swatch").forEach((swatch) => {
      swatch.addEventListener("click", () => {
        const hex = swatch.dataset.color
        navigator.clipboard.writeText(hex).then(() => {
          swatch.classList.add("copied")
          toast(`Copied ${hex}`)
          setTimeout(() => swatch.classList.remove("copied"), 1500)
        })
      })
    })
  }

  function cleanFontName(raw) {
    if (!raw) return "Unknown"
    return raw.split(",")[0].replace(/['"]/g, "").trim()
  }

  function renderTypography(typo) {
    const container = document.getElementById("typographyPreview")
    const heading = typo.headings?.[0]
    const body = typo.bodyText?.[0]

    if (!heading && !body) {
      container.innerHTML =
        '<span class="no-data">No typography detected</span>'
      return
    }

    let html = ""
    if (heading) {
      html += `
        <div class="typo-row">
          <span class="typo-role">Heading</span>
          <span class="font-name">${cleanFontName(heading.font)}</span>
          <div class="font-meta">
            <span class="size-tag">${heading.size}</span>
            <span class="size-tag">w${heading.weight}</span>
          </div>
          ${heading.sample ? `<div class="font-sample">${heading.sample}</div>` : ""}
        </div>`
    }
    if (body) {
      html += `
        <div class="typo-row">
          <span class="typo-role">Body</span>
          <span class="font-name">${cleanFontName(body.font)}</span>
          <div class="font-meta">
            <span class="size-tag">${body.size}</span>
            <span class="size-tag">w${body.weight}</span>
          </div>
        </div>`
    }
    container.innerHTML = html
  }

  function renderLayout(layout, interactions, sections) {
    const container = document.getElementById("layoutInfo")
    const tags = []

    if (layout.type) {
      const short = layout.type.includes("multi-page") ? "multi-page" :
        layout.type.includes("anchor") ? "single-page + anchors" : "single-page"
      tags.push(short)
    }
    if (layout.gridSystem) tags.push(layout.gridSystem)
    if (layout.hasNavigation) tags.push("navigation")
    if (layout.containerWidth) tags.push(`max-width: ${layout.containerWidth}`)
    if (sections.length) tags.push(`${sections.length} sections`)

    const sectionTypes = new Set(sections.map((s) => s.purpose))
    sectionTypes.forEach((p) => {
      if (p !== "content section" && p !== "brief content block" && p !== "spacer/divider") {
        tags.push(p)
      }
    })

    if (interactions.transitions?.length) tags.push("transitions")
    if (interactions.animations?.length) tags.push("animations")
    if (interactions.transforms?.length) tags.push("transforms")

    if (tags.length === 0) {
      container.innerHTML =
        '<span class="no-data">No layout info detected</span>'
      return
    }
    container.innerHTML = tags
      .map((t) => `<span class="tag">${t}</span>`)
      .join("")
  }

  // ── Prompt output rendering ───────────────────────────────
  function showPromptLoading() {
    const el = document.getElementById("promptOutput")
    el.innerHTML = `
      <div class="prompt-loading">
        <svg class="spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
        </svg>
        <span>Generating prompt with OpenAI…</span>
      </div>`
    document.getElementById("promptCard").style.display = ""
  }

  function showPromptResult(text) {
    lastPrompt = text
    const el = document.getElementById("promptOutput")
    el.innerHTML = `<div class="prompt-text">${escapeHtml(text)}</div>`
  }

  function showPromptError(msg, retryData, retryDone) {
    const el = document.getElementById("promptOutput")
    document.getElementById("promptCard").style.display = ""
    const retryBtn = retryData
      ? `<button class="btn btn-small btn-retry">Retry</button>`
      : ""
    el.innerHTML = `<div class="prompt-error">${escapeHtml(msg)}${retryBtn}</div>`
    const btn = el.querySelector(".btn-retry")
    if (btn && retryData) {
      btn.addEventListener("click", () => generatePrompt(retryData, retryDone))
    }
  }

  function escapeHtml(str) {
    const div = document.createElement("div")
    div.textContent = str
    return div.innerHTML
  }

  // ── Capture screenshot ──────────────────────────────────
  function captureScreenshot() {
    return new Promise((resolve) => {
      chrome.storage.local.get({ aiModel: "gpt-4o-mini" }, (result) => {
        if (result.aiModel !== "gpt-4o") {
          resolve(null)
          return
        }
        chrome.tabs.captureVisibleTab(
          null,
          { format: "jpeg", quality: 70 },
          (dataUrl) => {
            if (chrome.runtime.lastError) {
              console.warn(
                "Screenshot failed:",
                chrome.runtime.lastError.message,
              )
              resolve(null)
              return
            }
            resolve(dataUrl)
          },
        )
      })
    })
  }

  // ── Call OpenAI via background script ─────────────────────
  function generatePrompt(designData, onDone) {
    showPromptLoading()

    captureScreenshot().then((screenshot) => {
      const msg = { action: "generatePrompt", designData }
      if (screenshot) msg.screenshot = screenshot

      chrome.runtime.sendMessage(msg, (response) => {
        if (chrome.runtime.lastError) {
          showPromptError(
            "Failed to reach background service",
            designData,
            onDone,
          )
          if (onDone) onDone()
          return
        }
        if (response.success) {
          showPromptResult(response.prompt)
          copyBtn.disabled = false
          toast("Prompt generated!")
        } else {
          showPromptError(response.error || "Unknown error", designData, onDone)
          toast("Prompt generation failed")
        }
        if (onDone) onDone()
      })
    })
  }

  // ── Storage helpers (chrome.storage.local) ────────────────
  function saveToHistory(data, prompt, model) {
    const entry = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      url: data.url,
      title: data.title,
      favicon: document.getElementById("favicon").src || "",
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

  // ── Render history list ───────────────────────────────────
  function renderHistory() {
    chrome.storage.local.get({ history: [] }, (result) => {
      const history = result.history
      const list = document.getElementById("historyList")
      const empty = document.getElementById("historyEmpty")
      const clearBtn = document.getElementById("btnClearHistory")

      if (history.length === 0) {
        list.innerHTML = ""
        empty.style.display = ""
        clearBtn.style.display = "none"
        return
      }

      empty.style.display = "none"
      clearBtn.style.display = ""

      list.innerHTML = history
        .map((entry) => {
          const date = new Date(entry.timestamp)
          const timeStr = date.toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          }) + " · " + date.toLocaleTimeString(undefined, {
            hour: "2-digit",
            minute: "2-digit",
          })
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
        })
        .join("")

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

      list.querySelectorAll(".history-item").forEach((item) => {
        item.addEventListener("click", () => {
          const id = Number(item.dataset.id)
          const entry = history.find((h) => h.id === id)
          if (entry) {
            lastAnalysis = entry.data
            lastPrompt = entry.prompt || ""
            renderResults(entry.data)

            if (entry.prompt) {
              showPromptResult(entry.prompt)
              document.getElementById("promptCard").style.display = ""
            } else {
              document.getElementById("promptCard").style.display = "none"
            }

            copyBtn.disabled = !entry.prompt
            document.getElementById("pageUrl").textContent = entry.url || ""
            document.getElementById("favicon").src = entry.favicon || ""
            tabBtns[0].click()
            toast("Loaded from history")
          }
        })
      })
    })
  }

  function getDomain(url) {
    try {
      return new URL(url).hostname
    } catch {
      return url
    }
  }

  // ── Clear history ─────────────────────────────────────────
  document.getElementById("btnClearHistory").addEventListener("click", () => {
    chrome.storage.local.set({ history: [] }, () => {
      renderHistory()
      toast("History cleared")
    })
  })

  // ── Generate (analyze) button ─────────────────────────────
  const genBtn = document.getElementById("btnGenerate")
  const copyBtn = document.getElementById("btnCopy")
  const statusText = document.getElementById("statusText")
  const defaultBtnHTML = genBtn.innerHTML

  genBtn.addEventListener("click", () => {
    genBtn.classList.add("loading")
    genBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
      </svg>
      Analyzing…`
    statusText.textContent = "Analyzing…"
    lastPrompt = ""
    document.getElementById("promptCard").style.display = "none"

    chrome.tabs.query({ active: true, currentWindow: true }, (activeTabs) => {
      const tabId = activeTabs[0].id

      function onSuccess(response) {
        lastAnalysis = response
        renderResults(response)

        genBtn.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
          </svg>
          Generating prompt…`
        statusText.textContent = "Generating prompt…"

        generatePrompt(response, () => {
          chrome.storage.local.get({ aiModel: "gpt-4o-mini" }, (r) => {
            saveToHistory(response, lastPrompt, r.aiModel)
          })

          genBtn.classList.remove("loading")
          genBtn.classList.add("success")
          genBtn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            Done`
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
          chrome.scripting.executeScript({ target: { tabId }, files: ["content.js"] }, () => {
            if (chrome.runtime.lastError) return onError(chrome.runtime.lastError.message)
            sendExtract()
          })
        } else {
          sendExtract()
        }
      })
    })
  })

  // ── Copy button — copies the generated prompt ─────────────
  copyBtn.addEventListener("click", () => {
    const text = lastPrompt || ""
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
  })
})

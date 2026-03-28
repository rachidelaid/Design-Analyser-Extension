document.addEventListener("DOMContentLoaded", () => {
  const html = document.documentElement

  // ── Toast helper ──────────────────────────────────────────
  let toastEl = document.createElement("div")
  toastEl.className = "toast"
  document.body.appendChild(toastEl)

  function toast(msg, duration = 1800) {
    toastEl.textContent = msg
    toastEl.classList.add("show")
    setTimeout(() => toastEl.classList.remove("show"), duration)
  }

  // ── Ripple effect on buttons ──────────────────────────────
  document.querySelectorAll(".btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const rect = btn.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * 100
      const y = ((e.clientY - rect.top) / rect.height) * 100
      btn.style.setProperty("--ripple-x", x + "%")
      btn.style.setProperty("--ripple-y", y + "%")
      btn.classList.add("ripple")
      setTimeout(() => btn.classList.remove("ripple"), 500)
    })
  })

  // ── Theme toggle ──────────────────────────────────────────
  const themeBtn = document.getElementById("themeToggle")
  const savedTheme = localStorage.getItem("da-theme") || "dark"
  html.setAttribute("data-theme", savedTheme)

  themeBtn.addEventListener("click", () => {
    const next = html.getAttribute("data-theme") === "dark" ? "light" : "dark"
    html.setAttribute("data-theme", next)
    localStorage.setItem("da-theme", next)
  })

  // ── URL & Favicon ─────────────────────────────────────────
  try {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        const url = tabs[0].url || ""
        document.getElementById("pageUrl").textContent = url
        const fav = tabs[0].favIconUrl
        if (fav) document.getElementById("favicon").src = fav
      }
    })
  } catch {
    // Running outside extension context — keep placeholder values
  }

  // ── Tabs ────────────────────────
  const tabsBtns = tabs.querySelectorAll(".segment-btn")
  tabs.setAttribute("data-active", "0")

  tabsBtns.forEach((btn, i) => {
    btn.addEventListener("click", () => {
      tabsBtns.forEach((b) => b.classList.remove("active"))
      btn.classList.add("active")
      tabs.setAttribute("data-active", String(i))
      toast(`Tab: ${btn.dataset.value}`)
    })
  })

  // ── Color swatch copy ─────────────────────────────────────
  document.querySelectorAll(".color-swatch").forEach((swatch) => {
    swatch.addEventListener("click", () => {
      const hex = swatch.dataset.color
      navigator.clipboard.writeText(hex).then(() => {
        swatch.classList.add("copied")
        toast(`Copied ${hex}`)
        setTimeout(() => swatch.classList.remove("copied"), 1500)
      })
    })
  })

  // ── Generate button ───────────────────────────────────────
  const genBtn = document.getElementById("btnGenerate")
  genBtn.addEventListener("click", () => {
    genBtn.classList.add("loading")
    genBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
      </svg>
      Analyzing…`

    setTimeout(() => {
      genBtn.classList.remove("loading")
      genBtn.classList.add("success")
      genBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        Prompt Ready`
      toast("Prompt generated!")

      setTimeout(() => {
        genBtn.classList.remove("success")
        genBtn.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
          </svg>
          Generate Prompt`
      }, 2200)
    }, 1600)
  })

  // ── Copy button ───────────────────────────────────────────
  const copyBtn = document.getElementById("btnCopy")
  copyBtn.addEventListener("click", () => {
    navigator.clipboard
      .writeText("/* Generated design prompt would appear here */")
      .then(() => {
        const orig = copyBtn.innerHTML
        copyBtn.classList.add("success")
        copyBtn.innerHTML = `
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          Copied!`
        toast("Copied to clipboard")
        setTimeout(() => {
          copyBtn.classList.remove("success")
          copyBtn.innerHTML = orig
        }, 1800)
      })
  })

  // ── Open in platform ──────────────────────────────────────
  const openBtn = document.getElementById("btnOpen")
  openBtn.addEventListener("click", () => {
    const urls = {
      v0: "https://v0.dev",
      bolt: "https://bolt.new",
      cursor: "https://cursor.sh",
    }
    const target = urls[platformSel.value] || urls.v0
    toast(`Opening ${platformSel.value}…`)
    setTimeout(() => window.open(target, "_blank"), 400)
  })
})

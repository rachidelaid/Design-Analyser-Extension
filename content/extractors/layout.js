function analyzeLayout() {
  const anchorLinks = document.querySelectorAll('a[href^="#"]')
  const pageLinks = Array.from(document.querySelectorAll("a[href]")).filter((a) => {
    try {
      const url = new URL(a.href, location.origin)
      return url.origin === location.origin && url.pathname !== location.pathname
    } catch {
      return false
    }
  })

  let type
  if (pageLinks.length > 3) {
    const uniquePaths = new Set(pageLinks.map((a) => new URL(a.href).pathname))
    type = `multi-page site (${uniquePaths.size} internal pages: ${Array.from(uniquePaths).slice(0, 5).join(", ")}${uniquePaths.size > 5 ? "…" : ""})`
  } else if (anchorLinks.length > 2) {
    type = "single-page with anchor navigation (one HTML file, scroll between sections)"
  } else {
    type = "single-page (one scrollable page, no section anchors)"
  }

  return {
    type,
    hasNavigation: !!document.querySelector('nav, [class*="nav"], [class*="menu"]'),
    gridSystem: detectGridSystem(),
    containerWidth: detectContainerWidth(),
  }
}

function detectContainerWidth() {
  const container = document.querySelector(
    '[class*="container"], [class*="wrapper"], main, [role="main"]'
  )
  if (!container) return ""
  const s = getComputedStyle(container)
  return s.maxWidth !== "none" ? s.maxWidth : s.width
}

function detectGridSystem() {
  const els = sampleElements("*", 150)
  let usesGrid = false
  let usesFlex = false
  for (const el of els) {
    const display = getComputedStyle(el).display
    if (display === "grid" || display === "inline-grid") usesGrid = true
    if (display === "flex" || display === "inline-flex") usesFlex = true
    if (usesGrid && usesFlex) break
  }
  if (usesGrid && usesFlex) return "grid + flexbox"
  if (usesGrid) return "grid"
  if (usesFlex) return "flexbox"
  return "block"
}

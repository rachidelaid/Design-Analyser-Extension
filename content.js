if (!window.__designAnalyzerLoaded) {
  window.__designAnalyzerLoaded = true

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "ping") {
      sendResponse({ status: "ok" })
      return
    }
    if (request.action === "extractDesign") {
      const designData = extractDesignInfo()
      sendResponse(designData)
    }
  })
}

function extractDesignInfo() {
  return {
    url: window.location.href,
    title: document.title,
    colors: extractColorPalette(),
    typography: extractTypography(),
    layout: analyzeLayout(),
    components: detectComponents(),
    interactions: detectInteractions(),
    responsive: detectResponsive(),
    cssVariables: extractCSSVariables(),
    domStructure: extractDOMStructure(),
    spacing: extractSpacing(),
  }
}

function extractColorPalette() {
  const colors = new Set()

  const bodyStyles = getComputedStyle(document.body)
  addColor(colors, bodyStyles.backgroundColor)
  addColor(colors, bodyStyles.color)

  const selectors = "h1, h2, h3, h4, h5, h6, p, a, button, nav, header, footer, section, [class*='hero'], [class*='card'], [class*='btn'], [class*='banner']"
  document.querySelectorAll(selectors).forEach((el) => {
    const styles = getComputedStyle(el)
    addColor(colors, styles.color)
    addColor(colors, styles.backgroundColor)
    addColor(colors, styles.borderColor)
  })

  return Array.from(colors).slice(0, 8)
}

function addColor(set, raw) {
  if (!raw) return
  const hex = rgbToHex(raw)
  if (hex && hex !== "#000000" && hex !== "#ffffff" && hex !== "transparent") {
    set.add(hex)
  }
}

function rgbToHex(rgb) {
  if (!rgb || rgb === "transparent") return null
  const rgbaMatch = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/)
  if (!rgbaMatch) return rgb.startsWith("#") ? rgb : null
  const a = parseFloat(rgbaMatch[4] ?? "1")
  if (a < 0.1) return null
  return (
    "#" +
    rgbaMatch
      .slice(1, 4)
      .map((x) => parseInt(x).toString(16).padStart(2, "0"))
      .join("")
  )
}

function extractTypography() {
  const headings = []
  const bodyText = []

  const h1 = document.querySelector("h1")
  if (h1) {
    const styles = getComputedStyle(h1)
    headings.push({
      font: styles.fontFamily,
      size: styles.fontSize,
      weight: styles.fontWeight,
      lineHeight: styles.lineHeight,
      sample: h1.innerText.slice(0, 50),
    })
  }

  const h2 = document.querySelector("h2")
  if (h2) {
    const styles = getComputedStyle(h2)
    headings.push({
      font: styles.fontFamily,
      size: styles.fontSize,
      weight: styles.fontWeight,
      lineHeight: styles.lineHeight,
      sample: h2.innerText.slice(0, 50),
    })
  }

  const p = document.querySelector("p")
  if (p) {
    const styles = getComputedStyle(p)
    bodyText.push({
      font: styles.fontFamily,
      size: styles.fontSize,
      weight: styles.fontWeight,
      lineHeight: styles.lineHeight,
    })
  }

  return { headings, bodyText }
}

function analyzeLayout() {
  return {
    type:
      document.body.scrollHeight > window.innerHeight
        ? "multi-page"
        : "single-page",
    hasNavigation: !!document.querySelector(
      'nav, [class*="nav"], [class*="menu"]',
    ),
    sectionCount: document.querySelectorAll('section, [class*="section"]')
      .length,
    gridSystem: detectGridSystem(),
  }
}

function detectComponents() {
  const components = []

  if (document.querySelector('[class*="hero"], .hero, header'))
    components.push("hero")
  if (document.querySelector('[class*="testimonial"], .quote'))
    components.push("testimonials")
  if (document.querySelector('[class*="card"], .card')) components.push("cards")
  if (document.querySelector('form, [class*="form"]')) components.push("forms")
  if (document.querySelector('[class*="value"], .values'))
    components.push("values-section")
  if (document.querySelector('[class*="pricing"], .pricing'))
    components.push("pricing")
  if (document.querySelector('[class*="gallery"], .gallery'))
    components.push("gallery")
  if (document.querySelector("footer")) components.push("footer")

  return components
}

function detectInteractions() {
  const interactions = []

  const hasTransitions = sampleElements('a, button, [class*="card"], [class*="btn"]', 30).some((el) => {
    const styles = getComputedStyle(el)
    return styles.transition && styles.transition !== "all 0s ease 0s" && styles.transition !== "none"
  })
  if (hasTransitions) interactions.push("transitions")

  const hasAnimations = sampleElements("*", 100).some((el) => {
    const styles = getComputedStyle(el)
    return styles.animationName && styles.animationName !== "none"
  })
  if (hasAnimations) interactions.push("animations")

  const hasTransforms = sampleElements("*", 100).some((el) => {
    return getComputedStyle(el).transform !== "none"
  })
  if (hasTransforms) interactions.push("transforms")

  return interactions
}

function sampleElements(selector, limit) {
  const all = document.querySelectorAll(selector)
  if (all.length <= limit) return Array.from(all)
  const step = Math.floor(all.length / limit)
  const sampled = []
  for (let i = 0; i < all.length && sampled.length < limit; i += step) {
    sampled.push(all[i])
  }
  return sampled
}

function detectResponsive() {
  const viewport = document.querySelector('meta[name="viewport"]')
  const hasViewport = !!viewport

  const hasMediaQueries = Array.from(document.styleSheets).some((sheet) => {
    try {
      return Array.from(sheet.cssRules || []).some((rule) => rule.media)
    } catch {
      return false
    }
  })

  return { hasViewport, hasMediaQueries }
}

function extractCSSVariables() {
  const vars = {}

  Array.from(document.styleSheets).forEach((sheet) => {
    try {
      Array.from(sheet.cssRules || []).forEach((rule) => {
        if (rule.style) {
          for (let i = 0; i < rule.style.length; i++) {
            const prop = rule.style[i]
            if (prop.startsWith("--")) {
              const value = rule.style.getPropertyValue(prop).trim()
              if (value && !vars[prop]) vars[prop] = value
            }
          }
        }
      })
    } catch {
      // Cross-origin stylesheet, skip
    }
  })

  return vars
}

function extractDOMStructure() {
  function summarize(el, depth) {
    if (depth > 4) return null
    const tag = el.tagName.toLowerCase()
    const skip = new Set(["script", "style", "link", "meta", "noscript", "svg", "path", "br", "hr"])
    if (skip.has(tag)) return null

    const classes = el.className && typeof el.className === "string"
      ? el.className.split(/\s+/).filter(Boolean).slice(0, 3).join(".")
      : ""
    const role = el.getAttribute("role") || ""
    const label = tag + (classes ? "." + classes : "") + (role ? `[role=${role}]` : "")

    const textContent = el.childNodes.length === 1 && el.childNodes[0].nodeType === 3
      ? el.childNodes[0].textContent.trim().slice(0, 40)
      : ""

    const children = Array.from(el.children)
      .map((c) => summarize(c, depth + 1))
      .filter(Boolean)
      .slice(0, 8)

    return { tag: label, text: textContent || undefined, children: children.length ? children : undefined }
  }

  return summarize(document.body, 0)
}

function extractSpacing() {
  const spacings = new Set()
  const els = sampleElements("section, div, main, article, [class*='container'], [class*='wrapper']", 20)

  els.forEach((el) => {
    const s = getComputedStyle(el)
    ;[s.paddingTop, s.paddingBottom, s.marginTop, s.marginBottom, s.gap].forEach((v) => {
      if (v && v !== "0px" && v !== "normal") spacings.add(v)
    })
  })

  return Array.from(spacings).sort((a, b) => parseFloat(a) - parseFloat(b)).slice(0, 10)
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

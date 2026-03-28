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

function extractDesignInfo() {
  return {
    url: window.location.href,
    title: document.title,

    // Colors
    colors: extractColorPalette(),

    // Typography
    typography: extractTypography(),

    // Layout
    layout: analyzeLayout(),

    // Components
    components: detectComponents(),

    // Interactions
    interactions: detectInteractions(),

    // Responsive
    responsive: detectResponsive(),

    // Raw CSS variables
    cssVariables: extractCSSVariables(),
  }
}

function extractColorPalette() {
  const colors = new Set()

  // Extract from body background and text
  const bodyStyles = getComputedStyle(document.body)
  colors.add(bodyStyles.backgroundColor)
  colors.add(bodyStyles.color)

  // Extract from common elements
  document
    .querySelectorAll("h1, h2, h3, button, a, .hero, .testimonial")
    .forEach((el) => {
      const styles = getComputedStyle(el)
      if (styles.color) colors.add(styles.color)
      if (styles.backgroundColor) colors.add(styles.backgroundColor)
    })

  return Array.from(colors).slice(0, 6).map(rgbToHex)
}

function extractTypography() {
  const headings = []
  const bodyText = []

  // Get H1 styles
  const h1 = document.querySelector("h1")
  if (h1) {
    const styles = getComputedStyle(h1)
    headings.push({
      font: styles.fontFamily,
      size: styles.fontSize,
      weight: styles.fontWeight,
      sample: h1.innerText.slice(0, 50),
    })
  }

  // Get body text styles
  const p = document.querySelector("p")
  if (p) {
    const styles = getComputedStyle(p)
    bodyText.push({
      font: styles.fontFamily,
      size: styles.fontSize,
      weight: styles.fontWeight,
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
  if (document.querySelector("footer")) components.push("footer")

  return components
}

function detectInteractions() {
  const interactions = []

  // Check for hover effects
  const hasHover = Array.from(
    document.querySelectorAll('a, button, [class*="card"]'),
  ).some((el) => {
    const hoverStyle = getComputedStyle(el, ":hover")
    return hoverStyle.opacity !== "1" || hoverStyle.transform !== "none"
  })

  if (hasHover) interactions.push("hover-effects")

  // Check for animations
  const hasAnimations = Array.from(document.querySelectorAll("*")).some(
    (el) => {
      const animation = getComputedStyle(el).animation
      return animation !== "none"
    },
  )

  if (hasAnimations) interactions.push("animations")

  return interactions
}

function detectResponsive() {
  // Check for viewport meta tag
  const viewport = document.querySelector('meta[name="viewport"]')
  const hasViewport = !!viewport

  // Check for media queries (simplified)
  const hasMediaQueries = Array.from(document.styleSheets).some((sheet) => {
    try {
      return Array.from(sheet.cssRules || []).some((rule) => rule.media)
    } catch (e) {
      return false
    }
  })

  return { hasViewport, hasMediaQueries }
}

function extractCSSVariables() {
  const vars = {}
  const styles = getComputedStyle(document.documentElement)

  // Extract common CSS custom properties
  ;["--primary", "--secondary", "--accent", "--background", "--text"].forEach(
    (v) => {
      const value = styles.getPropertyValue(v)
      if (value) vars[v] = value.trim()
    },
  )

  return vars
}

function detectGridSystem() {
  const allEls = document.querySelectorAll("*")
  let usesGrid = false
  let usesFlex = false

  for (const el of allEls) {
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

// Helper: Convert RGB to HEX
function rgbToHex(rgb) {
  if (!rgb) return "#000000"
  const match = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
  if (!match) return rgb
  return (
    "#" +
    match
      .slice(1)
      .map((x) => parseInt(x).toString(16).padStart(2, "0"))
      .join("")
  )
}

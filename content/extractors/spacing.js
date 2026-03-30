function extractSpacing() {
  const mapped = []

  const targets = [
    { selector: "section, [class*='section']", label: "section" },
    { selector: '[class*="container"], [class*="wrapper"], main', label: "container" },
    { selector: '[class*="card"], .card', label: "card" },
    { selector: '[class*="hero"], header', label: "hero" },
    { selector: "nav", label: "nav" },
    { selector: "footer", label: "footer" },
  ]

  targets.forEach(({ selector, label }) => {
    const el = document.querySelector(selector)
    if (!el) return
    const s = getComputedStyle(el)
    const vals = {}
    if (s.paddingTop !== "0px") vals.paddingY = s.paddingTop
    if (s.paddingLeft !== "0px") vals.paddingX = s.paddingLeft
    if (s.gap && s.gap !== "normal" && s.gap !== "0px") vals.gap = s.gap
    if (s.marginTop !== "0px" && s.marginTop !== "auto") vals.marginTop = s.marginTop
    if (s.borderRadius !== "0px") vals.borderRadius = s.borderRadius
    if (Object.keys(vals).length) mapped.push({ component: label, ...vals })
  })

  return mapped
}

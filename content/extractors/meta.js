function detectResponsive() {
  const viewport = document.querySelector('meta[name="viewport"]')
  return {
    hasViewport: !!viewport,
    hasMediaQueries: Array.from(document.styleSheets).some((sheet) => {
      try {
        return Array.from(sheet.cssRules || []).some((rule) => rule.media)
      } catch {
        return false
      }
    }),
  }
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
      /* cross-origin */
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

    const classes =
      el.className && typeof el.className === "string"
        ? el.className
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 3)
            .join(".")
        : ""
    const role = el.getAttribute("role") || ""
    const label = tag + (classes ? "." + classes : "") + (role ? `[role=${role}]` : "")

    const textContent =
      el.childNodes.length === 1 && el.childNodes[0].nodeType === 3
        ? el.childNodes[0].textContent.trim().slice(0, 40)
        : ""

    const children = Array.from(el.children)
      .map((c) => summarize(c, depth + 1))
      .filter(Boolean)
      .slice(0, 8)

    return {
      tag: label,
      text: textContent || undefined,
      children: children.length ? children : undefined,
    }
  }
  return summarize(document.body, 0)
}

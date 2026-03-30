function extractTypography() {
  const headings = []
  const bodyText = []

  const h1 = document.querySelector("h1")
  if (h1) {
    const styles = getComputedStyle(h1)
    headings.push({
      tag: "h1",
      font: styles.fontFamily,
      size: styles.fontSize,
      weight: styles.fontWeight,
      lineHeight: styles.lineHeight,
      letterSpacing: styles.letterSpacing,
      sample: h1.innerText.slice(0, 50),
    })
  }

  const h2 = document.querySelector("h2")
  if (h2) {
    const styles = getComputedStyle(h2)
    headings.push({
      tag: "h2",
      font: styles.fontFamily,
      size: styles.fontSize,
      weight: styles.fontWeight,
      lineHeight: styles.lineHeight,
      letterSpacing: styles.letterSpacing,
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
      letterSpacing: styles.letterSpacing,
    })
  }

  return { headings, bodyText }
}

function detectFontSources() {
  const sources = []

  document.querySelectorAll('link[href*="fonts.googleapis.com"]').forEach((link) => {
    const href = link.getAttribute("href")
    const familyMatch = href.match(/family=([^&:]+)/)
    if (familyMatch) {
      familyMatch[1].split("|").forEach((f) => {
        sources.push({
          name: decodeURIComponent(f.replace(/\+/g, " ")),
          source: "Google Fonts",
          url: href,
          usable: true,
        })
      })
    }
  })

  document
    .querySelectorAll('link[href*="fonts.bunny.net"], link[href*="use.typekit.net"]')
    .forEach((link) => {
      const href = link.getAttribute("href")
      const provider = href.includes("typekit") ? "Adobe Fonts" : "Bunny Fonts"
      sources.push({ name: "(see stylesheet)", source: provider, url: href, usable: true })
    })

  Array.from(document.styleSheets).forEach((sheet) => {
    try {
      Array.from(sheet.cssRules || []).forEach((rule) => {
        if (rule instanceof CSSFontFaceRule) {
          const family = rule.style.getPropertyValue("font-family").replace(/['"]/g, "").trim()
          const src = rule.style.getPropertyValue("src") || ""
          if (family && !sources.some((s) => s.name === family)) {
            const urlMatch = src.match(/url\(["']?([^"')]+)/)
            const url = urlMatch ? urlMatch[1] : ""
            const isGoogleCDN =
              url.includes("fonts.gstatic.com") || url.includes("fonts.googleapis.com")
            const isPublicCDN =
              isGoogleCDN ||
              url.includes("cdn.") ||
              url.includes("cdnjs.") ||
              url.includes("unpkg.com") ||
              url.includes("jsdelivr.net")
            const isLocal =
              !isPublicCDN &&
              (url.startsWith("/") ||
                url.startsWith("../") ||
                url.startsWith("./") ||
                url.includes("localhost"))

            sources.push({
              name: family,
              source: isGoogleCDN
                ? "Google Fonts"
                : isPublicCDN
                  ? "CDN"
                  : isLocal
                    ? "local file"
                    : "@font-face",
              url: url.slice(0, 150),
              usable: !isLocal,
              fallback: isLocal ? suggestFallback(family) : "",
            })
          }
        }
      })
    } catch {
      // cross-origin
    }
  })

  const usedFonts = new Set()
  document.querySelectorAll("h1, h2, h3, p, button, a").forEach((el) => {
    const font = getComputedStyle(el).fontFamily.split(",")[0].replace(/['"]/g, "").trim()
    usedFonts.add(font)
  })
  usedFonts.forEach((font) => {
    if (!sources.some((s) => s.name.toLowerCase() === font.toLowerCase())) {
      const isSystem =
        /^(Arial|Helvetica|Times|Georgia|Verdana|Courier|system-ui|sans-serif|serif|monospace|-apple-system|BlinkMacSystemFont|Segoe UI)$/i.test(
          font
        )
      if (!isSystem) {
        sources.push({
          name: font,
          source: "unknown (no @font-face or link found)",
          url: "",
          usable: false,
          fallback: suggestFallback(font),
        })
      }
    }
  })

  return sources
}

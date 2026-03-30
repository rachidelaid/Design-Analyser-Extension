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
    identity: extractIdentity(),
    colorMap: extractColorMap(),
    typography: extractTypography(),
    fontSources: detectFontSources(),
    layout: analyzeLayout(),
    sections: extractSections(),
    forms: extractForms(),
    interactions: detectInteractions(),
    images: extractImages(),
    assets: detectAssets(),
    responsive: detectResponsive(),
    cssVariables: extractCSSVariables(),
    domStructure: extractDOMStructure(),
    spacing: extractSpacing(),
  }
}

// ── Product identity ──────────────────────────────────────

function extractIdentity() {
  const meta = (name) => {
    const el = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`)
    return el ? el.getAttribute("content") : ""
  }

  const heroEl = document.querySelector('[class*="hero"], header, [role="banner"]')
  const heroHeading = heroEl ? heroEl.querySelector("h1, h2") : document.querySelector("h1")
  const heroSub = heroEl
    ? heroEl.querySelector("p, [class*='subtitle'], [class*='description']")
    : null

  const ctaButtons = Array.from(
    document.querySelectorAll('[class*="hero"] a, [class*="hero"] button, header a[class*="btn"], header button[class*="cta"], .cta, [class*="cta"]')
  )
    .map((el) => el.innerText.trim())
    .filter((t) => t.length > 0 && t.length < 40)
    .slice(0, 3)

  const logoEl = document.querySelector('[class*="logo"], [rel="icon"], header img, header svg')
  const logoText = logoEl ? (logoEl.alt || logoEl.innerText || "").trim() : ""

  return {
    description: meta("description") || meta("og:description") || "",
    ogTitle: meta("og:title") || "",
    ogImage: meta("og:image") || "",
    heroHeading: heroHeading ? heroHeading.innerText.trim().slice(0, 120) : "",
    heroSubtext: heroSub ? heroSub.innerText.trim().slice(0, 200) : "",
    ctaButtons,
    brandName: logoText || meta("application-name") || "",
  }
}

// ── Colors with roles ─────────────────────────────────────

function extractColorMap() {
  const map = []
  const seen = new Set()

  function add(hex, role) {
    if (!hex || hex === "transparent") return
    if (seen.has(hex + role)) return
    seen.add(hex + role)
    const existing = map.find((c) => c.hex === hex)
    if (existing) {
      if (!existing.roles.includes(role)) existing.roles.push(role)
    } else {
      map.push({ hex, roles: [role] })
    }
  }

  const bodyS = getComputedStyle(document.body)
  add(rgbToHex(bodyS.backgroundColor), "page background")
  add(rgbToHex(bodyS.color), "body text")

  const htmlS = getComputedStyle(document.documentElement)
  add(rgbToHex(htmlS.backgroundColor), "page background")

  const h1 = document.querySelector("h1")
  if (h1) add(rgbToHex(getComputedStyle(h1).color), "heading text")
  const h2 = document.querySelector("h2")
  if (h2) add(rgbToHex(getComputedStyle(h2).color), "heading text")

  const link = document.querySelector("a:not([class*='btn']):not([class*='cta'])")
  if (link) add(rgbToHex(getComputedStyle(link).color), "link text")

  document.querySelectorAll('button, [class*="btn"], [class*="cta"]').forEach((el) => {
    const s = getComputedStyle(el)
    add(rgbToHex(s.backgroundColor), "button/CTA background")
    add(rgbToHex(s.color), "button/CTA text")
    add(rgbToHex(s.borderColor), "button border")
  })

  document.querySelectorAll('[class*="card"], .card').forEach((el) => {
    const s = getComputedStyle(el)
    add(rgbToHex(s.backgroundColor), "card background")
    add(rgbToHex(s.borderColor), "card border")
  })

  document.querySelectorAll("nav, [class*='nav']").forEach((el) => {
    add(rgbToHex(getComputedStyle(el).backgroundColor), "nav background")
  })

  document.querySelectorAll("footer").forEach((el) => {
    add(rgbToHex(getComputedStyle(el).backgroundColor), "footer background")
  })

  document.querySelectorAll("section, [class*='section']").forEach((el) => {
    const bg = rgbToHex(getComputedStyle(el).backgroundColor)
    if (bg) {
      const existing = map.find((c) => c.hex === bg)
      if (!existing) add(bg, "section background")
    }
  })

  document.querySelectorAll("p").forEach((el) => {
    add(rgbToHex(getComputedStyle(el).color), "body text")
  })

  const muted = document.querySelector('[class*="muted"], [class*="secondary"], [class*="subtle"], small, .text-muted')
  if (muted) add(rgbToHex(getComputedStyle(muted).color), "muted/secondary text")

  return map.filter((c) => c.hex).slice(0, 12)
}

function rgbToHex(rgb) {
  if (!rgb || rgb === "transparent") return null
  const rgbaMatch = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/)
  if (!rgbaMatch) return rgb.startsWith("#") ? rgb : null
  const a = parseFloat(rgbaMatch[4] ?? "1")
  if (a < 0.1) return null
  const r = parseInt(rgbaMatch[1])
  const g = parseInt(rgbaMatch[2])
  const b = parseInt(rgbaMatch[3])
  if (r === 0 && g === 0 && b === 0) return null
  if (r === 255 && g === 255 && b === 255) return null
  return "#" + [r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("")
}

// ── Typography + font sources ─────────────────────────────

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

  document.querySelectorAll('link[href*="fonts.bunny.net"], link[href*="use.typekit.net"]').forEach((link) => {
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
            const isGoogleCDN = url.includes("fonts.gstatic.com") || url.includes("fonts.googleapis.com")
            const isPublicCDN = isGoogleCDN || url.includes("cdn.") || url.includes("cdnjs.") || url.includes("unpkg.com") || url.includes("jsdelivr.net")
            const isLocal = !isPublicCDN && (url.startsWith("/") || url.startsWith("../") || url.startsWith("./") || url.includes("localhost"))

            sources.push({
              name: family,
              source: isGoogleCDN ? "Google Fonts" : isPublicCDN ? "CDN" : isLocal ? "local file" : "@font-face",
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
      const isSystem = /^(Arial|Helvetica|Times|Georgia|Verdana|Courier|system-ui|sans-serif|serif|monospace|-apple-system|BlinkMacSystemFont|Segoe UI)$/i.test(font)
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

function suggestFallback(fontName) {
  const name = fontName.toLowerCase()
  if (/mono|code|consola|courier/i.test(name)) return 'Use "JetBrains Mono" or "Fira Code" from Google Fonts, or system monospace'
  if (/serif/i.test(name) && !/sans/i.test(name)) return 'Use "Merriweather" or "Lora" from Google Fonts, or system serif'
  if (/display|heading|title/i.test(name)) return 'Use "Plus Jakarta Sans" or "Space Grotesk" from Google Fonts'
  return `Search Google Fonts for "${fontName}" — if unavailable, use "Inter" or "Plus Jakarta Sans" as a sans-serif fallback`
}

// ── Layout ────────────────────────────────────────────────

function analyzeLayout() {
  const anchorLinks = document.querySelectorAll('a[href^="#"]')
  const pageLinks = Array.from(document.querySelectorAll('a[href]')).filter((a) => {
    try {
      const url = new URL(a.href, location.origin)
      return url.origin === location.origin && url.pathname !== location.pathname
    } catch { return false }
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
  const container = document.querySelector('[class*="container"], [class*="wrapper"], main, [role="main"]')
  if (!container) return ""
  const s = getComputedStyle(container)
  return s.maxWidth !== "none" ? s.maxWidth : s.width
}

// ── Sections (every one, with purpose + CTAs) ─────────────

function extractSections() {
  const sectionEls = document.querySelectorAll("section, [class*='section'], main > div, article")
  const sections = []

  sectionEls.forEach((el, i) => {
    if (i >= 25) return
    const heading = el.querySelector("h1, h2, h3")
    const headingText = heading ? heading.innerText.trim().slice(0, 80) : ""
    const className = typeof el.className === "string" ? el.className : ""
    const id = el.id || ""
    const purpose = guessSectionPurpose(el, className, id, headingText)

    const subheading = el.querySelector("p, [class*='subtitle'], [class*='desc']")
    const subText = subheading && subheading !== heading ? subheading.innerText.trim().slice(0, 100) : ""

    const ctas = Array.from(el.querySelectorAll('button, a[class*="btn"], a[class*="cta"], [class*="button"]'))
      .map((b) => b.innerText.trim())
      .filter((t) => t.length > 0 && t.length < 50)
      .slice(0, 3)

    const keyEls = []
    if (el.querySelector("form")) keyEls.push("form")
    const imgCount = el.querySelectorAll("img, picture, video").length
    if (imgCount > 0) keyEls.push(`${imgCount} image${imgCount > 1 ? "s" : ""}`)
    const cardCount = el.querySelectorAll('[class*="card"], [class*="col"]').length
    if (cardCount > 1) keyEls.push(`${cardCount} cards/columns`)
    if (el.querySelector("blockquote, [class*='testimonial'], [class*='quote']")) keyEls.push("testimonial")
    if (el.querySelector("ul, ol")) keyEls.push("list")
    if (el.querySelector("table, [class*='table']")) keyEls.push("table")

    sections.push({
      index: i + 1,
      purpose,
      heading: headingText,
      subheading: subText,
      ctas,
      elements: keyEls,
    })
  })

  return sections
}

function guessSectionPurpose(el, cls, id, heading) {
  const text = (cls + " " + id + " " + heading).toLowerCase()
  const patterns = [
    [/hero|banner|jumbotron|splash/, "hero"],
    [/nav|menu|topbar|header/, "navigation"],
    [/footer|bottom|colophon/, "footer"],
    [/feature|benefit|why|advantage/, "features"],
    [/pricing|plan|tier/, "pricing"],
    [/testimon|review|quote|social.?proof/, "testimonials"],
    [/faq|question|accordion/, "FAQ"],
    [/team|people|about.?us|staff/, "team/about"],
    [/contact|get.?in.?touch|reach/, "contact"],
    [/newsletter|subscribe|signup|cta/, "CTA/signup"],
    [/gallery|portfolio|showcase|work/, "gallery/portfolio"],
    [/blog|article|post|news/, "blog/news"],
    [/partner|client|logo|trust|brand/, "trust/logos"],
    [/stat|number|metric|counter/, "stats/metrics"],
    [/how.?it.?work|step|process/, "how-it-works"],
    [/integrat|connect|api/, "integrations"],
    [/comparison|vs|versus/, "comparison"],
    [/download|install|get.?started/, "download/get-started"],
    [/resource|doc|guide|learn/, "resources/docs"],
    [/communit|open.?source|contribut/, "community"],
  ]

  for (const [re, label] of patterns) {
    if (re.test(text)) return label
  }

  if (el.querySelector("form")) return "form section"
  if (el.querySelectorAll("img, picture").length > 3) return "media/gallery"

  const innerText = el.innerText.trim()
  if (innerText.length < 20) return "spacer/divider"
  if (innerText.length < 80) return "brief content block"
  return "content section"
}

// ── Forms ─────────────────────────────────────────────────

function extractForms() {
  const forms = []

  document.querySelectorAll("form").forEach((form, i) => {
    if (i >= 5) return
    const fields = Array.from(form.querySelectorAll("input, textarea, select")).map((el) => {
      const tag = el.tagName.toLowerCase()
      const type = el.getAttribute("type") || (tag === "textarea" ? "textarea" : tag === "select" ? "select" : "text")
      return {
        type,
        name: el.name || el.id || "",
        placeholder: el.placeholder || "",
        required: el.required,
      }
    }).slice(0, 15)

    const submitBtn = form.querySelector('button[type="submit"], input[type="submit"], button:not([type])')
    const heading = form.closest("section, [class*='section']")?.querySelector("h1, h2, h3")

    const className = typeof form.className === "string" ? form.className : ""
    let purpose = "unknown"
    const clsText = (className + " " + (form.id || "") + " " + (heading ? heading.innerText : "")).toLowerCase()
    if (/contact|message|inquiry/.test(clsText)) purpose = "contact"
    else if (/newsletter|subscribe|email/.test(clsText)) purpose = "newsletter signup"
    else if (/login|signin|sign.in/.test(clsText)) purpose = "login"
    else if (/register|signup|sign.up|create.account/.test(clsText)) purpose = "registration"
    else if (/search/.test(clsText)) purpose = "search"
    else if (/comment/.test(clsText)) purpose = "comments"
    else if (fields.length <= 2) purpose = "simple input (likely newsletter/search)"
    else purpose = "multi-field form"

    forms.push({
      purpose,
      fields,
      submitText: submitBtn ? submitBtn.innerText.trim() || submitBtn.value || "Submit" : "",
    })
  })

  return forms
}

// ── Interactions ──────────────────────────────────────────

function detectInteractions() {
  const transitions = []
  const animations = []
  const transforms = []

  sampleElements('a, button, [class*="card"], [class*="btn"], [class*="link"]', 40).forEach((el) => {
    const s = getComputedStyle(el)
    if (s.transition && s.transition !== "all 0s ease 0s" && s.transition !== "none") {
      const parts = s.transition.split(",").map((t) => t.trim()).slice(0, 3)
      parts.forEach((t) => {
        if (!transitions.includes(t)) transitions.push(t)
      })
    }
  })

  sampleElements("*", 80).forEach((el) => {
    const s = getComputedStyle(el)
    if (s.animationName && s.animationName !== "none") {
      const entry = `${s.animationName} ${s.animationDuration} ${s.animationTimingFunction}`
      if (!animations.includes(entry)) animations.push(entry)
    }
    if (s.transform !== "none") {
      if (!transforms.includes(s.transform)) transforms.push(s.transform)
    }
  })

  return {
    transitions: transitions.slice(0, 8),
    animations: animations.slice(0, 5),
    transforms: transforms.slice(0, 5),
  }
}

// ── Images (described, not just counted) ──────────────────

function extractImages() {
  const results = []
  const imgs = document.querySelectorAll("img, picture")

  imgs.forEach((el, i) => {
    if (i >= 20) return
    const img = el.tagName === "PICTURE" ? el.querySelector("img") : el
    if (!img) return

    const src = (img.src || img.currentSrc || "").toLowerCase()
    const alt = (img.alt || "").trim()
    const w = img.naturalWidth || img.width || 0
    const h = img.naturalHeight || img.height || 0

    const section = img.closest("section, [class*='section'], header, footer, main > div")
    const sectionClass = section && typeof section.className === "string" ? section.className : ""
    const sectionId = section ? section.id || "" : ""
    const context = (sectionClass + " " + sectionId).toLowerCase()

    let role = "decorative"
    if (/logo/i.test(alt) || /logo/i.test(img.className || "")) role = "logo"
    else if (/hero|banner/.test(context) && w > 400) role = "hero image"
    else if (/avatar|team|author|profile/.test(alt) || /avatar|team/.test(img.className || "")) role = "avatar/photo"
    else if (/screenshot|product|app|dashboard/.test(alt)) role = "product screenshot"
    else if (src.endsWith(".svg") || src.includes("/icon")) role = "icon/illustration"
    else if (/card/.test(context) || img.closest('[class*="card"]')) role = "card thumbnail"
    else if (w > 600 && h > 300) role = "large feature image"
    else if (w < 100 && h < 100) role = "icon"

    let format = "unknown"
    if (src.includes(".svg")) format = "SVG"
    else if (src.includes(".webp")) format = "WebP"
    else if (src.includes(".png")) format = "PNG"
    else if (src.includes(".jpg") || src.includes(".jpeg")) format = "JPEG"
    else if (src.includes(".gif")) format = "GIF"
    else if (src.startsWith("data:image/")) format = src.split(";")[0].replace("data:image/", "").toUpperCase()

    results.push({
      role,
      alt: alt.slice(0, 80) || "(no alt text)",
      dimensions: w && h ? `${w}×${h}` : "unknown",
      format,
    })
  })

  const roles = {}
  results.forEach((img) => {
    roles[img.role] = (roles[img.role] || 0) + 1
  })

  return {
    total: imgs.length,
    breakdown: roles,
    details: results.slice(0, 12),
    placeholderStrategy: imgs.length > 0
      ? `Use placeholder images: unsplash.com/photos for photos, placehold.co for generic, or describe the visual intent in alt text for AI generation`
      : "No images detected",
  }
}

// ── Visual assets (icons, videos, logos) ──────────────────

function detectAssets() {
  const icons = detectIconLibrary()
  const videos = document.querySelectorAll("video, iframe[src*='youtube'], iframe[src*='vimeo']")

  return {
    iconLibrary: icons,
    svgInline: document.querySelectorAll("svg").length,
    videoCount: videos.length,
    hasLogo: !!document.querySelector('[class*="logo"], [rel*="icon"]'),
  }
}

function detectIconLibrary() {
  if (document.querySelector('link[href*="font-awesome"], link[href*="fontawesome"], .fa, .fas, .far, .fab'))
    return "Font Awesome"
  if (document.querySelector('link[href*="material-icons"], .material-icons, .material-symbols-outlined'))
    return "Material Icons"
  if (document.querySelector('[class*="lucide"], [data-lucide]'))
    return "Lucide"
  if (document.querySelector('[class*="heroicon"]'))
    return "Heroicons"
  if (document.querySelector('[class*="tabler-icon"], .ti'))
    return "Tabler Icons"
  if (document.querySelector('link[href*="bootstrap-icons"], .bi'))
    return "Bootstrap Icons"
  if (document.querySelector('link[href*="phosphor"], [class*="ph-"]'))
    return "Phosphor Icons"

  const inlineSvgCount = document.querySelectorAll("svg").length
  if (inlineSvgCount > 5) return `Inline SVGs (${inlineSvgCount} found)`

  return "none detected"
}

// ── Spacing ───────────────────────────────────────────────

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

// ── Responsive ────────────────────────────────────────────

function detectResponsive() {
  const viewport = document.querySelector('meta[name="viewport"]')
  return {
    hasViewport: !!viewport,
    hasMediaQueries: Array.from(document.styleSheets).some((sheet) => {
      try { return Array.from(sheet.cssRules || []).some((rule) => rule.media) }
      catch { return false }
    }),
  }
}

// ── CSS Variables ─────────────────────────────────────────

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
    } catch { /* cross-origin */ }
  })
  return vars
}

// ── DOM Structure ─────────────────────────────────────────

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

// ── Grid system ───────────────────────────────────────────

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

// ── Utility ───────────────────────────────────────────────

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

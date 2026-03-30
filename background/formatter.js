export function formatDesignData(d) {
  const lines = []

  formatIdentity(lines, d.identity)
  formatColors(lines, d.colorMap)
  formatTypography(lines, d.typography)
  formatFontSources(lines, d.fontSources)
  formatLayout(lines, d.layout)
  formatSections(lines, d.sections)
  formatForms(lines, d.forms)
  formatImages(lines, d.images)
  formatAssets(lines, d.assets)
  formatSpacing(lines, d.spacing)
  formatInteractions(lines, d.interactions)
  formatResponsive(lines, d.responsive)
  formatCSSVariables(lines, d.cssVariables)
  formatDOMStructure(lines, d.domStructure)

  return lines.join("\n")
}

function formatIdentity(lines, id = {}) {
  if (id.brandName) lines.push(`BRAND: ${id.brandName}`)
  if (id.description) lines.push(`SITE DESCRIPTION: ${id.description}`)
  if (id.heroHeading) lines.push(`HERO HEADING: "${id.heroHeading}"`)
  if (id.heroSubtext) lines.push(`HERO SUBTEXT: "${id.heroSubtext}"`)
  if (id.ctaButtons?.length)
    lines.push(`HERO CTAs: ${id.ctaButtons.map((t) => `"${t}"`).join(", ")}`)
  if (id.ogImage) lines.push(`OG IMAGE: ${id.ogImage}`)
}

function formatColors(lines, colors = []) {
  if (!colors.length) return
  lines.push("\nCOLOR PALETTE (hex → role):")
  colors.forEach((c) => {
    lines.push(`  ${c.hex} → ${c.roles.join(", ")}`)
  })
}

function formatTypography(lines, typo = {}) {
  if (!typo.headings?.length && !typo.bodyText?.length) return
  lines.push("\nTYPOGRAPHY:")
  ;(typo.headings || []).forEach((h) => {
    lines.push(
      `  ${h.tag.toUpperCase()}: font-family: ${h.font}; size: ${h.size}; weight: ${h.weight}; line-height: ${h.lineHeight}; letter-spacing: ${h.letterSpacing}${h.sample ? `; sample: "${h.sample}"` : ""}`
    )
  })
  ;(typo.bodyText || []).forEach((b) => {
    lines.push(
      `  BODY: font-family: ${b.font}; size: ${b.size}; weight: ${b.weight}; line-height: ${b.lineHeight}; letter-spacing: ${b.letterSpacing}`
    )
  })
}

function formatFontSources(lines, fonts = []) {
  if (!fonts.length) return
  lines.push("\nFONT SOURCES:")
  fonts.forEach((f) => {
    let line = `  "${f.name}" — ${f.source}`
    if (f.url) line += ` | URL: ${f.url.slice(0, 150)}`
    if (!f.usable) line += ` | ⚠ NOT USABLE by generator`
    if (f.fallback) line += ` | FALLBACK: ${f.fallback}`
    lines.push(line)
  })
}

function formatLayout(lines, layout = {}) {
  lines.push(`\nLAYOUT TYPE: ${layout.type || "unknown"}`)
  lines.push(`GRID SYSTEM: ${layout.gridSystem || "unknown"}`)
  if (layout.hasNavigation) lines.push("NAVIGATION: yes")
  if (layout.containerWidth) lines.push(`CONTAINER MAX-WIDTH: ${layout.containerWidth}`)
}

function formatSections(lines, sections = []) {
  if (!sections.length) return
  lines.push(`\nSECTIONS (${sections.length} total — describe ALL of these):`)
  sections.forEach((s) => {
    let line = `  ${s.index}. [${s.purpose}]`
    if (s.heading) line += ` heading: "${s.heading}"`
    if (s.subheading) line += ` | subheading: "${s.subheading}"`
    if (s.ctas?.length) line += ` | CTAs: ${s.ctas.map((t) => `"${t}"`).join(", ")}`
    if (s.elements?.length) line += ` | contains: ${s.elements.join(", ")}`
    lines.push(line)
  })
}

function formatForms(lines, forms = []) {
  if (!forms.length) return
  lines.push("\nFORMS:")
  forms.forEach((f, i) => {
    lines.push(`  Form ${i + 1} — purpose: ${f.purpose}, submit button: "${f.submitText}"`)
    f.fields.forEach((field) => {
      lines.push(
        `    [${field.type}] name="${field.name}" placeholder="${field.placeholder}"${field.required ? " (required)" : ""}`
      )
    })
  })
}

function formatImages(lines, images = {}) {
  if (!images.total) return
  lines.push(`\nIMAGES (${images.total} total):`)
  if (images.breakdown) {
    const roles = Object.entries(images.breakdown)
      .map(([role, count]) => `${count}× ${role}`)
      .join(", ")
    lines.push(`  Breakdown: ${roles}`)
  }
  if (images.details?.length) {
    lines.push("  Details:")
    images.details.forEach((img) => {
      lines.push(`    [${img.role}] alt="${img.alt}" | ${img.dimensions} | ${img.format}`)
    })
  }
  if (images.placeholderStrategy) lines.push(`  PLACEHOLDER STRATEGY: ${images.placeholderStrategy}`)
}

function formatAssets(lines, assets = {}) {
  if (!assets.iconLibrary) return
  lines.push(`\nICON LIBRARY: ${assets.iconLibrary}`)
  if (assets.svgInline) lines.push(`INLINE SVGs: ${assets.svgInline}`)
  if (assets.videoCount) lines.push(`VIDEOS: ${assets.videoCount}`)
  if (assets.hasLogo) lines.push("LOGO: detected")
}

function formatSpacing(lines, spacing = []) {
  if (!spacing.length) return
  lines.push("\nSPACING (component → values):")
  spacing.forEach((s) => {
    const vals = Object.entries(s)
      .filter(([k]) => k !== "component")
      .map(([k, v]) => `${k}: ${v}`)
      .join(", ")
    lines.push(`  ${s.component}: ${vals}`)
  })
}

function formatInteractions(lines, ix = {}) {
  if (!ix.transitions?.length && !ix.animations?.length && !ix.transforms?.length) return
  lines.push("\nINTERACTIONS:")
  if (ix.transitions?.length) lines.push(`  Transitions: ${ix.transitions.join(" | ")}`)
  if (ix.animations?.length) lines.push(`  Animations: ${ix.animations.join(" | ")}`)
  if (ix.transforms?.length) lines.push(`  Transforms: ${ix.transforms.join(" | ")}`)
}

function formatResponsive(lines, resp = {}) {
  lines.push(
    `\nRESPONSIVE: viewport meta: ${resp.hasViewport ? "yes" : "no"}, media queries: ${resp.hasMediaQueries ? "yes" : "no"}`
  )
}

function formatCSSVariables(lines, vars = {}) {
  const varEntries = Object.entries(vars)
  if (!varEntries.length) return
  lines.push(`\nCSS VARIABLES (${varEntries.length}):`)
  varEntries.slice(0, 30).forEach(([k, v]) => lines.push(`  ${k}: ${v}`))
  if (varEntries.length > 30) lines.push(`  ... and ${varEntries.length - 30} more`)
}

function formatDOMStructure(lines, domStructure) {
  if (!domStructure) return
  lines.push("\nDOM STRUCTURE (simplified):")
  lines.push(renderDOMTree(domStructure, 0))
}

function renderDOMTree(node, depth) {
  if (!node) return ""
  const indent = "  ".repeat(depth)
  let line = `${indent}<${node.tag}>`
  if (node.text) line += ` "${node.text}"`
  const parts = [line]
  if (node.children) {
    node.children.forEach((c) => parts.push(renderDOMTree(c, depth + 1)))
  }
  return parts.join("\n")
}

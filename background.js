chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "generatePrompt") {
    chrome.storage.local.get({ openaiKey: "", aiModel: "gpt-4o-mini" }, (result) => {
      if (!result.openaiKey) {
        sendResponse({ success: false, error: "No API key configured" })
        return
      }
      const model = result.aiModel || "gpt-4o-mini"
      const screenshot = request.screenshot || null
      generateWithOpenAI(request.designData, result.openaiKey, model, screenshot)
        .then((prompt) => sendResponse({ success: true, prompt }))
        .catch((err) => sendResponse({ success: false, error: err.message }))
    })
    return true
  }
})

async function generateWithOpenAI(designData, apiKey, model, screenshot) {
  const systemPrompt = `You are an expert frontend developer who reverse-engineers website designs into precise, actionable prompts.

Your task: Given structured design data (and optionally a screenshot), produce a prompt that an AI coding tool (v0, Bolt, Cursor) can use to faithfully recreate the website.

## Output structure
Write a single, detailed prompt. Cover these in order:

1. **Overview** — One sentence: the site's product/purpose, visual mood, and style (use the brand name and description if provided).

2. **Page type & navigation** — State explicitly: is this a single HTML file with scrollable sections, or multiple separate pages? If multi-page, list which pages. Describe the nav style (sticky, hamburger, transparent, etc.).

3. **Color palette with roles** — List every hex code with its exact role. Example: "#0f0f14 — page background, #f6f6f7 — card background, #6C5CE7 — primary CTA and accent, #8b8b9e — muted body text". Do NOT list two similar colors without distinguishing their roles.

4. **Typography with font imports** — For each level (h1, h2, body): font-family, size, weight, line-height, letter-spacing. CRITICAL: include the import instruction. If a Google Fonts URL is provided, output the exact <link> tag. If the font source is "local file" or "unknown", use the suggested fallback font instead — do NOT reference a local file path that a generator cannot access.

5. **Sections (every one)** — For EVERY section detected, describe: its purpose, heading text, subheading text, CTA button labels (exact copy like "Get Started" or "Try for Free"), content structure (number of cards/columns, lists, images), and any media. Do NOT say "a CTA" — write the actual button text. Do NOT leave any section undescribed.

6. **Forms** — For each form: purpose, every field (type, placeholder, required?), and submit button text.

7. **Images & assets** — State the icon library to import. For images, describe each role (hero image, card thumbnail, avatar, product screenshot, logo) and suggest a placeholder strategy (e.g. "use unsplash.com/photos?query=dashboard for the hero, placehold.co/600x400 for card thumbnails"). Do NOT just say "30 images".

8. **Spacing** — Map values to components: "sections use 80px vertical padding, cards have 24px padding with 16px gap and 8px border-radius, nav has 16px horizontal padding".

9. **Interactions** — Exact CSS transition strings: "buttons: color 0.25s ease, transform 0.2s; cards: box-shadow 0.3s ease on hover". Include animation names and durations if detected.

10. **Responsive** — Viewport meta present? Media queries detected?

## Hard rules
- Use EXACT values from the data. Never invent hex codes, font names, or sizes.
- Never reference a local font file path. If a font has usable:false, use its fallback suggestion.
- Every section must be named and described. If the data says 17 sections, output 17 descriptions.
- Every CTA must have its actual button text, not "a CTA".
- Every color must have a role, not just a hex code.
- If a screenshot is provided, use it to fill gaps the data might miss.
- Output ONLY the prompt text. No preamble, no markdown formatting, no explanation.
- Keep it under 1200 words.`

  const dataBlock = formatDesignData(designData)

  const userContent = []

  if (screenshot) {
    userContent.push({
      type: "text",
      text: `Design data from "${designData.title}" (${designData.url}):\n\n${dataBlock}\n\nScreenshot attached. Use both sources for maximum accuracy.`,
    })
    userContent.push({
      type: "image_url",
      image_url: { url: screenshot, detail: "high" },
    })
  } else {
    userContent.push({
      type: "text",
      text: `Design data from "${designData.title}" (${designData.url}):\n\n${dataBlock}`,
    })
  }

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
      temperature: 0.4,
      max_tokens: 3000,
    }),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    const msg = body.error?.message || `API error ${res.status}`
    throw new Error(msg)
  }

  const data = await res.json()
  return data.choices[0].message.content.trim()
}

// ── Format extracted data into structured text ────────────

function formatDesignData(d) {
  const lines = []

  // Identity
  const id = d.identity || {}
  if (id.brandName) lines.push(`BRAND: ${id.brandName}`)
  if (id.description) lines.push(`SITE DESCRIPTION: ${id.description}`)
  if (id.heroHeading) lines.push(`HERO HEADING: "${id.heroHeading}"`)
  if (id.heroSubtext) lines.push(`HERO SUBTEXT: "${id.heroSubtext}"`)
  if (id.ctaButtons?.length) lines.push(`HERO CTAs: ${id.ctaButtons.map((t) => `"${t}"`).join(", ")}`)
  if (id.ogImage) lines.push(`OG IMAGE: ${id.ogImage}`)

  // Colors with roles
  const colors = d.colorMap || []
  if (colors.length) {
    lines.push("\nCOLOR PALETTE (hex → role):")
    colors.forEach((c) => {
      lines.push(`  ${c.hex} → ${c.roles.join(", ")}`)
    })
  }

  // Typography
  const typo = d.typography || {}
  if (typo.headings?.length || typo.bodyText?.length) {
    lines.push("\nTYPOGRAPHY:")
    ;(typo.headings || []).forEach((h) => {
      lines.push(`  ${h.tag.toUpperCase()}: font-family: ${h.font}; size: ${h.size}; weight: ${h.weight}; line-height: ${h.lineHeight}; letter-spacing: ${h.letterSpacing}${h.sample ? `; sample: "${h.sample}"` : ""}`)
    })
    ;(typo.bodyText || []).forEach((b) => {
      lines.push(`  BODY: font-family: ${b.font}; size: ${b.size}; weight: ${b.weight}; line-height: ${b.lineHeight}; letter-spacing: ${b.letterSpacing}`)
    })
  }

  // Font sources
  const fonts = d.fontSources || []
  if (fonts.length) {
    lines.push("\nFONT SOURCES:")
    fonts.forEach((f) => {
      let line = `  "${f.name}" — ${f.source}`
      if (f.url) line += ` | URL: ${f.url.slice(0, 150)}`
      if (!f.usable) line += ` | ⚠ NOT USABLE by generator`
      if (f.fallback) line += ` | FALLBACK: ${f.fallback}`
      lines.push(line)
    })
  }

  // Layout
  const layout = d.layout || {}
  lines.push(`\nLAYOUT TYPE: ${layout.type || "unknown"}`)
  lines.push(`GRID SYSTEM: ${layout.gridSystem || "unknown"}`)
  if (layout.hasNavigation) lines.push(`NAVIGATION: yes`)
  if (layout.containerWidth) lines.push(`CONTAINER MAX-WIDTH: ${layout.containerWidth}`)

  // Sections
  const sections = d.sections || []
  if (sections.length) {
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

  // Forms
  const forms = d.forms || []
  if (forms.length) {
    lines.push("\nFORMS:")
    forms.forEach((f, i) => {
      lines.push(`  Form ${i + 1} — purpose: ${f.purpose}, submit button: "${f.submitText}"`)
      f.fields.forEach((field) => {
        lines.push(`    [${field.type}] name="${field.name}" placeholder="${field.placeholder}"${field.required ? " (required)" : ""}`)
      })
    })
  }

  // Images
  const images = d.images || {}
  if (images.total > 0) {
    lines.push(`\nIMAGES (${images.total} total):`)
    if (images.breakdown) {
      const roles = Object.entries(images.breakdown).map(([role, count]) => `${count}× ${role}`).join(", ")
      lines.push(`  Breakdown: ${roles}`)
    }
    if (images.details?.length) {
      lines.push(`  Details:`)
      images.details.forEach((img) => {
        lines.push(`    [${img.role}] alt="${img.alt}" | ${img.dimensions} | ${img.format}`)
      })
    }
    if (images.placeholderStrategy) lines.push(`  PLACEHOLDER STRATEGY: ${images.placeholderStrategy}`)
  }

  // Assets
  const assets = d.assets || {}
  if (assets.iconLibrary) {
    lines.push(`\nICON LIBRARY: ${assets.iconLibrary}`)
    if (assets.svgInline) lines.push(`INLINE SVGs: ${assets.svgInline}`)
    if (assets.videoCount) lines.push(`VIDEOS: ${assets.videoCount}`)
    if (assets.hasLogo) lines.push(`LOGO: detected`)
  }

  // Spacing
  const spacing = d.spacing || []
  if (spacing.length) {
    lines.push("\nSPACING (component → values):")
    spacing.forEach((s) => {
      const vals = Object.entries(s)
        .filter(([k]) => k !== "component")
        .map(([k, v]) => `${k}: ${v}`)
        .join(", ")
      lines.push(`  ${s.component}: ${vals}`)
    })
  }

  // Interactions
  const ix = d.interactions || {}
  if (ix.transitions?.length || ix.animations?.length || ix.transforms?.length) {
    lines.push("\nINTERACTIONS:")
    if (ix.transitions?.length) lines.push(`  Transitions: ${ix.transitions.join(" | ")}`)
    if (ix.animations?.length) lines.push(`  Animations: ${ix.animations.join(" | ")}`)
    if (ix.transforms?.length) lines.push(`  Transforms: ${ix.transforms.join(" | ")}`)
  }

  // Responsive
  const resp = d.responsive || {}
  lines.push(`\nRESPONSIVE: viewport meta: ${resp.hasViewport ? "yes" : "no"}, media queries: ${resp.hasMediaQueries ? "yes" : "no"}`)

  // CSS Variables
  const vars = d.cssVariables || {}
  const varEntries = Object.entries(vars)
  if (varEntries.length) {
    lines.push(`\nCSS VARIABLES (${varEntries.length}):`)
    varEntries.slice(0, 30).forEach(([k, v]) => lines.push(`  ${k}: ${v}`))
    if (varEntries.length > 30) lines.push(`  ... and ${varEntries.length - 30} more`)
  }

  // DOM structure
  if (d.domStructure) {
    lines.push(`\nDOM STRUCTURE (simplified):`)
    lines.push(formatDOMTree(d.domStructure, 0))
  }

  return lines.join("\n")
}

function formatDOMTree(node, depth) {
  if (!node) return ""
  const indent = "  ".repeat(depth)
  let line = `${indent}<${node.tag}>`
  if (node.text) line += ` "${node.text}"`
  const parts = [line]
  if (node.children) {
    node.children.forEach((c) => parts.push(formatDOMTree(c, depth + 1)))
  }
  return parts.join("\n")
}

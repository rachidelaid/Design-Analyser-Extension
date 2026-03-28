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

Your task: Given extracted design data (and optionally a screenshot) from a real website, produce a prompt that an AI coding tool (v0, Bolt, Cursor, or similar) can use to faithfully recreate the website's visual design and layout.

## Output format
Write a single, detailed prompt in natural language. Structure it as follows:

1. **Overview** — One sentence describing the site's purpose and visual style (e.g. "A modern SaaS landing page with a dark theme and glassmorphism cards").

2. **Layout** — Describe the page structure top-to-bottom: navigation, hero, sections, footer. Mention the grid/layout system (flexbox, CSS grid), container widths, and section ordering.

3. **Color palette** — List every detected color as hex codes. Describe which color is used for what (background, text, accent, borders, CTAs). If CSS custom properties exist, mention them.

4. **Typography** — Specify font families, sizes, weights, and line-heights for headings, body text, and any special elements. Use exact values from the data.

5. **Components** — For each detected component (hero, cards, forms, testimonials, pricing, footer, etc.), describe its layout, spacing, visual style, and content structure.

6. **Spacing & sizing** — Mention padding, margins, gaps, border-radius patterns observed.

7. **Interactions** — Describe any transitions, animations, transforms, or hover effects detected.

8. **Responsive** — Note viewport settings and whether media queries are present.

## Rules
- Use the EXACT hex codes, font names, sizes, and values from the data — do not invent values
- Be specific enough that the output could be copy-pasted into v0.dev and produce a close visual match
- If a screenshot is provided, use it to describe visual details the data might miss (gradients, images, shadows, visual hierarchy, whitespace rhythm)
- Do NOT include any preamble, explanation, or markdown formatting — output ONLY the prompt text
- Keep it under 800 words`

  const dataBlock = formatDesignData(designData)

  const userContent = []

  if (screenshot) {
    userContent.push({
      type: "text",
      text: `Here is the design data extracted from "${designData.title}" (${designData.url}):\n\n${dataBlock}\n\nA screenshot of the page is attached. Use both the data and the screenshot to produce the most accurate prompt possible.`,
    })
    userContent.push({
      type: "image_url",
      image_url: { url: screenshot, detail: "high" },
    })
  } else {
    userContent.push({
      type: "text",
      text: `Here is the design data extracted from "${designData.title}" (${designData.url}):\n\n${dataBlock}`,
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
      temperature: 0.5,
      max_tokens: 2000,
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

function formatDesignData(d) {
  const lines = []

  const colors = (d.colors || []).filter(Boolean)
  if (colors.length) lines.push(`COLORS: ${colors.join(", ")}`)

  const typo = d.typography || {}
  if (typo.headings?.length) {
    typo.headings.forEach((h, i) => {
      const tag = i === 0 ? "H1" : `H${i + 1}`
      lines.push(`${tag}: font-family: ${h.font}; size: ${h.size}; weight: ${h.weight}; line-height: ${h.lineHeight}${h.sample ? `; sample: "${h.sample}"` : ""}`)
    })
  }
  if (typo.bodyText?.length) {
    const b = typo.bodyText[0]
    lines.push(`BODY TEXT: font-family: ${b.font}; size: ${b.size}; weight: ${b.weight}; line-height: ${b.lineHeight}`)
  }

  const layout = d.layout || {}
  lines.push(`LAYOUT: ${layout.type || "unknown"}, grid system: ${layout.gridSystem || "unknown"}, sections: ${layout.sectionCount || 0}, navigation: ${layout.hasNavigation ? "yes" : "no"}`)

  if (d.components?.length) lines.push(`COMPONENTS: ${d.components.join(", ")}`)
  if (d.interactions?.length) lines.push(`INTERACTIONS: ${d.interactions.join(", ")}`)

  const resp = d.responsive || {}
  lines.push(`RESPONSIVE: viewport meta: ${resp.hasViewport ? "yes" : "no"}, media queries: ${resp.hasMediaQueries ? "yes" : "no"}`)

  if (d.spacing?.length) lines.push(`SPACING VALUES: ${d.spacing.join(", ")}`)

  const vars = d.cssVariables || {}
  const varEntries = Object.entries(vars)
  if (varEntries.length) {
    lines.push(`CSS VARIABLES (${varEntries.length}):`)
    varEntries.slice(0, 30).forEach(([k, v]) => lines.push(`  ${k}: ${v}`))
    if (varEntries.length > 30) lines.push(`  ... and ${varEntries.length - 30} more`)
  }

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

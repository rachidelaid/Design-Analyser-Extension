import { $, cleanFontName } from "./utils.js"
import { toast } from "./toast.js"

export function renderResults(data) {
  renderColors(data.colorMap || [])
  renderTypography(data.typography || {})
  renderLayout(data.layout || {}, data.interactions || {}, data.sections || [])

  const resultsEl = $("#results")
  resultsEl.classList.remove("hidden")
  resultsEl.classList.add("visible")
}

function renderColors(colorMap) {
  const container = $("#colorPalette")
  if (!colorMap.length) {
    container.innerHTML = '<span class="no-data">No colors detected</span>'
    return
  }
  container.innerHTML = colorMap
    .slice(0, 6)
    .map(
      (c) => `
      <div class="color-swatch" data-color="${c.hex}" title="${c.roles.join(", ")}">
        <div class="swatch-fill" style="background:${c.hex}"></div>
        <span class="swatch-label">${c.hex}</span>
      </div>`
    )
    .join("")

  container.querySelectorAll(".color-swatch").forEach((swatch) => {
    swatch.addEventListener("click", () => {
      const hex = swatch.dataset.color
      navigator.clipboard.writeText(hex).then(() => {
        swatch.classList.add("copied")
        toast(`Copied ${hex}`)
        setTimeout(() => swatch.classList.remove("copied"), 1500)
      })
    })
  })
}

function renderTypography(typo) {
  const container = $("#typographyPreview")
  const heading = typo.headings?.[0]
  const body = typo.bodyText?.[0]

  if (!heading && !body) {
    container.innerHTML = '<span class="no-data">No typography detected</span>'
    return
  }

  let html = ""
  if (heading) {
    html += `
      <div class="typo-row">
        <span class="typo-role">Heading</span>
        <span class="font-name">${cleanFontName(heading.font)}</span>
        <div class="font-meta">
          <span class="size-tag">${heading.size}</span>
          <span class="size-tag">w${heading.weight}</span>
        </div>
        ${heading.sample ? `<div class="font-sample">${heading.sample}</div>` : ""}
      </div>`
  }
  if (body) {
    html += `
      <div class="typo-row">
        <span class="typo-role">Body</span>
        <span class="font-name">${cleanFontName(body.font)}</span>
        <div class="font-meta">
          <span class="size-tag">${body.size}</span>
          <span class="size-tag">w${body.weight}</span>
        </div>
      </div>`
  }
  container.innerHTML = html
}

function renderLayout(layout, interactions, sections) {
  const container = $("#layoutInfo")
  const tags = []

  if (layout.type) {
    const short = layout.type.includes("multi-page")
      ? "multi-page"
      : layout.type.includes("anchor")
        ? "single-page + anchors"
        : "single-page"
    tags.push(short)
  }
  if (layout.gridSystem) tags.push(layout.gridSystem)
  if (layout.hasNavigation) tags.push("navigation")
  if (layout.containerWidth) tags.push(`max-width: ${layout.containerWidth}`)
  if (sections.length) tags.push(`${sections.length} sections`)

  const sectionTypes = new Set(sections.map((s) => s.purpose))
  sectionTypes.forEach((p) => {
    if (p !== "content section" && p !== "brief content block" && p !== "spacer/divider") {
      tags.push(p)
    }
  })

  if (interactions.transitions?.length) tags.push("transitions")
  if (interactions.animations?.length) tags.push("animations")
  if (interactions.transforms?.length) tags.push("transforms")

  if (!tags.length) {
    container.innerHTML = '<span class="no-data">No layout info detected</span>'
    return
  }
  container.innerHTML = tags.map((t) => `<span class="tag">${t}</span>`).join("")
}

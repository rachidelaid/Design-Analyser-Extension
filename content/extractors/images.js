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
    else if (/avatar|team|author|profile/.test(alt) || /avatar|team/.test(img.className || ""))
      role = "avatar/photo"
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
    else if (src.startsWith("data:image/"))
      format = src.split(";")[0].replace("data:image/", "").toUpperCase()

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
    placeholderStrategy:
      imgs.length > 0
        ? "Use placeholder images: unsplash.com/photos for photos, placehold.co for generic, or describe the visual intent in alt text for AI generation"
        : "No images detected",
  }
}

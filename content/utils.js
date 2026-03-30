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

function suggestFallback(fontName) {
  const name = fontName.toLowerCase()
  if (/mono|code|consola|courier/i.test(name))
    return 'Use "JetBrains Mono" or "Fira Code" from Google Fonts, or system monospace'
  if (/serif/i.test(name) && !/sans/i.test(name))
    return 'Use "Merriweather" or "Lora" from Google Fonts, or system serif'
  if (/display|heading|title/i.test(name))
    return 'Use "Plus Jakarta Sans" or "Space Grotesk" from Google Fonts'
  return `Search Google Fonts for "${fontName}" — if unavailable, use "Inter" or "Plus Jakarta Sans" as a sans-serif fallback`
}

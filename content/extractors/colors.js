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

  const muted = document.querySelector(
    '[class*="muted"], [class*="secondary"], [class*="subtle"], small, .text-muted'
  )
  if (muted) add(rgbToHex(getComputedStyle(muted).color), "muted/secondary text")

  return map.filter((c) => c.hex).slice(0, 12)
}

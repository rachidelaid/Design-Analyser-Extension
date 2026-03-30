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
    document.querySelectorAll(
      '[class*="hero"] a, [class*="hero"] button, header a[class*="btn"], header button[class*="cta"], .cta, [class*="cta"]'
    )
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

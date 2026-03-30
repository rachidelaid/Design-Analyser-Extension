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
    const subText =
      subheading && subheading !== heading ? subheading.innerText.trim().slice(0, 100) : ""

    const ctas = Array.from(
      el.querySelectorAll('button, a[class*="btn"], a[class*="cta"], [class*="button"]')
    )
      .map((b) => b.innerText.trim())
      .filter((t) => t.length > 0 && t.length < 50)
      .slice(0, 3)

    const keyEls = []
    if (el.querySelector("form")) keyEls.push("form")
    const imgCount = el.querySelectorAll("img, picture, video").length
    if (imgCount > 0) keyEls.push(`${imgCount} image${imgCount > 1 ? "s" : ""}`)
    const cardCount = el.querySelectorAll('[class*="card"], [class*="col"]').length
    if (cardCount > 1) keyEls.push(`${cardCount} cards/columns`)
    if (el.querySelector("blockquote, [class*='testimonial'], [class*='quote']"))
      keyEls.push("testimonial")
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

function detectAssets() {
  return {
    iconLibrary: detectIconLibrary(),
    svgInline: document.querySelectorAll("svg").length,
    videoCount: document.querySelectorAll(
      "video, iframe[src*='youtube'], iframe[src*='vimeo']"
    ).length,
    hasLogo: !!document.querySelector('[class*="logo"], [rel*="icon"]'),
  }
}

function detectIconLibrary() {
  if (
    document.querySelector(
      'link[href*="font-awesome"], link[href*="fontawesome"], .fa, .fas, .far, .fab'
    )
  )
    return "Font Awesome"
  if (
    document.querySelector(
      'link[href*="material-icons"], .material-icons, .material-symbols-outlined'
    )
  )
    return "Material Icons"
  if (document.querySelector('[class*="lucide"], [data-lucide]')) return "Lucide"
  if (document.querySelector('[class*="heroicon"]')) return "Heroicons"
  if (document.querySelector('[class*="tabler-icon"], .ti')) return "Tabler Icons"
  if (document.querySelector('link[href*="bootstrap-icons"], .bi')) return "Bootstrap Icons"
  if (document.querySelector('link[href*="phosphor"], [class*="ph-"]')) return "Phosphor Icons"

  const inlineSvgCount = document.querySelectorAll("svg").length
  if (inlineSvgCount > 5) return `Inline SVGs (${inlineSvgCount} found)`

  return "none detected"
}

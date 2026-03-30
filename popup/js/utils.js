export function escapeHtml(str) {
  const div = document.createElement("div")
  div.textContent = str
  return div.innerHTML
}

export function getDomain(url) {
  try {
    return new URL(url).hostname
  } catch {
    return url
  }
}

export function cleanFontName(raw) {
  if (!raw) return "Unknown"
  return raw.split(",")[0].replace(/['"]/g, "").trim()
}

export function $(selector, parent = document) {
  return parent.querySelector(selector)
}

export function $$(selector, parent = document) {
  return parent.querySelectorAll(selector)
}

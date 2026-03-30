let toastEl = null

export function initToast() {
  toastEl = document.createElement("div")
  toastEl.className = "toast"
  document.body.appendChild(toastEl)
}

export function toast(msg, duration = 1800) {
  if (!toastEl) return
  toastEl.textContent = msg
  toastEl.classList.add("show")
  setTimeout(() => toastEl.classList.remove("show"), duration)
}

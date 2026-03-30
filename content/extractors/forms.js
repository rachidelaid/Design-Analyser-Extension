function extractForms() {
  const forms = []

  document.querySelectorAll("form").forEach((form, i) => {
    if (i >= 5) return
    const fields = Array.from(form.querySelectorAll("input, textarea, select"))
      .map((el) => {
        const tag = el.tagName.toLowerCase()
        const type =
          el.getAttribute("type") ||
          (tag === "textarea" ? "textarea" : tag === "select" ? "select" : "text")
        return {
          type,
          name: el.name || el.id || "",
          placeholder: el.placeholder || "",
          required: el.required,
        }
      })
      .slice(0, 15)

    const submitBtn = form.querySelector(
      'button[type="submit"], input[type="submit"], button:not([type])'
    )
    const heading = form.closest("section, [class*='section']")?.querySelector("h1, h2, h3")

    const className = typeof form.className === "string" ? form.className : ""
    let purpose = "unknown"
    const clsText = (
      className +
      " " +
      (form.id || "") +
      " " +
      (heading ? heading.innerText : "")
    ).toLowerCase()
    if (/contact|message|inquiry/.test(clsText)) purpose = "contact"
    else if (/newsletter|subscribe|email/.test(clsText)) purpose = "newsletter signup"
    else if (/login|signin|sign.in/.test(clsText)) purpose = "login"
    else if (/register|signup|sign.up|create.account/.test(clsText)) purpose = "registration"
    else if (/search/.test(clsText)) purpose = "search"
    else if (/comment/.test(clsText)) purpose = "comments"
    else if (fields.length <= 2) purpose = "simple input (likely newsletter/search)"
    else purpose = "multi-field form"

    forms.push({
      purpose,
      fields,
      submitText: submitBtn ? submitBtn.innerText.trim() || submitBtn.value || "Submit" : "",
    })
  })

  return forms
}

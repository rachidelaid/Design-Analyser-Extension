function detectInteractions() {
  const transitions = []
  const animations = []
  const transforms = []

  sampleElements('a, button, [class*="card"], [class*="btn"], [class*="link"]', 40).forEach(
    (el) => {
      const s = getComputedStyle(el)
      if (s.transition && s.transition !== "all 0s ease 0s" && s.transition !== "none") {
        const parts = s.transition
          .split(",")
          .map((t) => t.trim())
          .slice(0, 3)
        parts.forEach((t) => {
          if (!transitions.includes(t)) transitions.push(t)
        })
      }
    }
  )

  sampleElements("*", 80).forEach((el) => {
    const s = getComputedStyle(el)
    if (s.animationName && s.animationName !== "none") {
      const entry = `${s.animationName} ${s.animationDuration} ${s.animationTimingFunction}`
      if (!animations.includes(entry)) animations.push(entry)
    }
    if (s.transform !== "none") {
      if (!transforms.includes(s.transform)) transforms.push(s.transform)
    }
  })

  return {
    transitions: transitions.slice(0, 8),
    animations: animations.slice(0, 5),
    transforms: transforms.slice(0, 5),
  }
}

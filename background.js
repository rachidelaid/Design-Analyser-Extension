chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "generatePrompt") {
    generateWithOpenAI(request.designData, request.apiKey)
      .then((prompt) => sendResponse({ success: true, prompt }))
      .catch((err) => sendResponse({ success: false, error: err.message }))
    return true
  }
})

async function generateWithOpenAI(designData, apiKey) {
  const systemPrompt = `You are an expert frontend developer and UI designer. Given extracted design data from a website, generate a detailed prompt that another developer (or AI tool like v0, Bolt, or Cursor) can use to recreate a visually similar website.

The prompt should:
- Describe the overall layout and structure
- Specify the exact color palette with hex codes
- Describe typography choices (font families, sizes, weights)
- List all detected UI components and how they should look
- Mention the grid/layout system used
- Include any interactions or animations detected
- Reference any CSS custom properties found
- Be actionable and specific enough to produce a faithful recreation
- Be written as a single, coherent prompt (not a list of raw data)

Output ONLY the prompt text, no preamble or explanation.`

  const userMessage = `Here is the extracted design data from "${designData.title}" (${designData.url}):

Colors: ${JSON.stringify(designData.colors)}
Typography: ${JSON.stringify(designData.typography)}
Layout: ${JSON.stringify(designData.layout)}
Components: ${JSON.stringify(designData.components)}
Interactions: ${JSON.stringify(designData.interactions)}
Responsive: ${JSON.stringify(designData.responsive)}
CSS Variables: ${JSON.stringify(designData.cssVariables)}`

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      temperature: 0.7,
      max_tokens: 1500,
    }),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    const msg = body.error?.message || `API error ${res.status}`
    throw new Error(msg)
  }

  const data = await res.json()
  return data.choices[0].message.content.trim()
}

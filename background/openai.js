import { SYSTEM_PROMPT } from "./prompts.js"
import { formatDesignData } from "./formatter.js"

const API_URL = "https://api.openai.com/v1/chat/completions"

export async function generateWithOpenAI(designData, apiKey, model, screenshot) {
  const dataBlock = formatDesignData(designData)
  const userContent = buildUserContent(designData, dataBlock, screenshot)

  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userContent },
      ],
      temperature: 0.4,
      max_tokens: 3000,
    }),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error?.message || `API error ${res.status}`)
  }

  const data = await res.json()
  return data.choices[0].message.content.trim()
}

function buildUserContent(designData, dataBlock, screenshot) {
  const content = []
  const prefix = `Design data from "${designData.title}" (${designData.url}):\n\n${dataBlock}`

  if (screenshot) {
    content.push({
      type: "text",
      text: `${prefix}\n\nScreenshot attached. Use both sources for maximum accuracy.`,
    })
    content.push({
      type: "image_url",
      image_url: { url: screenshot, detail: "high" },
    })
  } else {
    content.push({ type: "text", text: prefix })
  }

  return content
}

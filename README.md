# Design Analyzer

A Chrome extension that extracts the design system of any website (colors, typography, layout, spacing, DOM structure, components) and uses OpenAI to generate a prompt you can paste into tools like v0, Bolt, or Cursor to recreate a similar site.

## Features

- **Design extraction** — automatically detects colors, fonts, layout type, grid system, spacing values, DOM structure, UI components, animations, and CSS custom properties from any page
- **AI prompt generation** — sends extracted data to OpenAI and returns a detailed, copy-ready prompt for recreating the design
- **Model selection** — choose between **GPT-4o mini** (fast, text-only) or **GPT-4o** (higher quality, includes a screenshot of the page for vision-based analysis)
- **Screenshot capture** — when using GPT-4o, the extension captures the visible tab and sends it alongside the extracted data so the AI can see gradients, images, shadows, and visual hierarchy
- **Analysis history** — stores past analyses in `chrome.storage` with one-click restore and a badge showing which model was used
- **Copy & open** — copy the generated prompt or jump straight to v0.dev
- **Dark / light mode** — glassmorphism UI with theme persistence

## Project Structure

```
├── manifest.json        # Chrome extension manifest (MV3)
├── background.js        # Service worker — OpenAI API calls, prompt engineering
├── content.js           # Content script — extracts design data from pages
├── popup/
│   ├── popup.html       # Extension popup markup
│   ├── popup.css        # Styles (glassmorphism, dark/light themes)
│   └── popup.js         # Popup logic, screenshot capture, UI rendering, history
└── images/              # Extension icons (16/32/48/128px)
```

## Setup

1. Clone the repo
2. Open `chrome://extensions` in Chrome
3. Enable **Developer mode** (top-right toggle)
4. Click **Load unpacked** and select the project folder
5. Click the extension icon, open **Settings** (gear icon), paste your OpenAI API key, and pick a model

## Usage

1. Navigate to any website you want to analyze
2. Click the Design Analyzer extension icon
3. (Optional) Open Settings to switch between GPT-4o mini and GPT-4o
4. Hit **Start Analysis**
5. The extension extracts colors, typography, layout, spacing, and DOM structure
6. OpenAI generates a recreation prompt (GPT-4o also receives a screenshot for visual context)
7. Click **Copy** to copy the prompt, then paste it into v0, Bolt, Cursor, or any AI tool

## What Gets Extracted

| Category | Details |
|---|---|
| Colors | Background, text, border, and accent colors (up to 8, filtered for relevance) |
| Typography | Font families, sizes, weights, line-heights for H1, H2, and body text |
| Layout | Page type, navigation presence, section count, grid system (grid/flexbox/block) |
| Spacing | Padding, margin, and gap values sampled from containers |
| Components | Hero, cards, forms, testimonials, pricing, gallery, footer, navigation |
| Interactions | CSS transitions, animations, and transforms |
| DOM Structure | Simplified HTML skeleton (tags, classes, roles) up to 4 levels deep |
| CSS Variables | All custom properties discovered across stylesheets |
| Responsive | Viewport meta tag and media query detection |

## Permissions

| Permission | Reason |
|---|---|
| `activeTab` | Access the current tab's URL, content, and capture screenshots |
| `scripting` | Inject the content script on demand |
| `clipboardWrite` | Copy colors and prompts to clipboard |
| `storage` | Persist API key, model choice, history, and theme preference |
| `host_permissions: <all_urls>` | Run the content script on any website |

## Tech Stack

- Chrome Extension Manifest V3
- Vanilla JS / CSS (no frameworks, no CDN dependencies)
- OpenAI Chat Completions API (GPT-4o mini or GPT-4o with vision)

## Author

Made by rachidelaid

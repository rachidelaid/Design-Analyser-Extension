# Design Analyzer

A Chrome extension that extracts the design system of any website (colors, typography, layout, components) and uses OpenAI to generate a prompt you can paste into tools like v0, Bolt, or Cursor to recreate a similar site.

## Features

- **Design extraction** — automatically detects colors, fonts, layout type, grid system, UI components, animations, and CSS custom properties from any page
- **AI prompt generation** — sends extracted data to OpenAI (`gpt-4o-mini`) and returns a detailed, copy-ready prompt for recreating the design
- **Analysis history** — stores past analyses in `chrome.storage` with one-click restore
- **Copy & open** — copy the generated prompt or jump straight to v0.dev
- **Dark / light mode** — glassmorphism UI with theme persistence

## Project Structure

```
├── manifest.json        # Chrome extension manifest (MV3)
├── background.js        # Service worker — handles OpenAI API calls
├── content.js           # Content script — extracts design data from pages
├── popup/
│   ├── popup.html       # Extension popup markup
│   ├── popup.css        # Styles (glassmorphism, dark/light themes)
│   └── popup.js         # Popup logic, UI rendering, history management
└── images/              # Extension icons (16/32/48/128px)
```

## Setup

1. Clone the repo
2. Open `chrome://extensions` in Chrome
3. Enable **Developer mode** (top-right toggle)
4. Click **Load unpacked** and select the project folder
5. Click the extension icon, open **Settings** (gear icon), and paste your OpenAI API key

## Usage

1. Navigate to any website you want to analyze
2. Click the Design Analyzer extension icon
3. Hit **Start Analysis**
4. The extension extracts the design data and displays colors, typography, and layout info
5. OpenAI generates a recreation prompt automatically
6. Click **Copy** to copy the prompt, or **Open in v0** to jump to v0.dev

## Permissions

| Permission | Reason |
|---|---|
| `activeTab` | Access the current tab's URL and content |
| `scripting` | Inject the content script on demand |
| `clipboardWrite` | Copy colors and prompts to clipboard |
| `storage` | Persist API key, history, and theme preference |
| `host_permissions: <all_urls>` | Run the content script on any website |

## Tech Stack

- Chrome Extension Manifest V3
- Vanilla JS / CSS (no frameworks, no CDN dependencies)
- OpenAI Chat Completions API (`gpt-4o-mini`)

## Author

Made by rachidelaid

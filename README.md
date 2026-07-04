# ✨ Smart TaskManager

A sleek, fully client-side task manager built with vanilla **HTML, CSS & JavaScript** — no frameworks, no build step, no backend. Just open `index.html` and start organizing.

![Made with HTML](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white)
![Made with CSS](https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white)
![Made with JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)

---

## 📋 Overview

Smart TaskManager is a premium, dashboard-style to-do app with a custom indigo–teal visual identity, smart auto-suggestions, dark mode, drag-and-drop reordering, and full local data persistence — all in three static files.

---

## 🚀 Features

### Core Task Management
- ✅ Create, edit, delete, duplicate, pin, archive, and restore tasks
- 🎯 Priority levels (High / Medium / Low) and 6 built-in categories (Personal, Work, Study, Shopping, Health, Custom)
- 🎨 8-color label picker for visually tagging tasks
- 📅 Due date + due time with overdue detection
- 🔀 Drag-and-drop manual reordering

### ✨ Smart Suggestions (the "Smart" in Smart TaskManager)
- While typing a task title, the app scans for keywords (e.g. *"client meeting"*, *"urgent deadline"*, *"buy groceries"*) and automatically suggests the matching **Category** and **Priority**
- A subtle hint (`✨ Smart suggestion applied…`) shows what was auto-filled
- Manually changing a dropdown always overrides the suggestion — it never fights the user

### Dashboard & Insights
- 📊 Live stat cards: Total, Completed, Pending, Overdue, Pinned, Archived
- 🟢 Circular + linear completion progress bars
- 🗓️ Mini calendar with due-date highlights

### Search, Filter & Sort
- 🔍 Instant search across title, description, category, priority, and status
- 🗂️ Sidebar filters: status, priority, category, today, overdue, pinned, archived
- ⬆️⬇️ Sort by newest, oldest, A–Z, priority, due date, or status

### Data & Personalization
- 💾 Auto-saves everything to `localStorage` — no account, no server needed
- 📤 Export tasks to a JSON backup file / 📥 Import them back
- 🌗 Light & Dark theme toggle (persisted across sessions)
- ⌨️ Keyboard shortcuts: `N` new task · `Esc` close modal · `D` toggle dark mode
- 📱 Fully responsive — works on desktop, tablet, and mobile

---

## 🎨 Design System

| Token | Light | Dark |
|---|---|---|
| Accent (primary) | `#4F46E5` Indigo | `#6D5EF5` |
| Accent (secondary) | `#12C6A5` Teal | `#2FE0BE` |
| Background | `#F2F4FF` | `#0B0D1C` |
| Font — Display/Logo | Poppins (600–800) | — |
| Font — Body | Inter (300–800) | — |

The logo is a custom inline SVG: a rounded gradient square with a lightning-bolt glyph (speed/intelligence) and a small checkmark badge (task completion) — no emoji, no external image files.

---

## 📁 Project Structure

```
smart-taskmanager/
├── index.html      # Markup, modals, SVG logo & favicon
├── style.css       # Design tokens, theming, layout, animations
└── script.js       # App logic: CRUD, storage, smart suggestions, events
```

---

## 🛠️ Getting Started

No installation, no dependencies, no build tools required.

1. Download all three files (`index.html`, `style.css`, `script.js`) into the **same folder**
2. Double-click `index.html`, or serve the folder with any static server:
   ```bash
   # Python
   python3 -m http.server 8080

   # Node
   npx serve .
   ```
3. Open `http://localhost:8080` in your browser

> ⚠️ The three files must stay in the same directory and keep their exact names — `index.html` links to `style.css` and `script.js` by relative path.

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|---|---|
| `N` | Open "New Task" modal |
| `Esc` | Close any open modal |
| `D` | Toggle dark / light theme |
| `↑ / ↓` | Navigate (where applicable) |

---

## 💾 Data & Privacy

All data lives entirely in your browser's `localStorage` under the `smarttaskmanager-*` keys. Nothing is sent to a server. Clearing your browser data or using a different browser/device will not carry your tasks over — use **Export Tasks** to back up, and **Import Tasks** to restore.

---

## 🧩 Tech Stack

- **HTML5** — semantic, accessible markup (ARIA roles, live regions)
- **CSS3** — custom properties (CSS variables) for full theming, no preprocessor
- **Vanilla JavaScript (ES6+)** — no frameworks, no dependencies

---

## 📄 License

Free to use, modify, and distribute for personal or commercial projects.

---

<p align="center">Built with 💡 for people who like their to-do lists a little smarter.</p>

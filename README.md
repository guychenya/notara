<div align="center">

# 📝 Notara

**AI-Powered Note-Taking, Reimagined**

[![Version](https://img.shields.io/badge/version-1.3.0-emerald.svg)](https://github.com/guychenya/notara)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](https://opensource.org/licenses/MIT)
[![Made with React](https://img.shields.io/badge/Made%20with-React-61DAFB?logo=react)](https://reactjs.org/)
[![Live Demo](https://img.shields.io/badge/Demo-notara.reliatrack.org-emerald)](https://notara.reliatrack.org)

</div>

---

## ✨ About Notara

Notara is an intelligent note-taking application that combines the simplicity of markdown with the power of AI. Create, organize, and enhance your notes with multiple AI providers including Gemini, OpenAI, Anthropic, Ollama, and more.

**🌐 Live Demo:** [https://notara.reliatrack.org](https://notara.reliatrack.org)

## 🚀 Key Features

### 📁 Organization & Structure (v1.3.0)
- **Folder System** - Organize notes into folders and subfolders
- **Enhanced Search** - Filter by tags, date range, favorites
- **Favorites System** - Star important notes for quick access
- **Auto-Tagging** - AI generates relevant tags with colorful badges
- **Breadcrumbs** - Visual navigation path

### 📝 Smart Note Management
- **Wiki-Style Links** - `[[Note Title]]` to link between notes
- **Table of Contents** - Auto-generated from headings
- **Duplicate Notes** - Clone notes with one click
- **Auto-Save** - Never lose your work
- **Word Count & Timestamps** - Track your writing progress

### 🤖 AI-Powered Tools
- **Resizable AI Chat Sidebar** - Gemini Canvas-style interface with drag-to-resize
- **Action Buttons** - Discard, Copy, New Note, and Insert on every AI response
- **9 AI Text Tools** - Summarize, Improve, Explain, Continue, Expand, Shorten, Bullets, Actions, Translate
- **Text Selection Toolbar** - Context-aware AI operations on selected text
- **Smart Assistance** - Context-aware help based on current note

### 💻 Advanced Markdown
- **Syntax Highlighting** - 180+ languages with copy button
- **Code Blocks** - Beautiful syntax-highlighted code with GitHub Dark theme
- **Extended Markdown** - Tables, checkboxes, images, videos
- **Live Preview** - Split-screen markdown editor

### 📤 Export & Import (v1.3.0)
- **Multiple Formats** - Export to HTML, DOCX, Markdown, PDF
- **Obsidian Compatible** - Import/export Obsidian vaults
- **Batch Export** - Export multiple notes at once
- **Preserve Formatting** - Maintains syntax highlighting and styles

### ⚡ Productivity Features
- **Command Palette** (Cmd/Ctrl+K) - Quick access to all features
- **Focus Mode** - Distraction-free writing environment
- **Voice Input** - Continuous speech-to-text capture
- **Quick Capture Widget** - Rapid thought capture
- **5 Professional Templates** - Meeting Notes, Daily Journal, To-Do List, Project Plan, Blog Post
- **Daily Note** - Auto-generated date-based notes

### 📱 Progressive Web App
- **Offline Mode** - Work without internet connection
- **Install as App** - Native app experience on desktop and mobile
- **Online Status Indicator** - Real-time connection monitoring
- **Share Features** - Native share API and shareable links

### 🎨 Modern UI/UX
- **Dark/Light Mode** - Beautiful themes for any preference
- **Glassmorphism Design** - Modern, elegant interface
- **Responsive Layout** - Works on all screen sizes
- **Keyboard Shortcuts** - Power user friendly

## 🏃 Quick Start

### Run Locally

**Prerequisites:** Node.js 20+

1. **Clone the repository:**
   ```bash
   git clone https://github.com/guychenya/notara.git
   cd notara
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment:**
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local and add your GEMINI_API_KEY
   ```

4. **Run the app:**
   ```bash
   npm run dev
   ```

5. **Open:** http://localhost:5173

## 🐳 Docker Deployment

### Using Docker Compose

```bash
docker-compose up -d
```

### Using Dockerfile

```bash
docker build -t notara .
docker run -p 3000:3000 -e GEMINI_API_KEY=your_key_here notara
```

## ☁️ Deploy to Cloud

### Coolify (Recommended)
1. Connect your GitHub repository
2. Set `GEMINI_API_KEY` environment variable
3. Deploy with Dockerfile
4. Configure custom domain

### Other Platforms
- **Vercel/Netlify:** Set build command to `npm run build`
- **Railway/Render:** Use Dockerfile deployment
- **AWS/GCP/Azure:** Deploy as containerized app

## 🔑 AI Provider Setup

Notara supports multiple AI providers. Add your API key to `.env.local`:

```bash
GEMINI_API_KEY=your_gemini_api_key_here
```

Get your API key:
- **Gemini:** https://makersuite.google.com/app/apikey
- **OpenAI:** https://platform.openai.com/api-keys
- **Anthropic:** https://console.anthropic.com/

## ⌨️ Keyboard Shortcuts

- `Cmd/Ctrl + K` - Open Command Palette
- `Cmd/Ctrl + N` - New Note
- `Cmd/Ctrl + S` - Save (auto-saves)
- `Cmd/Ctrl + F` - Search Notes
- `ESC` - Close modals / Exit Focus Mode

## 🛠️ Tech Stack

- **Frontend:** React 18 + TypeScript
- **Styling:** Tailwind CSS
- **Build:** Vite
- **AI:** Google Gemini API
- **Storage:** LocalStorage (client-side)
- **PWA:** Service Workers + Web Manifest

## 📋 Roadmap

### ✅ Completed (v1.2.0)
- [x] Core note-taking functionality
- [x] AI-powered text tools
- [x] Resizable AI chat sidebar with dotted canvas
- [x] Action buttons on AI responses
- [x] Command palette
- [x] Focus mode
- [x] Voice input
- [x] Templates & Quick Capture
- [x] Auto-tagging
- [x] PWA support
- [x] Dark mode
- [x] Search & favorites
- [x] Thin scrollbars (4px)
- [x] Always-visible logo toggle

### 🔜 Next Steps
- [ ] Cloud sync & backup
- [ ] Collaborative editing
- [ ] Rich text editor (WYSIWYG)
- [ ] File attachments
- [ ] Note linking & backlinks
- [ ] Export to multiple formats
- [ ] Mobile apps (iOS/Android)
- [ ] Browser extensions
- [ ] API for integrations
- [ ] Multi-language support

## 🤝 Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

Built with ❤️ using React, TypeScript, and Google Gemini AI.

---

<div align="center">

**[Live Demo](https://notara.reliatrack.org)** • **[Report Bug](https://github.com/guychenya/notara/issues)** • **[Request Feature](https://github.com/guychenya/notara/issues)**

</div>

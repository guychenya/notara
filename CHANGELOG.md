# Changelog

All notable changes to Notara will be documented in this file.

## [1.1.0] - 2025-11-24

### Added
- **Resizable AI Chat Sidebar** - Gemini Canvas-style full-height sidebar with drag-to-resize (300px-800px)
- Improved AI chat UI with better spacing and modern design
- Visual resize handle with hover effects

### Changed
- Moved AI chat from floating panel to integrated right sidebar
- Enhanced chat message styling with rounded corners and better contrast
- Updated input area with larger, more accessible design

### Documentation
- Updated README.md with complete feature list and deployment instructions
- Created comprehensive PROJECT_REPORT.md with development timeline
- Updated CONTRIBUTING.md with contribution guidelines
- Added CHANGELOG.md for version tracking

## [1.0.0] - 2025-11-24

### Added - Phase 4: PWA Support
- Progressive Web App manifest with app icons
- Service worker for offline caching
- Online/offline status indicator with real-time monitoring
- Native share API integration
- Shareable link generation
- Install as app capability

### Added - Phase 3: AI Features
- AI Chat Panel with context-aware assistance
- Auto-tagging with AI-generated tags (3-5 per note)
- Persistent chat interface with streaming responses
- Chat history and typing indicators
- 9 AI text tools (Summarize, Improve, Explain, Continue, Expand, Shorten, Bullets, Actions, Translate)
- Text selection toolbar with contextual AI operations

### Added - Phase 2: Templates & Quick Capture
- 5 Professional Templates (Meeting Notes, Daily Journal, To-Do List, Project Plan, Blog Post)
- Daily Note with auto-generated dates
- Quick Capture widget for rapid thought capture
- Template integration with Command Palette

### Added - Phase 1: Core Features
- Sidebar toggle with Menu/X icons
- Command Palette (Cmd+K/Ctrl+K) with glassmorphism design
- Focus Mode for distraction-free writing
- Keyboard shortcuts (Cmd+K, ESC)
- Search bar in sidebar with real-time filtering
- Favorites/star system for notes
- Duplicate note functionality
- Word count and last edited timestamp
- Voice input with continuous speech-to-text

### Changed
- Rebranded from "Lumen Notes AI" to "Notara"
- Created custom layered stack logo
- Updated color scheme to Notara theme
- Improved voice mode with continuous capture
- Enhanced note hover icons with gradient background

### Deployment
- Deployed to Coolify on Contabo VPS (157.173.126.133)
- Configured domain: notara.reliatrack.org
- Set up Traefik proxy with automatic SSL
- Dockerized application with Node 20 Alpine

### Infrastructure
- Created Dockerfile for containerized deployment
- Set up GitHub repository: guychenya/lumen-notes-ai
- Configured environment variables for API keys
- Implemented rolling updates for zero-downtime deployments

## [0.1.0] - Initial Release

### Added
- Basic note-taking functionality
- Markdown support
- Dark/Light mode toggle
- LocalStorage persistence
- AI text generation with Gemini API
- Basic note management (create, edit, delete)

---

## Upcoming Features

### Next Release (v1.2.0)
- [ ] Cloud sync and backup
- [ ] Note linking and backlinks
- [ ] Export to PDF/Markdown/HTML
- [ ] Rich text editor (WYSIWYG mode)
- [ ] File attachments support

### Future Releases
- [ ] Collaborative editing
- [ ] Browser extensions
- [ ] Mobile apps (iOS/Android)
- [ ] Multi-language support
- [ ] API for integrations
- [ ] Plugin system

---

**Format:** [Version] - YYYY-MM-DD
**Types:** Added, Changed, Deprecated, Removed, Fixed, Security

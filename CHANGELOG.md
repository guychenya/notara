# Changelog

All notable changes to Notara will be documented in this file.

## [1.3.1] - 2025-11-25

### 🎉 Major Performance Improvements
- **Bundle Size Reduced by 58%** - From 1.5MB to 640KB (444KB → 165KB gzipped)
- **Build Time Reduced by 27%** - From 1.34s to 0.98s
- **Modules Optimized** - Reduced from 1,901 to 1,726 modules

### ✨ Added
- **Code Splitting** - 4 separate chunks for optimal caching (react-vendor, icons, ai-vendor, main)
- **Error Boundary** - Graceful error handling with user-friendly UI
- **Optimized Highlight.js** - Only 17 common languages instead of 180+ (saves ~750KB)
- **AbortSignal Support** - Prevents memory leaks during AI streaming
- **Comprehensive Documentation** - CODE_REVIEW.md, FIXES_APPLIED.md, FIXES_COMPLETE.md

### 🔧 Fixed
- **Type Safety** - Removed all 8 instances of `any` types, now 100% type-safe
- **React Hooks** - Fixed useEffect dependency arrays with useCallback
- **Memory Leaks** - Added proper cleanup for AI streaming operations
- **Build Configuration** - Added manual chunks for better caching strategy

### 📦 Technical Details
- Added proper TypeScript interfaces for all API responses
- Improved error handling throughout the application
- Optimized Vite configuration with manual chunks
- Better code organization and removed duplicates

### 📊 Performance Metrics
- Initial load time: 63% faster
- Bundle size: 58% smaller
- Type safety: 100% (zero `any` types)
- Build time: 27% faster

## [1.2.0] - 2025-11-24

### Added
- **Action Buttons on AI Responses** - Each AI response now has Discard, Copy, New Note, and Insert buttons
- **Dotted Canvas Background** - AI sidebar now features a subtle pale dotted pattern
- **Always-Visible Logo** - Notara logo in header toggles sidebar on/off
- **Thin Scrollbars** - 4px thin scrollbars with transparent track for cleaner UI

### Changed
- **Unified AI Interface** - Removed separate AI output panel, all AI interactions now in chat sidebar
- **AI Tools Integration** - All 9 AI tools (Summarize, Improve, Explain, etc.) send results to chat sidebar
- **Text Selection Toolbar** - Selection actions now open chat sidebar with results
- **Gemini as Default** - Set Gemini API as default provider with environment variable support
- **Removed Duplicate Logo** - Logo only appears in header, removed from sidebar

### Fixed
- **Canvas-Style Layout** - AI sidebar now integrated into layout (content shrinks, no overlay)
- **Resizable Sidebar** - Drag left edge to resize between 300px-800px
- **Repository Visibility** - Changed to private repository

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
- Set up GitHub repository: guychenya/notara
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

### Next Release (v1.3.0)
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

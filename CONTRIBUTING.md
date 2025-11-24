# Contributing to Notara

Thank you for your interest in contributing to Notara! We welcome contributions from the community.

## 🚀 Getting Started

1. **Fork the repository**
   ```bash
   git clone https://github.com/guychenya/lumen-notes-ai.git
   cd lumen-notes-ai
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment**
   ```bash
   cp .env.local.example .env.local
   # Add your GEMINI_API_KEY
   ```

4. **Run development server**
   ```bash
   npm run dev
   ```

## 🎯 How to Contribute

### Reporting Bugs
- Use GitHub Issues
- Include steps to reproduce
- Provide browser/OS information
- Add screenshots if applicable

### Suggesting Features
- Open a GitHub Issue with the "enhancement" label
- Describe the feature and use case
- Explain why it would be valuable

### Pull Requests
1. Create a new branch: `git checkout -b feature/your-feature-name`
2. Make your changes
3. Test thoroughly
4. Commit with clear messages: `git commit -m "Add feature: description"`
5. Push to your fork: `git push origin feature/your-feature-name`
6. Open a Pull Request

## 📝 Code Guidelines

### TypeScript
- Use TypeScript for all new code
- Define proper types and interfaces
- Avoid `any` types when possible

### React
- Use functional components with hooks
- Keep components small and focused
- Use meaningful component and variable names

### Styling
- Use Tailwind CSS utility classes
- Follow existing dark mode patterns
- Maintain responsive design

### Commit Messages
- Use clear, descriptive messages
- Start with a verb (Add, Fix, Update, Remove)
- Keep first line under 50 characters
- Add details in body if needed

## 🧪 Testing

- Test your changes in both light and dark modes
- Verify responsive design on different screen sizes
- Test keyboard shortcuts
- Ensure offline functionality works (PWA)

## 🔍 Areas for Contribution

### High Priority
- Cloud sync and backup
- Note linking and backlinks
- Export functionality improvements
- Rich text editor (WYSIWYG)
- File attachments

### Medium Priority
- Browser extensions
- Mobile apps
- Multi-language support
- Advanced search features
- Collaborative editing

### Good First Issues
- UI/UX improvements
- Documentation updates
- Bug fixes
- Accessibility enhancements
- Performance optimizations

## 📚 Resources

- **Live Demo:** https://notara.reliatrack.org
- **Documentation:** See README.md and PROJECT_REPORT.md
- **Tech Stack:** React 18, TypeScript, Tailwind CSS, Vite
- **AI Provider:** Google Gemini API

## 💬 Questions?

- Open a GitHub Discussion
- Create an issue with the "question" label

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for helping make Notara better! 🎉

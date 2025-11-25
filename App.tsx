import React, { useState, useRef, useEffect, useMemo } from 'react';
import { AIProvider, useAI } from './context/AIContext';
import { NotesProvider, useNotes } from './context/NotesContext';
import { FolderProvider, useFolders } from './context/FolderContext';
import { useTheme } from './context/ThemeContext';
import { AISettingsModal } from './components/AISettingsModal';
import { Button } from './components/ui/Button';
import { LLMService } from './services/llmService';
import { htmlToMarkdown } from './services/converter';
import { parseMarkdown } from './services/markdown';
import { TableOfContents } from './components/TableOfContents';
import { Breadcrumbs } from './components/Breadcrumbs';
import { FolderTree } from './components/FolderTree';
import { EnhancedSearch } from './components/EnhancedSearch';
import { SlashCommandMenu, type SlashCommand } from './components/SlashCommandMenu';
import { VoiceModeModal } from './components/VoiceModeModal';
import { importObsidianVault, exportAsObsidianVault } from './services/obsidian';
import { exportToHTML, exportToDOCX, batchExport } from './services/export';
import { ChatMessage } from './types';
import 'highlight.js/styles/github-dark.css';
import { 
  Settings, Sparkles, Plus, FileText, ChevronRight, MoreHorizontal, Zap,
  Bold, Italic, List, PenLine, Trash2, Edit2, Image as ImageIcon, 
  Table as TableIcon, Download, Upload, File, FileCode, Printer, ChevronDown, Mic,
  Heading1, Heading2, Heading3, ListOrdered, CheckSquare, Quote, Code, Minus, Video, Type,
  Eye, Columns, Moon, Sun, Menu, X, Languages, Lightbulb, ArrowRight, Maximize2, Minimize2,
  CheckCircle, Search, Star, Copy, Clock, Folder, Tag, Share2, History, Wand2
} from 'lucide-react';

// Helper to calculate caret coordinates in a textarea
const getCaretCoordinates = (element: HTMLTextAreaElement, position: number) => {
  const div = document.createElement('div');
  const style = window.getComputedStyle(element);
  
  // Copy styles to mirror div
  Array.from(style).forEach(prop => {
    div.style.setProperty(prop, style.getPropertyValue(prop));
  });

  div.style.position = 'absolute';
  div.style.top = '0';
  div.style.left = '0';
  div.style.visibility = 'hidden';
  div.style.height = 'auto';
  div.style.width = style.width; 
  div.style.whiteSpace = 'pre-wrap';
  div.style.overflowWrap = 'break-word';

  // Content up to caret
  div.textContent = element.value.substring(0, position);
  
  const span = document.createElement('span');
  span.textContent = element.value.substring(position) || '.'; // Ensure span has height
  div.appendChild(span);
  
  document.body.appendChild(div);
  
  const spanOffsetLeft = span.offsetLeft;
  const spanOffsetTop = span.offsetTop;
  
  const rect = element.getBoundingClientRect();
  
  document.body.removeChild(div);

  return {
    left: rect.left + spanOffsetLeft - element.scrollLeft,
    top: rect.top + spanOffsetTop - element.scrollTop
  };
};

type ViewMode = 'edit' | 'split' | 'preview';

const EditorWorkspace = () => {
  const { setSettingsOpen, config, connectionStatus } = useAI();
  const { notes, activeNote, activeNoteId, setActiveNoteId, addNote, updateNote, deleteNote, importNote } = useNotes();
  const { folders, addFolder, updateFolder, deleteFolder } = useFolders();
  const { theme, toggleTheme } = useTheme();
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedText, setGeneratedText] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isVoiceModeOpen, setIsVoiceModeOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [selectedFolderId, setSelectedFolderId] = useState<string | undefined>();
  const [showEnhancedSearch, setShowEnhancedSearch] = useState(false);
  
  // Phase 1: Command Palette & Focus Mode
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [commandQuery, setCommandQuery] = useState("");
  const [focusMode, setFocusMode] = useState(false);
  
  // Phase 2: Templates & Quick Capture
  const [showTemplates, setShowTemplates] = useState(false);
  const [showQuickCapture, setShowQuickCapture] = useState(false);
  const [quickCaptureText, setQuickCaptureText] = useState("");
  
  // Phase 3: AI Chat & Smart Features
  const [showAIChat, setShowAIChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [aiPanelWidth, setAiPanelWidth] = useState(400);
  const [isResizing, setIsResizing] = useState(false);
  const [isChatGenerating, setIsChatGenerating] = useState(false);
  const [showAITools, setShowAITools] = useState(false);
  
  // Phase 4: PWA & Sharing
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showShareMenu, setShowShareMenu] = useState(false);
  
  // Text Selection State
  const [selectedText, setSelectedText] = useState("");
  const [selectionToolbarPos, setSelectionToolbarPos] = useState({ top: 0, left: 0 });
  const [showSelectionToolbar, setShowSelectionToolbar] = useState(false);
  
  // View Mode & Resizing State
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [splitPos, setSplitPos] = useState(50); // Percentage
  const [isDragging, setIsDragging] = useState(false);

  // Slash Command State
  const [slashMenuOpen, setSlashMenuOpen] = useState(false);
  const [slashMenuPos, setSlashMenuPos] = useState({ top: 0, left: 0 });

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const headerTitleRef = useRef<HTMLInputElement>(null);
  const imageFileInputRef = useRef<HTMLInputElement>(null);
  const mdFileInputRef = useRef<HTMLInputElement>(null);
  const obsidianVaultInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const chatMessagesRef = useRef<HTMLDivElement>(null);
  const renameTriggered = useRef<string | null>(null);

  // Effect to handle focusing the title input for renaming
  useEffect(() => {
    if (renameTriggered.current && activeNoteId === renameTriggered.current) {
        if (headerTitleRef.current) {
            headerTitleRef.current.focus();
            headerTitleRef.current.select();
        }
        renameTriggered.current = null;
    }
  }, [activeNoteId]);

  // Auto-scroll chat messages to bottom
  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Auto-focus textarea when switching notes or creating new ones
  useEffect(() => {
    if (activeNote && textareaRef.current && !focusMode) {
      setTimeout(() => {
        textareaRef.current?.focus();
        // Place cursor at end of content
        const length = textareaRef.current?.value.length || 0;
        textareaRef.current?.setSelectionRange(length, length);
      }, 100);
    }
  }, [activeNoteId, focusMode]);

  // Command Palette keyboard shortcut (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette(true);
      }
      if (e.key === 'Escape') {
        setShowCommandPalette(false);
        setFocusMode(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Phase 4: Online/Offline detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);


  // --- HTML/MD State Sync & Editor Filtering ---
  const imageRefRegex = /^\s*\[img_.*?\]: data:image\/.*$/gm;

  // FIX: Removed `localContent` state. The editor's value is now derived directly
  // from `activeNote.content` using `useMemo`. This creates a single source of
  // truth and prevents state synchronization bugs that caused the editor to "get stuck".
  const editorContent = useMemo(() => {
    if (!activeNote) return "";
    let contentToDisplay = activeNote.content;
    const isLikelyHtml = /^\s*<[^>]+>/i.test(contentToDisplay);
    if (isLikelyHtml) {
        contentToDisplay = htmlToMarkdown(contentToDisplay);
    }
    // Filter out image reference definitions for a cleaner editor view.
    return contentToDisplay.replace(imageRefRegex, '').trim();
  }, [activeNote]);


  const handleContentChange = (val: string) => {
      if (activeNote) {
          // Re-attach the image reference definitions that are visually hidden.
          const imageRefs = activeNote.content.match(imageRefRegex) || [];
          const fullContent = val + (imageRefs.length > 0 ? '\n\n' + imageRefs.join('\n') : '');
          updateNote(activeNote.id, { content: fullContent });
      }
  };

  // --- Resizing Logic ---
  const startResizing = () => {
    setIsDragging(true);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const w = rect.width;
    let percent = (x / w) * 100;
    
    // Clamp between 20% and 80%
    if (percent < 20) percent = 20;
    if (percent > 80) percent = 80;
    
    setSplitPos(percent);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  // --- Note Actions ---
  const handleRenameClick = (noteId: string) => {
    renameTriggered.current = noteId;
    setActiveNoteId(noteId);
  };

  const handleDeleteClick = (noteId: string) => {
    if (window.confirm('Are you sure you want to delete this note? This action cannot be undone.')) {
        deleteNote(noteId);
    }
  };

  // Helper to insert text at cursor
  const insertTextAtCursor = (text: string, cursorOffset = 0) => {
      if (!textareaRef.current || !activeNote) return;
      
      const start = textareaRef.current.selectionStart;
      const end = textareaRef.current.selectionEnd;
      const currentVal = activeNote.content;
      
      const newVal = currentVal.substring(0, start) + text + currentVal.substring(end);
      
      updateNote(activeNote.id, { content: newVal });
      
      // Reset cursor position
      requestAnimationFrame(() => {
          if (textareaRef.current) {
              textareaRef.current.focus();
              textareaRef.current.setSelectionRange(start + text.length + cursorOffset, start + text.length + cursorOffset);
          }
      });
  };

  const insertVideoBlock = () => {
      const url = prompt("Enter Video URL (YouTube or MP4):");
      if (!url) return;

      // Simple robust detection
      let videoId = '';
      if (url.includes('youtube.com') || url.includes('youtu.be')) {
        if (url.includes('youtu.be')) {
            videoId = url.split('/').pop() || '';
        } else if (url.includes('v=')) {
            videoId = url.split('v=')[1]?.split('&')[0] || '';
        } else if (url.includes('embed/')) {
            videoId = url.split('embed/')[1]?.split('?')[0] || '';
        }
      }

      let block = '';
      if (videoId) {
          block = `\n<div class="aspect-video my-6 rounded-xl overflow-hidden border border-gray-200 dark:border-[#333] shadow-lg"><iframe src="https://www.youtube.com/embed/${videoId}" class="w-full h-full" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>\n`;
      } else {
          block = `\n<div class="aspect-video my-6 rounded-xl overflow-hidden border border-gray-200 dark:border-[#333] shadow-lg"><video src="${url}" controls class="w-full h-full"></video></div>\n`;
      }
      insertTextAtCursor(block);
  };

  const slashCommands: SlashCommand[] = [
      {
        id: 'h1',
        label: 'Heading 1',
        icon: Heading1,
        description: 'Big section heading',
        action: () => insertTextAtCursor('# ')
      },
      {
        id: 'h2',
        label: 'Heading 2',
        icon: Heading2,
        description: 'Medium section heading',
        action: () => insertTextAtCursor('## ')
      },
      {
        id: 'h3',
        label: 'Heading 3',
        icon: Heading3,
        description: 'Small section heading',
        action: () => insertTextAtCursor('### ')
      },
      {
        id: 'text',
        label: 'Text',
        icon: Type,
        description: 'Plain text paragraph',
        action: () => insertTextAtCursor('')
      },
      {
        id: 'bullet',
        label: 'Bullet List',
        icon: List,
        description: 'Create a bulleted list',
        action: () => insertTextAtCursor('- ')
      },
      {
        id: 'numbered',
        label: 'Numbered List',
        icon: ListOrdered,
        description: 'Create a numbered list',
        action: () => insertTextAtCursor('1. ')
      },
      {
        id: 'todo',
        label: 'To-Do List',
        icon: CheckSquare,
        description: 'Track tasks with a checklist',
        action: () => insertTextAtCursor('- [ ] ')
      },
      {
        id: 'image-upload',
        label: 'Image Upload',
        icon: Upload,
        description: 'Upload an image from your device',
        action: () => imageFileInputRef.current?.click()
      },
      {
        id: 'image-url',
        label: 'Image (URL)',
        icon: ImageIcon,
        description: 'Embed an image via link',
        action: () => {
            const url = prompt("Enter Image URL:");
            if(url) insertTextAtCursor(`![Image](${url})`);
        }
      },
      {
        id: 'video',
        label: 'Video / YouTube',
        icon: Video,
        description: 'Embed a video from URL or YouTube',
        action: () => insertVideoBlock()
      },
      {
        id: 'table',
        label: 'Table',
        icon: TableIcon,
        description: 'Insert a table template',
        action: () => insertTextAtCursor('\n| Header 1 | Header 2 |\n| -------- | -------- |\n| Cell 1   | Cell 2   |\n')
      },
      {
        id: 'quote',
        label: 'Quote',
        icon: Quote,
        description: 'Capture a quote',
        action: () => insertTextAtCursor('> ')
      },
      {
        id: 'code',
        label: 'Code Block',
        icon: Code,
        description: 'Capture a code snippet',
        action: () => insertTextAtCursor('\n```\ncode here\n```\n')
      },
      {
        id: 'divider',
        label: 'Divider',
        icon: Minus,
        description: 'Visually divide blocks',
        action: () => insertTextAtCursor('\n---\n')
      }
  ];

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Close slash menu on Enter in textarea
    if (e.key === 'Enter' && slashMenuOpen) {
        setSlashMenuOpen(false);
    }
    
    // Open slash menu on '/' key
    if (e.key === '/' && !slashMenuOpen) {
        if (textareaRef.current) {
            const pos = textareaRef.current.selectionStart;
            const coords = getCaretCoordinates(textareaRef.current, pos);
            
            setSlashMenuPos({
                top: coords.top + 24,
                left: coords.left
            });
            setSlashMenuOpen(true);
        }
    }
  };

  const handleKeyUp = (e: React.KeyboardEvent) => {
      // Close menu if user backspaces the slash
      if (slashMenuOpen && e.key === 'Backspace') {
          setSlashMenuOpen(false); 
      }
  };

  const executeSlashCommand = (command: SlashCommand) => {
    if (!textareaRef.current || !activeNote) return;

    const textarea = textareaRef.current;
    const cursorPos = textarea.selectionStart;
    const content = textarea.value; // Use the current value from the textarea directly

    // Find the slash that triggered the menu
    const slashPos = content.lastIndexOf('/', cursorPos - 1);

    if (slashPos === -1) {
      setSlashMenuOpen(false);
      return;
    }

    // Remove the slash and any text typed after it to open the menu
    const beforeSlash = content.substring(0, slashPos);
    const afterSlash = content.substring(cursorPos);
    const newContent = beforeSlash + afterSlash;

    // First, update the state to remove the slash command text
    updateNote(activeNote.id, { content: newContent });
    setSlashMenuOpen(false);

    // Now, use a timeout to ensure the state update has rendered,
    // then insert the new block and position the cursor correctly.
    setTimeout(() => {
      if (!textareaRef.current) return;
      
      // The cursor should be at the position where the slash was
      textareaRef.current.setSelectionRange(slashPos, slashPos);

      // Now, execute the command's action
      command.action();
    }, 0);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onload = (e) => {
              const base64 = e.target?.result as string;
              const cleanName = file.name.replace(/[\[\]\(\)\s]/g, '_'); 
              const refId = `img_${Date.now()}`;
              
              const imageTag = `![${cleanName}][${refId}]`;
              const newRefDef = `[${refId}]: ${base64}`;

              if (!textareaRef.current || !activeNote) return;
              
              const start = textareaRef.current.selectionStart;
              const end = textareaRef.current.selectionEnd;
              const currentEditorVal = textareaRef.current.value;
              
              const newEditorVal = currentEditorVal.substring(0, start) + imageTag + currentEditorVal.substring(end);
              
              const existingImageRefs = activeNote.content.match(imageRefRegex) || [];
              const allRefs = [...existingImageRefs, newRefDef];
              const newFullContent = newEditorVal.trim() + '\n\n' + allRefs.join('\n');
              
              updateNote(activeNote.id, { content: newFullContent.trim() });
              
              setTimeout(() => {
                  if (textareaRef.current) {
                      textareaRef.current.focus();
                      const newCursorPos = start + imageTag.length;
                      textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
                  }
              }, 0);
          };
          reader.readAsDataURL(file);
      }
      e.target.value = '';
  };

  // Phase 2: Templates & Daily Note
  const templates = {
    meeting: {
      title: 'Meeting Notes',
      content: `# Meeting Notes\n\n**Date:** ${new Date().toLocaleDateString()}\n**Attendees:** \n\n## Agenda\n- \n\n## Discussion\n\n## Action Items\n- [ ] \n\n## Next Steps\n`
    },
    journal: {
      title: 'Daily Journal',
      content: `# Daily Journal - ${new Date().toLocaleDateString()}\n\n## Morning Thoughts\n\n## What I'm Grateful For\n1. \n2. \n3. \n\n## Today's Goals\n- [ ] \n\n## Evening Reflection\n`
    },
    todo: {
      title: 'To-Do List',
      content: `# To-Do List\n\n## High Priority\n- [ ] \n\n## Medium Priority\n- [ ] \n\n## Low Priority\n- [ ] \n\n## Completed\n`
    },
    project: {
      title: 'Project Plan',
      content: `# Project Plan\n\n## Overview\n\n## Goals\n1. \n\n## Timeline\n\n## Resources Needed\n\n## Milestones\n- [ ] \n\n## Notes\n`
    },
    blog: {
      title: 'Blog Post',
      content: `# Blog Post Title\n\n## Introduction\n\n## Main Content\n\n### Section 1\n\n### Section 2\n\n## Conclusion\n\n---\n*Tags:* \n*Published:* ${new Date().toLocaleDateString()}`
    }
  };

  const createFromTemplate = (templateKey: keyof typeof templates) => {
    const template = templates[templateKey];
    addNote();
    setTimeout(() => {
      const newNote = notes[0];
      updateNote(newNote.id, { title: template.title, content: template.content });
      setActiveNoteId(newNote.id);
    }, 100);
    setShowTemplates(false);
  };

  const createDailyNote = () => {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const content = `# ${today}\n\n## Morning\n\n## Afternoon\n\n## Evening\n\n## Notes\n`;
    addNote();
    setTimeout(() => {
      const newNote = notes[0];
      updateNote(newNote.id, { title: `Daily Note - ${new Date().toLocaleDateString()}`, content });
      setActiveNoteId(newNote.id);
    }, 100);
  };

  const handleQuickCapture = () => {
    if (!quickCaptureText.trim()) return;
    addNote();
    setTimeout(() => {
      const newNote = notes[0];
      updateNote(newNote.id, { title: 'Quick Capture', content: quickCaptureText });
      setActiveNoteId(newNote.id);
      setQuickCaptureText("");
      setShowQuickCapture(false);
    }, 100);
  };

  // Phase 3: AI Chat & Smart Features
  const handleChatSend = async () => {
    if (!chatInput.trim() || isChatGenerating) return;
    
    const userMessage: ChatMessage = { role: 'user', content: chatInput };
    setChatMessages(prev => [...prev, userMessage]);
    setChatInput("");
    setIsChatGenerating(true);

    const service = new LLMService(config);
    const context = activeNote ? `Current note: "${activeNote.title}"\n\n${activeNote.content}\n\n` : '';
    const messages: ChatMessage[] = [
      { role: 'system', content: `You are a helpful AI assistant for a note-taking app. ${context}` },
      ...chatMessages,
      userMessage
    ];

    try {
      let response = "";
      const generator = service.streamResponse(messages);
      
      setChatMessages(prev => [...prev, { role: 'assistant', content: '' }]);
      
      for await (const token of generator) {
        response += token;
        setChatMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1].content = response;
          return newMessages;
        });
      }
    } catch (e) {
      setChatMessages(prev => [...prev, { role: 'assistant', content: 'Error: Could not generate response.' }]);
    } finally {
      setIsChatGenerating(false);
    }
  };

  const generateAutoTags = async () => {
    if (!activeNote?.content) return;
    if (activeNote.tags && activeNote.tags.length > 0) return; // Don't regenerate if tags exist
    
    const service = new LLMService(config);
    const prompt = `Analyze this note and suggest 3-5 relevant tags (single words or short phrases). Output ONLY the tags separated by commas, nothing else:\n\n${activeNote.content}`;
    
    try {
      let result = "";
      const generator = service.streamResponse([{ role: 'user', content: prompt }]);
      for await (const token of generator) {
        result += token;
      }
      // Clean up the result - remove any extra text, quotes, or formatting
      const cleaned = result
        .replace(/^(tags?:|here are|suggested tags?:)/gi, '')
        .replace(/["\[\]]/g, '')
        .trim();
      const tags = cleaned
        .split(/[,\n]/)
        .map(t => t.trim())
        .filter(t => t.length > 0 && t.length < 30)
        .slice(0, 5);
      
      // Save tags to the note
      updateNote(activeNote.id, { tags });
    } catch (e) {
      console.error('Auto-tag error:', e);
    }
  };

  // Tag color palette
  const getTagColor = (index: number) => {
    const colors = [
      'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
      'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
      'bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400',
      'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
      'bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400',
    ];
    return colors[index % colors.length];
  };

  // Phase 4: Sharing functions
  const shareNote = async () => {
    if (!activeNote) return;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: activeNote.title,
          text: activeNote.content,
        });
      } catch (e) {
        console.log('Share cancelled');
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(`${activeNote.title}\n\n${activeNote.content}`);
      alert('Note copied to clipboard!');
    }
    setShowShareMenu(false);
  };

  const generateShareLink = () => {
    if (!activeNote) return;
    const encoded = btoa(JSON.stringify({ title: activeNote.title, content: activeNote.content }));
    const url = `${window.location.origin}?share=${encoded}`;
    navigator.clipboard.writeText(url);
    alert('Share link copied to clipboard!');
    setShowShareMenu(false);
  };

  const handleImportMarkdown = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        const content = event.target?.result as string;
        
        const generateTitle = (filename: string) => {
            const base = filename.replace(/\.(md|markdown)$/i, '');
            return base.replace(/[_-]/g, ' ')
                       .split(' ')
                       .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                       .join(' ');
        };
        const title = generateTitle(file.name);
        importNote(title, content);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleImportObsidianVault = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      const importedNotes = await importObsidianVault(files);
      importedNotes.forEach(note => {
        importNote(note.title, note.content);
      });
      alert(`Successfully imported ${importedNotes.length} notes from Obsidian vault!`);
    } catch (error) {
      console.error('Obsidian import error:', error);
      alert('Failed to import Obsidian vault');
    }
    e.target.value = '';
  };

  const handleExportAsObsidian = () => {
    if (notes.length === 0) {
      alert('No notes to export');
      return;
    }
    exportAsObsidianVault(notes);
    alert(`Exporting ${notes.length} notes as Obsidian vault...`);
  };

  // --- AI Actions ---
  const handleAIAction = async (promptPrefix: string) => {
    if (!editorContent) return;
    
    // Open AI chat sidebar if not already open
    if (!showAIChat) setShowAIChat(true);
    
    // Add user message to chat
    const userMessage: ChatMessage = { role: 'user', content: `${promptPrefix}:\n\n${editorContent.substring(0, 500)}${editorContent.length > 500 ? '...' : ''}` };
    setChatMessages(prev => [...prev, userMessage]);
    setIsChatGenerating(true);

    const service = new LLMService(config);
    const fullPrompt = `${promptPrefix} for the following text. Output in Markdown format:\n\n${editorContent}`;
    const messages: ChatMessage[] = [{ role: 'user', content: fullPrompt }];

    try {
        let response = "";
        const generator = service.streamResponse(messages);
        
        setChatMessages(prev => [...prev, { role: 'assistant', content: '' }]);
        
        for await (const token of generator) {
          response += token;
          setChatMessages(prev => {
            const newMessages = [...prev];
            newMessages[newMessages.length - 1].content = response;
            return newMessages;
          });
        }
    } catch (e) {
        setChatMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1].content = "Error generating response. Please check your AI Settings.";
          return newMessages;
        });
    } finally {
        setIsChatGenerating(false);
    }
  };

  const handleSelectionAI = async (promptPrefix: string, replaceSelection: boolean = false) => {
    if (!selectedText) return;
    
    // Open AI chat sidebar if not already open
    if (!showAIChat) setShowAIChat(true);
    
    setShowSelectionToolbar(false);
    
    // Add user message to chat
    const userMessage: ChatMessage = { role: 'user', content: `${promptPrefix}:\n\n${selectedText}` };
    setChatMessages(prev => [...prev, userMessage]);
    setIsChatGenerating(true);

    const service = new LLMService(config);
    const fullPrompt = `${promptPrefix} for the following text. Output in Markdown format:\n\n${selectedText}`;
    const messages: ChatMessage[] = [{ role: 'user', content: fullPrompt }];

    try {
        let response = "";
        const generator = service.streamResponse(messages);
        
        setChatMessages(prev => [...prev, { role: 'assistant', content: '' }]);
        
        for await (const token of generator) {
          response += token;
          setChatMessages(prev => {
            const newMessages = [...prev];
            newMessages[newMessages.length - 1].content = response;
            return newMessages;
          });
        }
    } catch (e) {
        setChatMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1].content = "Error generating response. Please check your AI Settings.";
          return newMessages;
        });
    } finally {
        setIsChatGenerating(false);
    }
  };

  const handleTextSelection = () => {
    if (!textareaRef.current) return;
    
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const selected = editorContent.substring(start, end);
    
    if (selected.length > 0) {
      setSelectedText(selected);
      const rect = textareaRef.current.getBoundingClientRect();
      setSelectionToolbarPos({
        top: rect.top - 60,
        left: rect.left + (rect.width / 2)
      });
      setShowSelectionToolbar(true);
    } else {
      setShowSelectionToolbar(false);
    }
  };

  const handleAIInsert = () => {
      insertTextAtCursor(`\n\n${generatedText}\n\n`);
      setGeneratedText("");
  };

  const handleExport = (type: 'md' | 'txt' | 'pdf') => {
      if (!activeNote) return;
      setIsExportMenuOpen(false);

      if (type === 'pdf') {
          window.print();
          return;
      }

      // For md/txt, use the full, un-filtered content
      const content = activeNote.content;
      const mime = type === 'md' ? 'text/markdown' : 'text/plain';
      const ext = type;

      const blob = new Blob([content], { type: mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${activeNote.title || 'untitled'}.${ext}`;
      a.click();
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]';
      case 'checking': return 'bg-yellow-500 animate-pulse';
      case 'disconnected': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="flex min-h-screen bg-white dark:bg-[#0F0F0F] text-gray-800 dark:text-gray-100 font-sans overflow-hidden">
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && !focusMode && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      {isSidebarOpen && !focusMode && (
      <div className="w-64 md:w-64 w-full md:relative fixed inset-y-0 left-0 bg-gray-50 dark:bg-[#111111] border-r border-gray-200 dark:border-[#222] flex flex-col min-w-[250px] shrink-0 print:hidden z-50 md:z-20">
        <div className="p-4 border-b border-gray-200 dark:border-[#222]">
          <div className="relative flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setShowEnhancedSearch(true)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#333] rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-600"
              />
            </div>
          </div>
        </div>
        
        <div className="flex-1 p-3 space-y-1 overflow-y-auto custom-scrollbar">
           <FolderTree
             folders={folders}
             selectedFolderId={selectedFolderId}
             onSelectFolder={setSelectedFolderId}
             onAddFolder={addFolder}
             onUpdateFolder={updateFolder}
             onDeleteFolder={deleteFolder}
             onAddNoteToFolder={(folderId) => addNote(folderId)}
             onMoveNoteToFolder={(noteId, folderId) => updateNote(noteId, { folderId })}
           />
           <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-500 uppercase tracking-wider">Notes</div>
           {notes.filter(note => {
             const matchesSearch = note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
               note.content.toLowerCase().includes(searchQuery.toLowerCase());
             const matchesFolder = !selectedFolderId || note.folderId === selectedFolderId;
             return matchesSearch && matchesFolder;
           }).map(note => (
               <div 
                 key={note.id} 
                 className="relative group flex items-center"
                 draggable
                 onDragStart={(e) => e.dataTransfer.setData('noteId', note.id)}
               >
                    <button 
                        onClick={() => setActiveNoteId(note.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2 group-hover:pr-28 text-sm rounded-lg transition-all text-left ${
                            activeNoteId === note.id 
                            ? 'bg-gray-200 dark:bg-[#1C1C1C] text-gray-900 dark:text-white border border-gray-300 dark:border-[#333]' 
                            : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#1A1A1A] hover:text-gray-700 dark:hover:text-gray-200'
                        }`}
                    >
                        {favorites.has(note.id) && <Star className="w-3 h-3 fill-yellow-400 text-yellow-400 shrink-0" />}
                        <FileText className={`w-4 h-4 shrink-0 ${activeNoteId === note.id ? 'text-emerald-500' : 'text-gray-500 dark:text-gray-500'}`} />
                        <span className="truncate flex-1">{note.title || "Untitled Note"}</span>
                    </button>
                    <div className="absolute right-1 top-0 bottom-0 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-gradient-to-l from-gray-100 dark:from-[#1A1A1A] via-gray-100 dark:via-[#1A1A1A] to-transparent pl-6 pr-1">
                        <button 
                            onClick={() => {
                              const newFavs = new Set(favorites);
                              if (newFavs.has(note.id)) newFavs.delete(note.id);
                              else newFavs.add(note.id);
                              setFavorites(newFavs);
                            }}
                            className="p-1 text-gray-500 dark:text-gray-400 hover:text-yellow-500 dark:hover:text-yellow-400 hover:bg-gray-200 dark:hover:bg-[#2A2A2A] rounded"
                            title={favorites.has(note.id) ? "Remove from favorites" : "Add to favorites"}
                        >
                            <Star className={`w-3 h-3 ${favorites.has(note.id) ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                        </button>
                        <button 
                            onClick={() => handleRenameClick(note.id)}
                            className="p-1 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-200 dark:hover:bg-[#2A2A2A] rounded"
                            title="Rename note"
                        >
                            <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button 
                            onClick={() => {
                              const newNote = { ...note, id: Date.now().toString(), title: note.title + ' (Copy)', updatedAt: Date.now() };
                              addNote();
                              setTimeout(() => updateNote(notes[0].id, newNote), 100);
                            }}
                            className="p-1 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-500/10 rounded"
                            title="Duplicate note"
                        >
                            <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button 
                            onClick={() => handleDeleteClick(note.id)}
                            className="p-1 text-red-500/70 hover:text-red-600 dark:hover:text-red-500 hover:bg-red-500/10 rounded"
                            title="Delete note"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    </div>
               </div>
           ))}
        </div>

        <div className="p-3 border-t border-gray-200 dark:border-[#222] mt-auto space-y-2">
           <Button 
             onClick={addNote}
             className="w-full bg-emerald-600 hover:bg-emerald-700 dark:hover:bg-emerald-500 shadow-lg shadow-emerald-900/20"
           >
              <Plus className="w-4 h-4 mr-2" /> New Note
           </Button>
           <div className="grid grid-cols-2 gap-2">
            <Button 
                variant="secondary"
                onClick={() => mdFileInputRef.current?.click()}
                className="text-xs"
                title="Import Markdown"
            >
                <Upload className="w-3.5 h-3.5 mr-1" /> Import
            </Button>
            <Button 
                variant="secondary"
                onClick={() => obsidianVaultInputRef.current?.click()}
                className="text-xs"
                title="Import Obsidian Vault"
            >
                <Folder className="w-3.5 h-3.5 mr-1" /> Obsidian
            </Button>
            <Button 
                variant="secondary"
                onClick={handleExportAsObsidian}
                className="text-xs"
                title="Export as Obsidian Vault"
            >
                <Download className="w-3.5 h-3.5 mr-1" /> Export
            </Button>
            <Button 
                variant="secondary" 
                onClick={toggleTheme}
                className="text-xs"
            >
                {theme === 'dark' ? <Sun className="w-3.5 h-3.5 mr-1" /> : <Moon className="w-3.5 h-3.5 mr-1" />}
                {theme === 'dark' ? 'Light' : 'Dark'}
            </Button>
           </div>
        </div>
      </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 relative h-screen overflow-x-hidden" style={showAIChat && window.innerWidth >= 768 ? { marginRight: `${aiPanelWidth}px` } : {}}>
        
        {/* Header */}
        {!focusMode && (
        <header className="h-14 border-b border-gray-200 dark:border-[#222] bg-gray-50 dark:bg-[#111111] flex items-center justify-between px-2 md:px-4 shrink-0 print:hidden z-20">
           <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 w-full mr-4">
             <button
               onClick={() => setIsSidebarOpen(!isSidebarOpen)}
               className="flex items-center gap-2 text-emerald-500 font-bold text-lg tracking-tight hover:opacity-80 transition-opacity"
               title={isSidebarOpen ? "Hide sidebar" : "Show sidebar"}
             >
               <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                 <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor" opacity="0.3"/>
                 <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                 <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
               </svg>
               <span>Notara</span>
             </button>
              <span className="hidden sm:inline shrink-0">My Workspace</span>
              <ChevronRight className="w-4 h-4 hidden sm:inline shrink-0" />
              <input 
                ref={headerTitleRef}
                className="bg-transparent text-gray-900 dark:text-white font-medium focus:outline-none focus:border-b border-gray-400 dark:border-gray-600 min-w-[100px] w-full max-w-md truncate"
                value={activeNote?.title || ""}
                onChange={(e) => activeNote && updateNote(activeNote.id, { title: e.target.value })}
                placeholder="Untitled Note"
              />
              {activeNote && (
                <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 ml-4">
                  <span className="flex items-center gap-1">
                    <Type className="w-3 h-3" />
                    {activeNote.content.split(/\s+/).filter(w => w.length > 0).length} words
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(activeNote.updatedAt).toLocaleDateString()}
                  </span>
                  {activeNote.tags && activeNote.tags.length > 0 && (
                    <div className="flex items-center gap-1">
                      {activeNote.tags.map((tag, i) => (
                        <span key={i} className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${getTagColor(i)}`}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
           </div>

           <div className="flex items-center gap-3 shrink-0">
              
              {/* Online/Offline Status */}
              <div className="flex items-center gap-2 text-xs">
                <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} title={isOnline ? 'Online' : 'Offline'} />
              </div>

              {/* Share Button */}
              {activeNote && (
                <button
                  onClick={() => setShowShareMenu(!showShareMenu)}
                  className="p-2 hover:bg-gray-200 dark:hover:bg-[#222] rounded-lg transition-colors text-gray-500 dark:text-gray-400 relative"
                  title="Share Note"
                >
                  <Share2 className="w-4 h-4" />
                  {showShareMenu && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-2 z-50">
                      <button onClick={shareNote} className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-sm">
                        Share via...
                      </button>
                      <button onClick={generateShareLink} className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-sm">
                        Copy Share Link
                      </button>
                    </div>
                  )}
                </button>
              )}
              
              {/* AI Chat Toggle */}
              <button
                onClick={() => setShowAIChat(!showAIChat)}
                className={`p-2 rounded-lg transition-all ${showAIChat ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' : 'hover:bg-gray-200 dark:hover:bg-[#222] text-gray-500 dark:text-gray-400'}`}
                title="AI Chat Assistant"
              >
                <Sparkles className="w-4 h-4" />
              </button>

              {/* Auto-tag Button */}
              {activeNote && (
                <button
                  onClick={generateAutoTags}
                  className="p-2 hover:bg-gray-200 dark:hover:bg-[#222] rounded-lg transition-colors text-gray-500 dark:text-gray-400"
                  title="Generate Tags"
                >
                  <Tag className="w-4 h-4" />
                </button>
              )}
              
              {/* Focus Mode Toggle */}
              <button
                onClick={() => setFocusMode(!focusMode)}
                className={`p-2 rounded-lg transition-all ${focusMode ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'hover:bg-gray-200 dark:hover:bg-[#222] text-gray-500 dark:text-gray-400'}`}
                title="Focus Mode (Esc to exit)"
              >
                <Eye className="w-4 h-4" />
              </button>

              {/* Command Palette Button */}
              <button
                onClick={() => setShowCommandPalette(true)}
                className="p-2 hover:bg-gray-200 dark:hover:bg-[#222] rounded-lg transition-colors text-gray-500 dark:text-gray-400"
                title="Command Palette (⌘K)"
              >
                <Search className="w-4 h-4" />
              </button>
              
              {/* View Mode Toggle */}
              <div className="flex bg-gray-200 dark:bg-[#1A1A1A] rounded-lg p-1 border border-gray-300 dark:border-[#333]">
                <button 
                    onClick={() => setViewMode('edit')} 
                    title="Editor Only"
                    className={`p-1.5 rounded transition-all ${viewMode === 'edit' ? 'bg-white dark:bg-[#333] text-emerald-500 dark:text-emerald-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                >
                    <FileText className="w-4 h-4" />
                </button>
                <button 
                    onClick={() => setViewMode('split')} 
                    title="Split View"
                    className={`p-1.5 rounded transition-all ${viewMode === 'split' ? 'bg-white dark:bg-[#333] text-emerald-500 dark:text-emerald-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                >
                    <Columns className="w-4 h-4" />
                </button>
                <button 
                    onClick={() => setViewMode('preview')} 
                    title="Preview Only"
                    className={`p-1.5 rounded transition-all ${viewMode === 'preview' ? 'bg-white dark:bg-[#333] text-emerald-500 dark:text-emerald-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                >
                    <Eye className="w-4 h-4" />
                </button>
              </div>

              <div className="h-4 w-px bg-gray-300 dark:bg-[#333] mx-1" />

              <div className="relative">
                <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                    className="text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white flex items-center gap-1"
                >
                    <Download className="w-4 h-4" />
                    <ChevronDown className="w-3 h-3" />
                </Button>
                {isExportMenuOpen && (
                     <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-[#222] border border-gray-200 dark:border-[#333] rounded-lg shadow-xl z-30 py-1">
                        <button onClick={() => handleExport('md')} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#333] hover:text-black dark:hover:text-white">
                            <FileCode className="w-4 h-4" /> Markdown (.md)
                        </button>
                        <button onClick={() => handleExport('txt')} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#333] hover:text-black dark:hover:text-white">
                            <File className="w-4 h-4" /> Plain Text (.txt)
                        </button>
                        <button onClick={() => activeNote && exportToHTML(activeNote)} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#333] hover:text-black dark:hover:text-white">
                            <FileCode className="w-4 h-4" /> HTML (.html)
                        </button>
                        <button onClick={() => activeNote && exportToDOCX(activeNote)} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#333] hover:text-black dark:hover:text-white">
                            <File className="w-4 h-4" /> Word (.doc)
                        </button>
                        <button onClick={() => handleExport('pdf')} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#333] hover:text-black dark:hover:text-white">
                            <Printer className="w-4 h-4" /> PDF (Print)
                        </button>
                     </div>
                )}
              </div>

              <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-[#1A1A1A] rounded-full border border-gray-200 dark:border-[#333]">
                <div className={`w-2 h-2 rounded-full transition-colors duration-300 ${getStatusColor()}`} title={connectionStatus} />
                <span className="text-xs text-gray-600 dark:text-gray-300 font-medium uppercase tracking-wider">{config.provider}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSettingsOpen(true)}>
                 <Settings className="w-4 h-4" />
              </Button>
              
              <div className="relative">
                <Button variant="ghost" size="sm" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                    <MoreHorizontal className="w-4 h-4" />
                </Button>
                {isMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-[#222] border border-gray-200 dark:border-[#333] rounded-lg shadow-xl z-30 py-1">
                        <button 
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#333] hover:text-black dark:hover:text-white"
                            onClick={() => {
                                headerTitleRef.current?.focus();
                                headerTitleRef.current?.select();
                                setIsMenuOpen(false);
                            }}
                        >
                            <Edit2 className="w-4 h-4" /> Rename Note
                        </button>
                        <button 
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-500 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-[#333] border-t border-gray-200 dark:border-[#333]"
                            onClick={() => {
                                if (activeNote) handleDeleteClick(activeNote.id);
                                setIsMenuOpen(false);
                            }}
                        >
                            <Trash2 className="w-4 h-4" /> Delete Note
                        </button>
                    </div>
                )}
              </div>
           </div>
        </header>
        )}

        {/* Toolbar */}
        {!focusMode && (
        <div className="border-b border-gray-200 dark:border-[#222] bg-gray-100 dark:bg-[#161616] shrink-0 print:hidden z-10">
            <div className="h-12 flex items-center px-6 gap-2">
                <button
                    onClick={() => setShowAITools(!showAITools)}
                    className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-200 dark:hover:bg-[#222] rounded-lg transition-colors"
                    title={showAITools ? "Hide AI Tools" : "Show AI Tools"}
                >
                    <span className="text-xs font-medium text-emerald-600 dark:text-emerald-500 uppercase tracking-wider">AI Tools</span>
                    <ChevronDown className={`w-4 h-4 text-emerald-600 dark:text-emerald-500 transition-transform ${showAITools ? 'rotate-180' : ''}`} />
                </button>
            </div>
            {showAITools && (
                <div className="px-6 pb-3 flex items-center gap-2 overflow-x-auto no-scrollbar flex-wrap">
                    <Button size="sm" variant="secondary" onClick={() => handleAIAction("Summarize this note in bullet points")}>
                        <Sparkles className="w-3 h-3 mr-2 text-emerald-500 dark:text-emerald-400" /> Summarize
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => handleAIAction("Fix grammar and improve tone")}>
                        <PenLine className="w-3 h-3 mr-2 text-blue-500 dark:text-blue-400" /> Improve
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => handleAIAction("Explain this in simple terms")}>
                        <Lightbulb className="w-3 h-3 mr-2 text-yellow-500 dark:text-yellow-400" /> Explain
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => handleAIAction("Continue writing from where this text ends")}>
                        <ArrowRight className="w-3 h-3 mr-2 text-indigo-500 dark:text-indigo-400" /> Continue
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => handleAIAction("Expand this text with more details")}>
                        <Maximize2 className="w-3 h-3 mr-2 text-green-500 dark:text-green-400" /> Expand
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => handleAIAction("Make this text shorter and more concise")}>
                        <Minimize2 className="w-3 h-3 mr-2 text-orange-500 dark:text-orange-400" /> Shorten
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => handleAIAction("Convert this to bullet points")}>
                        <List className="w-3 h-3 mr-2 text-pink-500 dark:text-pink-400" /> Bullets
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => handleAIAction("Extract all action items and tasks from this text")}>
                        <CheckCircle className="w-3 h-3 mr-2 text-teal-500 dark:text-teal-400" /> Actions
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => handleAIAction("Translate this to Spanish")}>
                        <Languages className="w-3 h-3 mr-2 text-red-500 dark:text-red-400" /> Translate
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => handleAIAction("Format this document professionally with proper structure, headings, and presentation. Maintain all content but improve formatting and organization")}>
                        <Wand2 className="w-3 h-3 mr-2 text-purple-500 dark:text-purple-400" /> Auto Format
                    </Button>
                    <Button 
                        onClick={() => setIsVoiceModeOpen(true)} 
                        size="sm"
                        variant="secondary"
                    >
                        <Mic className="w-3 h-3 mr-2 text-purple-500 dark:text-purple-400" /> Voice Mode
                    </Button>
                </div>
            )}
        </div>
        )}

        {/* Split Editor Area */}
        <div ref={containerRef} className="flex-1 flex overflow-hidden relative print:block print:overflow-visible print:h-auto min-w-0">
           {activeNote ? (
             <>
               {/* Left: Markdown Input */}
               <div 
                   style={{ 
                       width: viewMode === 'split' ? `${splitPos}%` : viewMode === 'edit' ? '100%' : '0%',
                       display: viewMode === 'preview' ? 'none' : 'flex'
                   }}
                   className="flex flex-col border-r border-gray-200 dark:border-[#222] bg-white dark:bg-[#111] transition-none print:hidden"
               >
                 <textarea 
                    ref={textareaRef}
                    className="flex-1 w-full bg-transparent text-gray-700 dark:text-gray-300 font-mono text-sm p-3 md:p-6 pb-96 resize-none focus:outline-none custom-scrollbar leading-relaxed break-words whitespace-pre-wrap"
                    placeholder="# Start typing your note here... (Type / for commands)"
                    value={editorContent}
                    onChange={(e) => handleContentChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onKeyUp={handleKeyUp}
                    onMouseUp={handleTextSelection}
                    spellCheck={false}
                 />
               </div>

               {/* Resizer Handle */}
               {viewMode === 'split' && (
                  <div 
                    className="w-2 -ml-1 h-full cursor-col-resize z-50 flex items-center justify-center group hover:bg-emerald-500/10 transition-colors print:hidden"
                    onMouseDown={startResizing}
                  >
                    <div className="w-0.5 h-8 bg-gray-300 dark:bg-[#333] group-hover:bg-emerald-500 rounded-full transition-colors" />
                  </div>
               )}

               {/* Right: Preview */}
               <div 
                   id="preview-pane"
                   style={{ 
                       width: viewMode === 'split' ? `${100 - splitPos}%` : viewMode === 'preview' ? '100%' : '0%',
                       display: viewMode === 'edit' ? 'none' : 'flex',
                       pointerEvents: isDragging ? 'none' : 'auto'
                   }}
                   className={`h-full overflow-y-auto custom-scrollbar ${theme === 'light' ? 'bg-dotted-pattern-light' : 'bg-dotted-pattern-dark'} ${viewMode === 'preview' ? 'justify-center' : ''}`}
               >
                    <div className={`flex-1 min-w-0 ${viewMode === 'preview' ? 'max-w-5xl mx-auto' : 'max-w-4xl'}`}>
                        <div className="p-8 pb-0">
                            <Breadcrumbs noteTitle={activeNote.title} tags={activeNote.tags} />
                        </div>
                        <div 
                            className={`prose ${theme === 'dark' ? 'dark:prose-invert' : ''} prose-lg max-w-full p-8 pt-0 overflow-hidden`}
                            dangerouslySetInnerHTML={{ __html: parseMarkdown(activeNote.content, notes) }}
                            onClick={(e) => {
                              const target = e.target as HTMLElement;
                              if (target.classList.contains('wiki-link')) {
                                e.preventDefault();
                                const noteId = target.dataset.noteId;
                                if (noteId) setActiveNoteId(noteId);
                              }
                            }}
                        />
                    </div>
                    {viewMode === 'split' && <TableOfContents content={activeNote.content} />}
               </div>
             </>
           ) : (
               <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500">
                   Select a note or create a new one
               </div>
           )}

           {/* Hidden File Inputs */}
           <input 
                type="file" 
                ref={imageFileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleImageUpload}
           />
           <input 
                type="file" 
                ref={mdFileInputRef}
                className="hidden"
                accept=".md,.markdown,text/markdown"
                onChange={handleImportMarkdown}
           />
           <input 
                type="file" 
                ref={obsidianVaultInputRef}
                className="hidden"
                accept=".md,.markdown,text/markdown"
                multiple
                webkitdirectory=""
                directory=""
                onChange={handleImportObsidianVault}
           />



           {/* Text Selection Toolbar */}
           {showSelectionToolbar && selectedText && (
              <div 
                className="fixed z-50 animate-in fade-in slide-in-from-top-2 duration-200"
                style={{ 
                  top: `${selectionToolbarPos.top}px`, 
                  left: `${selectionToolbarPos.left}px`,
                  transform: 'translateX(-50%)'
                }}
              >
                <div className="bg-gray-900 dark:bg-gray-800 text-white rounded-lg shadow-2xl p-2 flex items-center gap-1 border border-gray-700">
                  <button
                    onClick={() => handleSelectionAI("Summarize", false)}
                    className="px-2 py-1 text-xs hover:bg-gray-700 rounded flex items-center gap-1"
                    title="Summarize selection"
                  >
                    <Sparkles className="w-3 h-3" /> Sum
                  </button>
                  <button
                    onClick={() => handleSelectionAI("Improve grammar and tone", false)}
                    className="px-2 py-1 text-xs hover:bg-gray-700 rounded flex items-center gap-1"
                    title="Improve selection"
                  >
                    <PenLine className="w-3 h-3" /> Fix
                  </button>
                  <button
                    onClick={() => handleSelectionAI("Explain in simple terms", false)}
                    className="px-2 py-1 text-xs hover:bg-gray-700 rounded flex items-center gap-1"
                    title="Explain selection"
                  >
                    <Lightbulb className="w-3 h-3" /> Explain
                  </button>
                  <button
                    onClick={() => handleSelectionAI("Expand with more details", false)}
                    className="px-2 py-1 text-xs hover:bg-gray-700 rounded flex items-center gap-1"
                    title="Expand selection"
                  >
                    <Maximize2 className="w-3 h-3" /> Expand
                  </button>
                  <button
                    onClick={() => handleSelectionAI("Make shorter and concise", false)}
                    className="px-2 py-1 text-xs hover:bg-gray-700 rounded flex items-center gap-1"
                    title="Shorten selection"
                  >
                    <Minimize2 className="w-3 h-3" /> Short
                  </button>
                  <button
                    onClick={() => handleSelectionAI("Translate to Spanish", false)}
                    className="px-2 py-1 text-xs hover:bg-gray-700 rounded flex items-center gap-1"
                    title="Translate selection"
                  >
                    <Languages className="w-3 h-3" /> Trans
                  </button>
                  <button
                    onClick={() => handleSelectionAI("Extract all action items and tasks", false)}
                    className="px-2 py-1 text-xs hover:bg-gray-700 rounded flex items-center gap-1"
                    title="Extract action items"
                  >
                    <CheckCircle className="w-3 h-3" /> Actions
                  </button>
                  <div className="w-px h-4 bg-gray-600 mx-1"></div>
                  <button
                    onClick={() => handleSelectionAI("Rewrite this text", true)}
                    className="px-2 py-1 text-xs hover:bg-emerald-600 rounded flex items-center gap-1"
                    title="Replace with AI output"
                  >
                    <Wand2 className="w-3 h-3" /> Replace
                  </button>
                  <button
                    onClick={() => setShowSelectionToolbar(false)}
                    className="px-2 py-1 text-xs hover:bg-red-600 rounded"
                    title="Close"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
           )}
        </div>
      </div>

      <div className="print:hidden">
        <AISettingsModal />
        <VoiceModeModal 
            isOpen={isVoiceModeOpen} 
            onClose={() => setIsVoiceModeOpen(false)} 
            onInsert={(text) => insertTextAtCursor(text)}
        />
        {showEnhancedSearch && (
          <EnhancedSearch
            notes={notes.map(note => ({ ...note, isFavorite: favorites.has(note.id) }))}
            onSelectNote={setActiveNoteId}
            onClose={() => setShowEnhancedSearch(false)}
          />
        )}
        <SlashCommandMenu 
            isOpen={slashMenuOpen} 
            position={slashMenuPos} 
            commands={slashCommands}
            onSelect={executeSlashCommand}
            onClose={() => setSlashMenuOpen(false)}
        />

        {/* Command Palette */}
        {showCommandPalette && (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-32 px-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-2xl bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
              <div className="p-4 border-b border-gray-200/50 dark:border-gray-700/50">
                <div className="flex items-center gap-3">
                  <Search className="w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Type a command or search..."
                    value={commandQuery}
                    onChange={(e) => setCommandQuery(e.target.value)}
                    className="flex-1 bg-transparent text-lg focus:outline-none text-gray-900 dark:text-white placeholder-gray-400"
                    autoFocus
                  />
                  <kbd className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-600">ESC</kbd>
                </div>
              </div>
              <div className="max-h-96 overflow-y-auto p-2">
                <div className="space-y-1">
                  <button onClick={() => { addNote(); setShowCommandPalette(false); }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-left">
                    <Plus className="w-4 h-4 text-emerald-500" />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-white">New Note</div>
                      <div className="text-xs text-gray-500">Create a new note</div>
                    </div>
                  </button>
                  <button onClick={() => { createDailyNote(); setShowCommandPalette(false); }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-left">
                    <FileText className="w-4 h-4 text-blue-500" />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-white">Daily Note</div>
                      <div className="text-xs text-gray-500">Create today's note</div>
                    </div>
                  </button>
                  <button onClick={() => { setShowTemplates(true); setShowCommandPalette(false); }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-left">
                    <FileCode className="w-4 h-4 text-indigo-500" />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-white">Templates</div>
                      <div className="text-xs text-gray-500">Start from a template</div>
                    </div>
                  </button>
                  <button onClick={() => { setShowQuickCapture(true); setShowCommandPalette(false); }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-left">
                    <Zap className="w-4 h-4 text-yellow-500" />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-white">Quick Capture</div>
                      <div className="text-xs text-gray-500">Capture a quick thought</div>
                    </div>
                  </button>
                  <button onClick={() => { setFocusMode(!focusMode); setShowCommandPalette(false); }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-left">
                    <Eye className="w-4 h-4 text-purple-500" />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-white">Toggle Focus Mode</div>
                      <div className="text-xs text-gray-500">Distraction-free writing</div>
                    </div>
                  </button>
                  <button onClick={() => { setIsVoiceModeOpen(true); setShowCommandPalette(false); }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-left">
                    <Mic className="w-4 h-4 text-purple-500" />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-white">Voice Mode</div>
                      <div className="text-xs text-gray-500">Dictate your notes</div>
                    </div>
                  </button>
                  <button onClick={() => { setSettingsOpen(true); setShowCommandPalette(false); }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-left">
                    <Settings className="w-4 h-4 text-gray-500" />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-white">AI Settings</div>
                      <div className="text-xs text-gray-500">Configure AI providers</div>
                    </div>
                  </button>
                  <button onClick={() => { toggleTheme(); setShowCommandPalette(false); }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-left">
                    {theme === 'dark' ? <Sun className="w-4 h-4 text-yellow-500" /> : <Moon className="w-4 h-4 text-indigo-500" />}
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-white">Toggle Theme</div>
                      <div className="text-xs text-gray-500">Switch between light and dark</div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Templates Modal */}
        {showTemplates && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-3xl bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
              <div className="p-6 border-b border-gray-200/50 dark:border-gray-700/50">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Choose a Template</h2>
                  <button onClick={() => setShowTemplates(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="p-6 grid grid-cols-2 gap-4">
                <button onClick={() => createFromTemplate('meeting')} className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl hover:shadow-lg transition-all border border-blue-200 dark:border-blue-700 text-left">
                  <FileText className="w-8 h-8 text-blue-600 dark:text-blue-400 mb-3" />
                  <h3 className="font-bold text-gray-900 dark:text-white mb-1">Meeting Notes</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Agenda, discussion, action items</p>
                </button>
                <button onClick={() => createFromTemplate('journal')} className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl hover:shadow-lg transition-all border border-purple-200 dark:border-purple-700 text-left">
                  <FileText className="w-8 h-8 text-purple-600 dark:text-purple-400 mb-3" />
                  <h3 className="font-bold text-gray-900 dark:text-white mb-1">Daily Journal</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Gratitude, goals, reflection</p>
                </button>
                <button onClick={() => createFromTemplate('todo')} className="p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl hover:shadow-lg transition-all border border-green-200 dark:border-green-700 text-left">
                  <CheckSquare className="w-8 h-8 text-green-600 dark:text-green-400 mb-3" />
                  <h3 className="font-bold text-gray-900 dark:text-white mb-1">To-Do List</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Prioritized task management</p>
                </button>
                <button onClick={() => createFromTemplate('project')} className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-xl hover:shadow-lg transition-all border border-orange-200 dark:border-orange-700 text-left">
                  <Folder className="w-8 h-8 text-orange-600 dark:text-orange-400 mb-3" />
                  <h3 className="font-bold text-gray-900 dark:text-white mb-1">Project Plan</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Goals, timeline, milestones</p>
                </button>
                <button onClick={() => createFromTemplate('blog')} className="p-6 bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-900/20 dark:to-pink-800/20 rounded-xl hover:shadow-lg transition-all border border-pink-200 dark:border-pink-700 text-left">
                  <PenLine className="w-8 h-8 text-pink-600 dark:text-pink-400 mb-3" />
                  <h3 className="font-bold text-gray-900 dark:text-white mb-1">Blog Post</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Structured article format</p>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Quick Capture Widget */}
        {showQuickCapture && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-lg bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
              <div className="p-6 border-b border-gray-200/50 dark:border-gray-700/50">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Zap className="w-5 h-5 text-yellow-500" />
                    Quick Capture
                  </h2>
                  <button onClick={() => setShowQuickCapture(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="p-6">
                <textarea
                  value={quickCaptureText}
                  onChange={(e) => setQuickCaptureText(e.target.value)}
                  placeholder="Type your quick thought..."
                  className="w-full h-32 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                  autoFocus
                />
                <div className="flex gap-3 mt-4">
                  <Button onClick={() => setShowQuickCapture(false)} variant="ghost" className="flex-1">Cancel</Button>
                  <Button onClick={handleQuickCapture} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                    <Plus className="w-4 h-4 mr-2" /> Create Note
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* AI Chat Sidebar - Resizable */}
        {showAIChat && (
          <div 
            className="fixed md:fixed right-0 top-0 bottom-0 bg-gray-50 dark:bg-[#0F0F0F] border-l border-gray-200 dark:border-[#222] flex flex-col z-40 shadow-2xl w-full md:w-auto"
            style={{ 
              width: window.innerWidth >= 768 ? `${aiPanelWidth}px` : '100%',
              backgroundImage: theme === 'dark' 
                ? 'radial-gradient(#333 1px, transparent 1px)' 
                : 'radial-gradient(#E5E7EB 1px, transparent 1px)',
              backgroundSize: '20px 20px'
            }}
          >
            {/* Resize Handle */}
            <div
              className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-emerald-500 transition-colors group"
              onMouseDown={(e) => {
                e.preventDefault();
                setIsResizing(true);
                const startX = e.clientX;
                const startWidth = aiPanelWidth;
                
                const handleMouseMove = (e: MouseEvent) => {
                  const newWidth = startWidth - (e.clientX - startX);
                  setAiPanelWidth(Math.max(300, Math.min(800, newWidth)));
                };
                
                const handleMouseUp = () => {
                  setIsResizing(false);
                  document.removeEventListener('mousemove', handleMouseMove);
                  document.removeEventListener('mouseup', handleMouseUp);
                };
                
                document.addEventListener('mousemove', handleMouseMove);
                document.addEventListener('mouseup', handleMouseUp);
              }}
            >
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-12 bg-gray-300 dark:bg-gray-700 group-hover:bg-emerald-500 rounded-full transition-colors" />
            </div>

            {/* Header */}
            <div className="h-14 border-b border-gray-200 dark:border-[#222] flex items-center justify-between px-4 shrink-0">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-500" />
                AI Assistant
              </h3>
              <button 
                onClick={() => setShowAIChat(false)} 
                className="p-2 hover:bg-gray-100 dark:hover:bg-[#222] rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Chat Messages */}
            <div ref={chatMessagesRef} className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatMessages.length === 0 && (
                <div className="text-center text-gray-500 dark:text-gray-400 text-sm mt-12">
                  <Sparkles className="w-16 h-16 mx-auto mb-4 text-purple-300 dark:text-purple-700" />
                  <p className="text-lg font-medium mb-2">AI Assistant</p>
                  <p className="text-sm">Ask me anything about your notes!</p>
                </div>
              )}
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`${msg.role === 'user' ? 'max-w-[85%]' : 'min-w-[300px] max-w-[90%]'} ${
                    msg.role === 'user' 
                      ? 'bg-emerald-500 text-white p-3 rounded-2xl' 
                      : 'bg-gray-100 dark:bg-[#1A1A1A] text-gray-900 dark:text-white border border-gray-200 dark:border-[#222] rounded-2xl overflow-hidden'
                  }`}>
                    {msg.role === 'assistant' && (
                      <div className="px-3 pt-3 pb-2 border-b border-gray-200 dark:border-[#333]">
                        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider">
                          <Sparkles className="w-3 h-3" /> AI Analysis
                        </div>
                      </div>
                    )}
                    <div className={msg.role === 'assistant' ? 'p-3' : ''}>
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    </div>
                    {msg.role === 'assistant' && msg.content && !isChatGenerating && (
                      <div className="flex flex-wrap gap-2 justify-end px-3 pb-3 pt-2 border-t border-gray-200 dark:border-[#333]">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => {
                            setChatMessages(prev => prev.filter((_, idx) => idx !== i));
                          }}
                          className="h-7 text-xs"
                        >
                          Discard
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => {
                            navigator.clipboard.writeText(msg.content);
                          }} 
                          className="h-7 text-xs"
                        >
                          <Copy className="w-3 h-3 mr-1" /> Copy
                        </Button>
                        <Button 
                          size="sm" 
                          variant="secondary" 
                          onClick={() => {
                            importNote('AI Generated Note', msg.content);
                          }} 
                          className="h-7 text-xs"
                        >
                          <Plus className="w-3 h-3 mr-1" /> New Note
                        </Button>
                        <Button 
                          size="sm" 
                          className="bg-purple-600 hover:bg-purple-700 h-7 text-xs" 
                          onClick={() => {
                            if (activeNote && textareaRef.current) {
                              const start = textareaRef.current.selectionStart;
                              const end = textareaRef.current.selectionEnd;
                              const currentContent = activeNote.content;
                              const newContent = currentContent.substring(0, start) + '\n\n' + msg.content + '\n\n' + currentContent.substring(end);
                              updateNote(activeNote.id, { content: newContent });
                              
                              setTimeout(() => {
                                if (textareaRef.current) {
                                  const newPosition = start + msg.content.length + 4;
                                  textareaRef.current.focus();
                                  textareaRef.current.setSelectionRange(newPosition, newPosition);
                                }
                              }, 50);
                            }
                          }}
                        >
                          Insert
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isChatGenerating && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#222] p-3 rounded-2xl">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-gray-200 dark:border-[#222] shrink-0">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleChatSend()}
                  placeholder="Ask AI about your notes..."
                  className="flex-1 px-4 py-3 bg-gray-100 dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#222] rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                />
                <button
                  onClick={handleChatSend}
                  disabled={isChatGenerating || !chatInput.trim()}
                  className="px-4 py-3 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-xl transition-colors"
                >
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {isMenuOpen && (
          <div className="fixed inset-0 z-10 bg-transparent print:hidden" onClick={() => setIsMenuOpen(false)} />
      )}
      {isExportMenuOpen && (
          <div className="fixed inset-0 z-10 bg-transparent print:hidden" onClick={() => setIsExportMenuOpen(false)} />
      )}
    </div>
  );
};

// FIX: Added the 'App' wrapper component definition which was missing.
// This ensures that the context providers correctly wrap the application.
const App: React.FC = () => {
  return (
    <AIProvider>
      <NotesProvider>
        <FolderProvider>
          <EditorWorkspace />
        </FolderProvider>
      </NotesProvider>
    </AIProvider>
  );
};

export default App;
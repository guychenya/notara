import React, { useEffect, useRef, useState } from 'react';

export interface SlashCommand {
  id: string;
  label: string;
  icon: React.ElementType;
  description: string;
  action: () => void;
}

interface Props {
  isOpen: boolean;
  position: { top: number; left: number };
  commands: SlashCommand[];
  onSelect: (command: SlashCommand) => void;
  onClose: () => void;
}

export const SlashCommandMenu: React.FC<Props> = ({ isOpen, position, commands, onSelect, onClose }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedIndex(0);
      setSearchQuery('');
    }
  }, [isOpen]);

  // Filter commands based on search query - MUST be before useEffect that uses it
  const filteredCommands = searchQuery
    ? commands.filter(cmd => 
        cmd.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cmd.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : commands;

  // FIX: Added a click-outside handler to ensure the menu closes properly.
  // This prevents a bug where the menu state could get stuck as "open",
  // which would block the "Enter" key in the main editor.
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen && menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      // Handle arrow keys and Enter for menu navigation
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        e.stopPropagation();
        const filtered = filteredCommands;
        setSelectedIndex(prev => (prev + 1) % filtered.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        e.stopPropagation();
        const filtered = filteredCommands;
        setSelectedIndex(prev => (prev - 1 + filtered.length) % filtered.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        onSelect(filteredCommands[selectedIndex]);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      } else if (e.key === 'Backspace') {
        setSearchQuery(prev => prev.slice(0, -1));
        setSelectedIndex(0);
      } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
        // Type to search
        setSearchQuery(prev => prev + e.key);
        setSelectedIndex(0);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, onSelect, onClose, searchQuery, filteredCommands]);

  useEffect(() => {
    if (scrollContainerRef.current) {
      const buttons = scrollContainerRef.current.querySelectorAll('button');
      const selectedButton = buttons[selectedIndex];
      if (selectedButton) {
        selectedButton.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  // Calculate position to keep in viewport
  const MENU_WIDTH = 300;
  const MENU_HEIGHT = 320; 
  const PADDING = 16;
  
  let top = position.top;
  let left = position.left;
  let origin = 'top';

  // Horizontal clamping
  if (left + MENU_WIDTH > window.innerWidth - PADDING) {
    left = window.innerWidth - MENU_WIDTH - PADDING;
  }
  if (left < PADDING) left = PADDING;

  // Vertical flipping
  if (top + MENU_HEIGHT > window.innerHeight - PADDING) {
    top = position.top - MENU_HEIGHT - 40; 
    origin = 'bottom';
  }

  return (
    <div 
      ref={menuRef}
      className="fixed z-[99999] w-[300px] bg-white dark:bg-[#1C1C1C] border border-gray-200 dark:border-[#333] rounded-xl shadow-2xl animate-in fade-in zoom-in-95 duration-100"
      style={{
        top: `${top}px`,
        left: `${left}px`,
        transformOrigin: origin === 'bottom' ? 'bottom left' : 'top left'
      }}
    >
      <div className="px-3 py-2 border-b border-gray-200 dark:border-[#2A2A2A] bg-gray-50 dark:bg-[#161616] text-xs font-semibold text-gray-500 dark:text-gray-500 uppercase tracking-wider flex justify-between items-center">
        <span>Insert Block {searchQuery && `(${searchQuery})`}</span>
        <span className="text-[10px] bg-gray-200 dark:bg-[#222] px-1.5 rounded border border-gray-300 dark:border-[#333]">Type to search</span>
      </div>
      <div ref={scrollContainerRef} className="overflow-y-auto p-1 max-h-[280px]">
        {filteredCommands.map((cmd, index) => (
          <button
            key={cmd.id}
            onClick={() => onSelect(cmd)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
              index === selectedIndex 
                ? 'bg-emerald-50 dark:bg-emerald-600/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-600/20' 
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2A2A2A] border border-transparent'
            }`}
          >
            <div className={`p-1.5 rounded-md shrink-0 ${index === selectedIndex ? 'bg-emerald-600 text-white' : 'bg-gray-200 dark:bg-[#222] text-gray-500 dark:text-gray-400'}`}>
                <cmd.icon className="w-4 h-4" />
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="text-sm font-medium truncate">{cmd.label}</div>
              <div className={`text-xs truncate ${index === selectedIndex ? 'text-emerald-600/70 dark:text-emerald-400/70' : 'text-gray-500 dark:text-gray-500'}`}>
                {cmd.description}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
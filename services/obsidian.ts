import { Note } from '../types';

// Convert Obsidian-style wikilinks to Notara format
export const convertObsidianToNotara = (content: string): string => {
  // Obsidian uses [[Note Name]] or [[Note Name|Display Text]]
  return content.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (match, noteName, displayText) => {
    return `[[${displayText || noteName}]]`;
  });
};

// Convert Notara format back to Obsidian
export const convertNotaraToObsidian = (content: string): string => {
  // Keep the same format as it's compatible
  return content;
};

// Parse Obsidian frontmatter
export const parseObsidianFrontmatter = (content: string): { frontmatter: Record<string, any>, content: string } => {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);
  
  if (!match) {
    return { frontmatter: {}, content };
  }
  
  const frontmatterText = match[1];
  const mainContent = match[2];
  const frontmatter: Record<string, any> = {};
  
  frontmatterText.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split(':');
    if (key && valueParts.length > 0) {
      const value = valueParts.join(':').trim();
      frontmatter[key.trim()] = value;
    }
  });
  
  return { frontmatter, content: mainContent };
};

// Import Obsidian vault (multiple markdown files)
export const importObsidianVault = async (files: FileList): Promise<Note[]> => {
  const notes: Note[] = [];
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (file.name.endsWith('.md')) {
      const content = await file.text();
      const { frontmatter, content: mainContent } = parseObsidianFrontmatter(content);
      
      const note: Note = {
        id: crypto.randomUUID(),
        title: frontmatter.title || file.name.replace('.md', ''),
        content: convertObsidianToNotara(mainContent),
        updatedAt: Date.now(),
        tags: frontmatter.tags ? (Array.isArray(frontmatter.tags) ? frontmatter.tags : [frontmatter.tags]) : undefined,
      };
      
      notes.push(note);
    }
  }
  
  return notes;
};

// Export notes as Obsidian vault (zip would require additional library)
export const exportAsObsidianVault = (notes: Note[]) => {
  notes.forEach(note => {
    const frontmatter = [
      '---',
      `title: ${note.title}`,
      note.tags && note.tags.length > 0 ? `tags: [${note.tags.join(', ')}]` : '',
      `created: ${new Date(note.updatedAt).toISOString()}`,
      '---',
      ''
    ].filter(Boolean).join('\n');
    
    const content = frontmatter + convertNotaraToObsidian(note.content);
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${note.title || 'untitled'}.md`;
    a.click();
    URL.revokeObjectURL(url);
  });
};

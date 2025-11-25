import hljs from 'highlight.js';

let headingIndex = 0;

export const resetHeadingIndex = () => {
  headingIndex = 0;
};

export const parseMarkdown = (text: string, allNotes?: Array<{ id: string; title: string }>): string => {
  if (!text) return '';
  
  resetHeadingIndex();

  let html = text;
  const references: Record<string, string> = {};

  // Process wiki-style links [[Note Title]] BEFORE sanitization
  if (allNotes) {
    html = html.replace(/\[\[([^\]]+)\]\]/g, (match, noteTitle) => {
      const note = allNotes.find(n => n.title.toLowerCase() === noteTitle.toLowerCase());
      if (note) {
        return `__WIKILINK__${note.id}__${noteTitle}__ENDWIKI__`;
      }
      return `__WIKIMISSING__${noteTitle}__ENDMISSING__`;
    });
  }

  // 1. Extract Reference Definitions: [id]: url
  html = html.replace(/^\[([^\]]+)\]:\s*(\S+).*$/gm, (match, id, url) => {
      references[id.toLowerCase()] = url;
      return '';
  });

  // 2. Protect Videos/Iframes and their wrappers
  const protectionRegex = /(<div class="aspect-video[^"]*">[\s\S]*?(?:<iframe|<video)[\s\S]*?(?:<\/iframe>|<\/video>)[\s\S]*?<\/div>|<iframe[\s\S]*?<\/iframe>|<video[\s\S]*?<\/video>|<details[\s\S]*?<\/details>)/gim;
  
  const replacements: { id: string, val: string }[] = [];
  
  html = html.replace(protectionRegex, (match) => {
      const id = `__MEDIA_${Math.random().toString(36).substr(2, 9)}__`;
      replacements.push({ id, val: match });
      return id;
  });

  // Standard Sanitize
  html = html
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Restore Protected Media
  replacements.forEach(rep => {
      html = html.replace(rep.id, rep.val);
  });

  // Headers with IDs for TOC
  html = html.replace(/^### (.*$)/gim, (match, text) => {
    const id = `heading-${headingIndex++}`;
    return `<h3 id="${id}" class="text-xl font-bold mt-4 mb-2 text-emerald-400">${text}</h3>`;
  });
  html = html.replace(/^## (.*$)/gim, (match, text) => {
    const id = `heading-${headingIndex++}`;
    return `<h2 id="${id}" class="text-2xl font-bold mt-6 mb-3 text-emerald-500">${text}</h2>`;
  });
  html = html.replace(/^# (.*$)/gim, (match, text) => {
    const id = `heading-${headingIndex++}`;
    return `<h1 id="${id}" class="text-3xl font-bold mt-8 mb-4 text-emerald-600">${text}</h1>`;
  });

  // Bold & Italic
  html = html.replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>');
  html = html.replace(/\*(.*)\*/gim, '<em>$1</em>');

  // Images: ![alt](url) - Inline Style
  html = html.replace(/!\[([^\]]*)\]\(([^)]*)\)/gim, '<img src="$2" alt="$1" class="rounded-lg max-w-full my-4 border border-[#333]" />');

  // Images: ![alt][id] - Reference Style
  html = html.replace(/!\[([^\]]*)\]\[([^\]]*)\]/gim, (match, alt, id) => {
      const url = references[id.toLowerCase()];
      if (url) {
          return `<img src="${url}" alt="${alt}" class="rounded-lg max-w-full my-4 border border-[#333]" />`;
      }
      return match;
  });

  // Links: [text](url) - Inline Style
  html = html.replace(/\[(.*?)\]\((.*?)\)/gim, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-emerald-400 hover:underline">$1</a>');

  // Links: [text][id] - Reference Style
  html = html.replace(/\[([^\]]+)\]\[([^\]]*)\]/gim, (match, text, id) => {
       const url = references[id.toLowerCase()];
       if (url) {
           return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-emerald-400 hover:underline">${text}</a>`;
       }
       return match;
  });

  // Blockquotes
  html = html.replace(/^\> (.*$)/gim, '<blockquote class="border-l-4 border-emerald-500 pl-4 py-1 my-4 text-gray-400 italic bg-[#1A1A1A] rounded-r">$1</blockquote>');

  // Horizontal Rules
  html = html.replace(/^---$/gim, '<hr class="border-[#333] my-6" />');

  // Lists (Bullet)
  html = html.replace(/^\- (.*$)/gim, '<li class="ml-4 list-disc marker:text-emerald-500">$1</li>');
  
  // Lists (Checkboxes)
  html = html.replace(/^\[ \] (.*$)/gim, '<li class="flex items-center gap-2"><input type="checkbox" disabled class="mr-2 accent-emerald-500 h-4 w-4 rounded border-gray-600 bg-[#222]"> <span class="text-gray-300">$1</span></li>');
  html = html.replace(/^\[x\] (.*$)/gim, '<li class="flex items-center gap-2"><input type="checkbox" checked disabled class="mr-2 accent-emerald-500 h-4 w-4 rounded border-gray-600 bg-[#222]"> <span class="text-gray-500 line-through">$1</span></li>');

  // Wrap consecutive lis in ul
  html = html.replace(/((<li.*>.*<\/li>\n?)+)/gim, '<ul class="my-4 space-y-1">$1</ul>');

  // Code Blocks with syntax highlighting
  html = html.replace(/```(\w+)?\n([\s\S]*?)```/gim, (match, lang, code) => {
    const language = lang || 'plaintext';
    let highlighted = code;
    
    try {
      if (lang && hljs.getLanguage(lang)) {
        highlighted = hljs.highlight(code, { language: lang }).value;
      } else {
        highlighted = hljs.highlightAuto(code).value;
      }
    } catch (e) {
      console.error('Highlight error:', e);
    }

    const escapedCode = code.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    
    return `
      <div class="code-block-wrapper my-4">
        <div class="code-block-header flex items-center justify-between bg-[#0d0d0d] px-4 py-2 border-b border-[#333] rounded-t-lg">
          <span class="code-block-lang text-xs text-gray-400 font-mono">${language}</span>
          <button class="code-block-copy text-xs text-gray-400 hover:text-emerald-400 transition-colors flex items-center gap-1" onclick="navigator.clipboard.writeText(this.dataset.code).then(() => { this.textContent = 'Copied!'; setTimeout(() => this.innerHTML = '<svg class=\\'w-3 h-3\\' fill=\\'none\\' stroke=\\'currentColor\\' viewBox=\\'0 0 24 24\\'><path stroke-linecap=\\'round\\' stroke-linejoin=\\'round\\' stroke-width=\\'2\\' d=\\'M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z\\'></path></svg> Copy', 2000); })" data-code="${escapedCode}">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
            </svg>
            Copy
          </button>
        </div>
        <pre class="bg-[#1A1A1A] p-4 rounded-b-lg border border-[#333] border-t-0 overflow-x-auto"><code class="hljs language-${language} text-sm">${highlighted}</code></pre>
      </div>
    `;
  });

  // Inline Code
  html = html.replace(/`([^`]+)`/gim, '<code class="bg-[#222] px-1.5 py-0.5 rounded text-emerald-300 font-mono text-sm">$1</code>');

  // Tables
  const tableRegex = /\|(.+)\|\n\|[-| ]+\|\n((?:\|.*\|\n?)+)/g;
  html = html.replace(tableRegex, (match, headerRow, bodyRows) => {
      const headers = headerRow.split('|').filter((c: string) => c.trim()).map((c: string) => `<th class="px-4 py-2 border border-[#333] bg-[#1A1A1A] text-left font-semibold text-emerald-500">${c.trim()}</th>`).join('');
      const rows = bodyRows.trim().split('\n').map((row: string) => {
          const cells = row.split('|').filter((c: string) => c.trim()).map((c: string) => `<td class="px-4 py-2 border border-[#333] text-gray-300">${c.trim()}</td>`).join('');
          return `<tr>${cells}</tr>`;
      }).join('');
      
      return `<div class="overflow-x-auto my-6 rounded-lg border border-[#333]"><table class="w-full text-sm border-collapse"><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table></div>`;
  });

  // Restore wiki links
  html = html.replace(/__WIKILINK__([^_]+)__([^_]+)__ENDWIKI__/g, '<a href="#" class="wiki-link text-emerald-400 hover:text-emerald-300 underline decoration-dotted" data-note-id="$1">$2</a>');
  html = html.replace(/__WIKIMISSING__([^_]+)__ENDMISSING__/g, '<span class="wiki-link-missing text-gray-500 italic">$1</span>');

  // Paragraphs
  const lines = html.split('\n');
  const processedLines = lines.map(line => {
      const trimmed = line.trim();
      if (!trimmed) return '';
      if (trimmed.match(/^<(div|ul|li|h|p|blockquote|pre|table|hr|details|summary)/i)) return trimmed; 
      return `<p class="mb-4">${trimmed}</p>`;
  });
  
  html = processedLines.join('\n');

  return html;
};

import type { BlogSection } from '../data/blog-posts';

/**
 * Parse a markdown string into BlogSection[] for rendering.
 * Supports: ## h2, ### h3, paragraphs, **bold**, [link](url),
 * - unordered lists, 1. ordered lists, ![alt](url), | tables |
 */
export function parseMarkdownToSections(markdown: string): BlogSection[] {
  const lines = markdown.split('\n');
  const sections: BlogSection[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Skip empty lines
    if (!trimmed) { i++; continue; }

    // Heading ### (check before ##)
    if (trimmed.startsWith('### ')) {
      sections.push({ type: 'heading', text: trimmed.slice(4).trim(), level: 3 });
      i++; continue;
    }

    // Heading ##
    if (trimmed.startsWith('## ')) {
      sections.push({ type: 'heading', text: trimmed.slice(3).trim(), level: 2 });
      i++; continue;
    }

    // Image: ![alt](url)
    const imgMatch = trimmed.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (imgMatch) {
      let caption = '';
      // Check next line for italic caption *caption*
      if (i + 1 < lines.length) {
        const nextTrimmed = lines[i + 1].trim();
        if (nextTrimmed.startsWith('*') && nextTrimmed.endsWith('*') && nextTrimmed.length > 2) {
          caption = nextTrimmed.slice(1, -1);
          i++;
        }
      }
      sections.push({ type: 'image', url: imgMatch[2], alt: imgMatch[1], caption });
      i++; continue;
    }

    // Unordered list (- or *)
    if (trimmed.match(/^[-*]\s/)) {
      const items: string[] = [];
      while (i < lines.length && lines[i].trim().match(/^[-*]\s/)) {
        items.push(lines[i].trim().replace(/^[-*]\s/, ''));
        i++;
      }
      sections.push({ type: 'list', items, ordered: false });
      continue;
    }

    // Ordered list (1. 2. etc)
    if (trimmed.match(/^\d+\.\s/)) {
      const items: string[] = [];
      while (i < lines.length && lines[i].trim().match(/^\d+\.\s/)) {
        items.push(lines[i].trim().replace(/^\d+\.\s/, ''));
        i++;
      }
      sections.push({ type: 'list', items, ordered: true });
      continue;
    }

    // Table (lines starting/containing |)
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
        const row = lines[i].trim();
        // Skip separator row (| --- | --- |)
        if (row.match(/^\|[\s\-:]+(\|[\s\-:]+)+\|$/)) { i++; continue; }
        const cells = row.slice(1, -1).split('|').map(c => c.trim());
        if (cells.length > 0 && cells.some(c => c.length > 0)) rows.push(cells);
        i++;
      }
      if (rows.length > 0) sections.push({ type: 'table', rows });
      continue;
    }

    // Paragraph — collect consecutive non-special lines
    let text = trimmed;
    i++;
    while (i < lines.length) {
      const next = lines[i].trim();
      if (!next) break; // empty line = paragraph break
      if (next.startsWith('## ') || next.startsWith('### ')) break;
      if (next.match(/^[-*]\s/)) break;
      if (next.match(/^\d+\.\s/)) break;
      if (next.match(/^!\[/)) break;
      if (next.startsWith('|') && next.endsWith('|')) break;
      text += ' ' + next;
      i++;
    }
    sections.push({ type: 'paragraph', text });
  }

  return sections;
}

/**
 * Convert BlogSection[] back to markdown string (for editing).
 */
export function sectionsToMarkdown(sections: BlogSection[]): string {
  return sections.map(section => {
    switch (section.type) {
      case 'heading':
        return (section.level === 3 ? '### ' : '## ') + section.text;
      case 'paragraph':
        return section.text;
      case 'image': {
        let md = `![${section.alt}](${section.url})`;
        if (section.caption) md += `\n*${section.caption}*`;
        return md;
      }
      case 'list':
        return section.items.map((item, idx) =>
          section.ordered ? `${idx + 1}. ${item}` : `- ${item}`
        ).join('\n');
      case 'table': {
        if (!section.rows || section.rows.length === 0) return '';
        const [header, ...rows] = section.rows;
        let table = '| ' + header.join(' | ') + ' |\n';
        table += '| ' + header.map(() => '---').join(' | ') + ' |\n';
        rows.forEach(row => {
          table += '| ' + row.join(' | ') + ' |\n';
        });
        return table.trimEnd();
      }
      default:
        return '';
    }
  }).join('\n\n');
}

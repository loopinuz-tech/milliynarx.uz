import React from 'react';

/**
 * Modern Markdown & KaTeX Table Renderer
 * Parses:
 * - Markdown tables (| Col 1 | Col 2 |) with alignments into styled HTML tables
 * - LaTeX / Math ($...$ and $$...$$) using KaTeX
 * - Headings (###, ##, #)
 * - Bold (**bold**), Italic (*italic*), Strikethrough (~~del~~)
 * - Lists (- item, 1. item)
 * - Code blocks and inline code
 */
export const MarkdownRenderer = ({ content }) => {
  if (!content) return null;

  // Render LaTeX math using window.katex if available
  const renderMath = (tex, isBlock = false) => {
    if (typeof window !== 'undefined' && window.katex) {
      try {
        const html = window.katex.renderToString(tex, {
          throwOnError: false,
          displayMode: isBlock
        });
        return (
          <span 
            className={isBlock ? "block my-2 text-center" : "inline-block px-1"} 
            dangerouslySetInnerHTML={{ __html: html }} 
          />
        );
      } catch (err) {
        // fallback
      }
    }
    return (
      <span className={`font-mono italic text-orange-800 ${isBlock ? "block text-center my-2" : "inline px-1"}`}>
        {tex}
      </span>
    );
  };

  // Helper to render inline elements (bold, italic, code, math, links)
  const renderInline = (text) => {
    if (!text) return '';

    // Tokenize text for inline elements
    // Supports: $$math$$, $math$, **bold**, *italic*, `code`
    const regex = /(\$\$[\s\S]*?\$\$|\$[^\$]+?\$|\*\*[\s\S]+?\*\*|\*[^\*]+?\*|`[^`]+?`)/g;
    const parts = text.split(regex);

    return parts.map((part, index) => {
      if (!part) return null;

      // Block Math: $$...$$
      if (part.startsWith('$$') && part.endsWith('$$')) {
        const math = part.slice(2, -2).trim();
        return <React.Fragment key={index}>{renderMath(math, true)}</React.Fragment>;
      }

      // Inline Math: $...$
      if (part.startsWith('$') && part.endsWith('$')) {
        const math = part.slice(1, -1).trim();
        return <React.Fragment key={index}>{renderMath(math, false)}</React.Fragment>;
      }

      // Bold: **...**
      if (part.startsWith('**') && part.endsWith('**')) {
        const inner = part.slice(2, -2);
        return (
          <strong key={index} className="font-bold text-slate-900">
            {renderInline(inner)}
          </strong>
        );
      }

      // Italic: *...*
      if (part.startsWith('*') && part.endsWith('*')) {
        const inner = part.slice(1, -1);
        return (
          <em key={index} className="italic text-slate-700">
            {renderInline(inner)}
          </em>
        );
      }

      // Inline Code: `...`
      if (part.startsWith('`') && part.endsWith('`')) {
        const code = part.slice(1, -1);
        return (
          <code 
            key={index} 
            className="px-1.5 py-0.5 mx-0.5 bg-slate-100 text-orange-700 font-mono text-[11px] rounded border border-slate-200"
          >
            {code}
          </code>
        );
      }

      return part;
    });
  };

  // Parse lines into blocks (paragraphs, headings, tables, lists, code blocks)
  const lines = content.split('\n');
  const blocks = [];
  let currentTable = null;
  let inCodeBlock = false;
  let codeBlockLang = '';
  let codeBlockLines = [];

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    // Code block toggle (```)
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        blocks.push({
          type: 'code',
          lang: codeBlockLang,
          code: codeBlockLines.join('\n')
        });
        inCodeBlock = false;
        codeBlockLang = '';
        codeBlockLines = [];
      } else {
        if (currentTable) {
          blocks.push(currentTable);
          currentTable = null;
        }
        inCodeBlock = true;
        codeBlockLang = line.slice(3).trim();
        codeBlockLines = [];
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockLines.push(rawLine);
      continue;
    }

    // Markdown Table Detection
    // A table row starts with | and ends with | (or contains pipes)
    const isPipeLine = line.startsWith('|') && (line.endsWith('|') || line.includes('|'));
    const isDelimiterRow = isPipeLine && line.split('|').filter(Boolean).every(cell => /^:?-+:?$/.test(cell.trim()));

    if (isPipeLine) {
      const cells = line
        .split('|')
        .map(c => c.trim());
      
      // Clean up empty leading and trailing cells from "| a | b |"
      if (line.startsWith('|')) cells.shift();
      if (line.endsWith('|')) cells.pop();

      if (!currentTable) {
        currentTable = {
          type: 'table',
          headers: cells,
          alignments: [],
          rows: []
        };
      } else if (isDelimiterRow) {
        currentTable.alignments = cells.map(cell => {
          const trimmed = cell.trim();
          if (trimmed.startsWith(':') && trimmed.endsWith(':')) return 'center';
          if (trimmed.endsWith(':')) return 'right';
          return 'left';
        });
      } else {
        currentTable.rows.push(cells);
      }
      continue;
    } else {
      if (currentTable) {
        blocks.push(currentTable);
        currentTable = null;
      }
    }

    // Empty line
    if (!line) {
      blocks.push({ type: 'empty' });
      continue;
    }

    // Headings
    if (line.startsWith('### ')) {
      blocks.push({ type: 'h3', text: line.slice(4) });
      continue;
    }
    if (line.startsWith('## ')) {
      blocks.push({ type: 'h2', text: line.slice(3) });
      continue;
    }
    if (line.startsWith('# ')) {
      blocks.push({ type: 'h1', text: line.slice(2) });
      continue;
    }

    // Horizontal Rule
    if (line === '---' || line === '***' || line === '___') {
      blocks.push({ type: 'hr' });
      continue;
    }

    // List item (unordered)
    if (line.startsWith('- ') || line.startsWith('* ') || line.startsWith('• ')) {
      blocks.push({ type: 'ul_item', text: line.replace(/^[-*•]\s+/, '') });
      continue;
    }

    // List item (ordered)
    const orderedMatch = line.match(/^(\d+)\.\s+(.*)/);
    if (orderedMatch) {
      blocks.push({ type: 'ol_item', num: orderedMatch[1], text: orderedMatch[2] });
      continue;
    }

    // Blockquote
    if (line.startsWith('> ')) {
      blocks.push({ type: 'quote', text: line.slice(2) });
      continue;
    }

    // Normal paragraph line
    blocks.push({ type: 'p', text: line });
  }

  if (currentTable) {
    blocks.push(currentTable);
  }

  // Render processed blocks
  return (
    <div className="space-y-1 text-slate-800 text-xs sm:text-sm leading-relaxed">
      {blocks.map((block, idx) => {
        switch (block.type) {
          case 'table':
            return (
              <div key={idx} className="my-3 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-2xs">
                <table className="w-full border-collapse text-left text-xs min-w-[480px]">
                  <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    <tr>
                      {block.headers.map((h, hIdx) => {
                        const align = block.alignments[hIdx] || 'left';
                        const alignClass = align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';
                        return (
                          <th key={hIdx} className={`py-2.5 px-3.5 whitespace-nowrap ${alignClass}`}>
                            {renderInline(h)}
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {block.rows.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-orange-50/40 transition-colors">
                        {row.map((cell, cIdx) => {
                          const align = block.alignments[cIdx] || 'left';
                          const alignClass = align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';
                          return (
                            <td key={cIdx} className={`py-2.5 px-3.5 align-middle ${alignClass}`}>
                              {renderInline(cell)}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );

          case 'h1':
            return (
              <h1 key={idx} className="text-base sm:text-lg font-extrabold text-slate-900 mt-3 mb-1.5 tracking-tight flex items-center gap-1.5">
                {renderInline(block.text)}
              </h1>
            );

          case 'h2':
            return (
              <h2 key={idx} className="text-sm sm:text-base font-bold text-slate-900 mt-2.5 mb-1 tracking-tight flex items-center gap-1.5">
                {renderInline(block.text)}
              </h2>
            );

          case 'h3':
            return (
              <h3 key={idx} className="text-xs sm:text-sm font-bold text-slate-900 mt-2 mb-1 tracking-tight flex items-center gap-1.5">
                {renderInline(block.text)}
              </h3>
            );

          case 'ul_item':
            return (
              <div key={idx} className="flex items-start gap-2 pl-2 py-0.5 text-slate-700">
                <span className="text-orange-500 font-bold shrink-0 mt-0.5">•</span>
                <span className="flex-1">{renderInline(block.text)}</span>
              </div>
            );

          case 'ol_item':
            return (
              <div key={idx} className="flex items-start gap-2 pl-2 py-0.5 text-slate-700">
                <span className="text-orange-600 font-bold text-[11px] shrink-0 mt-0.5 font-numeric">{block.num}.</span>
                <span className="flex-1">{renderInline(block.text)}</span>
              </div>
            );

          case 'quote':
            return (
              <blockquote key={idx} className="pl-3 py-1 my-1 border-l-2 border-orange-500 bg-orange-50/40 text-slate-700 italic rounded-r-lg text-xs">
                {renderInline(block.text)}
              </blockquote>
            );

          case 'code':
            return (
              <div key={idx} className="my-2 rounded-xl bg-slate-900 text-slate-100 p-3 overflow-x-auto text-xs font-mono border border-slate-800">
                {block.lang && (
                  <div className="text-[10px] text-slate-400 uppercase mb-1 font-bold">{block.lang}</div>
                )}
                <pre>{block.code}</pre>
              </div>
            );

          case 'hr':
            return <hr key={idx} className="my-3 border-slate-200" />;

          case 'empty':
            return <div key={idx} className="h-1.5" />;

          case 'p':
          default:
            return (
              <div key={idx} className="py-0.5">
                {renderInline(block.text)}
              </div>
            );
        }
      })}
    </div>
  );
};

export default MarkdownRenderer;

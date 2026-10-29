export type GuideBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'list'; items: string[] }
  | { type: 'table'; headings: string[]; rows: string[][] };

/** The authored guide uses only paragraphs, bullet lists and simple pipe tables. */
export function guideBlocks(body: string): GuideBlock[] {
  return body.split(/\n\s*\n/).filter(Boolean).map((part) => {
    const lines = part.trim().split('\n');
    if (lines[0].startsWith('|') && lines[1]?.match(/^\|[\s:|-]+\|$/)) {
      const cells = (line: string) => line.slice(1, -1).split('|').map((cell) => cell.trim());
      return { type: 'table', headings: cells(lines[0]), rows: lines.slice(2).map(cells) };
    }
    if (lines.every((line) => line.startsWith('- '))) {
      return { type: 'list', items: lines.map((line) => line.slice(2)) };
    }
    return { type: 'paragraph', text: part.trim() };
  });
}

export function guideMarkdown(introduction: string, sections: { title: string; body: string }[]): string {
  return introduction + '\n\n' + sections.map((section) => '## ' + section.title + '\n\n' + section.body).join('\n\n') + '\n';
}

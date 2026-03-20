const WORDS_PER_MINUTE = 200;

/**
 * Strip markdown syntax to get plain text for word counting.
 */
function stripMarkdown(content: string): string {
  return (
    content
      // Remove fenced code blocks (``` or ~~~)
      .replace(/^(`{3,}|~{3,})[\s\S]*?^\1/gm, '')
      // Remove inline code
      .replace(/`[^`]*`/g, '')
      // Remove images ![alt](url)
      .replace(/!\[.*?\]\(.*?\)/g, '')
      // Remove links but keep text [text](url) -> text
      .replace(/\[([^\]]*)\]\(.*?\)/g, '$1')
      // Remove HTML tags
      .replace(/<[^>]+>/g, '')
      // Remove heading markers
      .replace(/^#{1,6}\s+/gm, '')
      // Remove bold/italic markers
      .replace(/(\*{1,3}|_{1,3})(.*?)\1/g, '$2')
      // Remove strikethrough
      .replace(/~~(.*?)~~/g, '$1')
      // Remove blockquotes
      .replace(/^>\s+/gm, '')
      // Remove horizontal rules
      .replace(/^[-*_]{3,}\s*$/gm, '')
      // Remove reference-style links/images
      .replace(/^\[.*?\]:.*$/gm, '')
      // Collapse whitespace
      .replace(/\s+/g, ' ')
      .trim()
  );
}

/**
 * Calculate reading time in minutes for a given markdown/text string.
 * Returns at least 1 minute.
 */
export function getReadingTime(content: string): number {
  const plainText = stripMarkdown(content);
  const words = plainText.split(/\s+/).filter((w) => w.length > 0);
  return Math.max(1, Math.ceil(words.length / WORDS_PER_MINUTE));
}

/**
 * Format reading time as a human-readable string.
 */
export function formatReadingTime(minutes: number): string {
  return `${minutes} min read`;
}

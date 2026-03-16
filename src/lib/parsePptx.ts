import JSZip from 'jszip';

/**
 * Extracts all text content from a .pptx file (ArrayBuffer).
 * A .pptx file is a ZIP containing XML slide files under ppt/slides/slide*.xml.
 * Each <a:t> element inside those XML files holds the visible text.
 */
export async function parsePptx(buffer: ArrayBuffer): Promise<string> {
  const zip = await JSZip.loadAsync(buffer);

  // Collect all slide XML files, sorted by slide number
  const slideFiles = Object.keys(zip.files)
    .filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))
    .sort((a, b) => {
      const numA = parseInt(a.match(/\d+/)?.[0] ?? '0', 10);
      const numB = parseInt(b.match(/\d+/)?.[0] ?? '0', 10);
      return numA - numB;
    });

  if (slideFiles.length === 0) {
    throw new Error('No slides found in this PowerPoint file. Make sure it is a valid .pptx file.');
  }

  const slideTexts: string[] = [];

  for (let i = 0; i < slideFiles.length; i++) {
    const xmlContent = await zip.files[slideFiles[i]].async('text');
    // Extract all <a:t>…</a:t> text nodes
    const textMatches = xmlContent.match(/<a:t[^>]*>([^<]*)<\/a:t>/g) ?? [];
    const slideText = textMatches
      .map((m) => m.replace(/<[^>]+>/g, '').trim())
      .filter(Boolean)
      .join(' ');

    if (slideText.trim()) {
      slideTexts.push(`[Slide ${i + 1}]\n${slideText}`);
    }
  }

  if (slideTexts.length === 0) {
    throw new Error('No readable text found in the PowerPoint slides. The slides may contain only images.');
  }

  return slideTexts.join('\n\n');
}

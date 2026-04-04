import { readFileSync } from 'fs';

const src = readFileSync('/vercel/share/v0-project/src/pages/admin/AdminDashboard.tsx', 'utf8');
const lines = src.split('\n');

// Find all JSX opening/closing tags (simplified)
// We only look at lines inside the main return (line 1833 onward)
const START = 1833;
const stack = [];
const issues = [];

for (let i = START; i < lines.length; i++) {
  const line = lines[i];
  const lineNum = i + 1;

  // Skip comments
  if (line.trim().startsWith('//') || line.trim().startsWith('{/*')) continue;
  if (line.trim().startsWith('*')) continue;

  // Look for opening <div, <motion.div, <form, <ul, <li, <nav, <section, <main, <aside
  const openTags = [...line.matchAll(/<(div|motion\.div|form|ul|ol|li|nav|section|main|aside|table|thead|tbody|tr|td|th|header|footer)\b[^>]*(?<!\/?)>/g)];
  const selfClose = [...line.matchAll(/<(div|motion\.div|form|ul|ol|li|nav|section|main|aside)\b[^>]*\/>/g)];
  const closeTags = [...line.matchAll(/<\/(div|motion\.div|form|ul|ol|li|nav|section|main|aside|table|thead|tbody|tr|td|th|header|footer)>/g)];

  // Subtract self-closing from opens
  const opens = openTags.length - selfClose.length;
  const closes = closeTags.length;

  for (let o = 0; o < opens; o++) stack.push(lineNum);
  for (let c = 0; c < closes; c++) {
    if (stack.length === 0) {
      issues.push(`Line ${lineNum}: EXTRA CLOSING TAG (stack empty) — "${line.trim()}"`);
    } else {
      stack.pop();
    }
  }
}

if (stack.length > 0) {
  console.log(`\nUnclosed tags opened at lines: ${stack.join(', ')}`);
  console.log(`\nStack depth: ${stack.length}`);
} else {
  console.log('\nAll tags balanced!');
}

if (issues.length > 0) {
  console.log('\nExtra closing tags found:');
  issues.forEach(i => console.log(' ', i));
}

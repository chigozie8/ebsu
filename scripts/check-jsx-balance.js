const { readFileSync } = require('fs');

const src = readFileSync('/vercel/share/v0-project/src/pages/admin/AdminDashboard.tsx', 'utf8');
const lines = src.split('\n');

const START = 1833; // line index (0-based) = line 1834 in editor
const stack = [];
const issues = [];

for (let i = START; i < lines.length; i++) {
  const line = lines[i];
  const lineNum = i + 1;

  const trimmed = line.trim();
  if (trimmed.startsWith('//') || trimmed.startsWith('{/*') || trimmed.startsWith('*')) continue;

  // Self-closing tags to exclude from opens
  const selfClose = (line.match(/<(div|motion\.div|form|ul|ol|li|nav|section|main|aside)\b[^>]*\/>/g) || []).length;
  const openTags  = (line.match(/<(div|motion\.div|form|ul|ol|li|nav|section|main|aside|table|thead|tbody|tr|td|th|header|footer)\b[^>]*>/g) || []).length;
  const closeTags = (line.match(/<\/(div|motion\.div|form|ul|ol|li|nav|section|main|aside|table|thead|tbody|tr|td|th|header|footer)>/g) || []).length;

  const opens  = openTags - selfClose;
  const closes = closeTags;

  for (let o = 0; o < opens; o++) stack.push(lineNum);
  for (let c = 0; c < closes; c++) {
    if (stack.length === 0) {
      issues.push(`Line ${lineNum}: EXTRA CLOSING TAG — "${trimmed.slice(0, 80)}"`);
    } else {
      stack.pop();
    }
  }
}

if (stack.length > 0) {
  console.log('Unclosed tags remain. Last 5 opened at lines: ' + stack.slice(-5).join(', '));
  console.log('Total unmatched opens: ' + stack.length);
} else {
  console.log('All tags balanced!');
}

if (issues.length > 0) {
  console.log('\nExtra closing tags:');
  issues.forEach(i => console.log('  ' + i));
}

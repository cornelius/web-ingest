// Shared by background.js (via importScripts) and popup.html (via <script>).
// Owns filename + frontmatter generation and the chrome.downloads call.

const SLUG_MAX_LEN = 60;

function slugify(text) {
  if (!text) return 'untitled';
  let s = text.replace(/[^\p{L}\p{N}\s_-]/gu, '').trim().toLowerCase();
  s = s.replace(/[\s_-]+/g, '-');
  s = Array.from(s).slice(0, SLUG_MAX_LEN).join('').replace(/^-+|-+$/g, '');
  return s || 'untitled';
}

function yamlEscape(s) {
  const escaped = String(s)
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
  return '"' + escaped + '"';
}

function buildFrontmatter({ title, url, clippedAt, comment }) {
  const lines = [
    '---',
    `title: ${yamlEscape(title)}`,
    `url: ${yamlEscape(url)}`,
    `clipped_at: ${yamlEscape(clippedAt)}`,
  ];
  const c = (comment || '').trim();
  if (c) lines.push(`comment: ${yamlEscape(c)}`);
  lines.push('---', '', '');
  return lines.join('\n');
}

function pad2(n) {
  return String(n).padStart(2, '0');
}

function timestampForFilename(d) {
  return `${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}T${pad2(d.getHours())}${pad2(d.getMinutes())}`;
}

function normalizeSubdir(raw) {
  return (raw || '').trim().replace(/^\/+|\/+$/g, '');
}

async function saveClip({ title, url, markdown, comment, subdir }) {
  const safeTitle = title || 'untitled';
  const clippedAt = new Date();
  const frontmatter = buildFrontmatter({
    title: safeTitle,
    url,
    clippedAt: clippedAt.toISOString(),
    comment,
  });
  const content = frontmatter + markdown;
  const filename = `${timestampForFilename(clippedAt)}-${slugify(safeTitle)}.md`;
  const dir = normalizeSubdir(subdir);
  const path = dir ? `${dir}/${filename}` : filename;
  const dataUrl =
    'data:text/markdown;charset=utf-8,' + encodeURIComponent(content);

  return chrome.downloads.download({
    url: dataUrl,
    filename: path,
    saveAs: false,
    conflictAction: 'uniquify',
  });
}

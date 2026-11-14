// Shared by background.js (via importScripts) and popup.html (via <script>).
// Owns filename + frontmatter generation and the chrome.downloads call.

const SLUG_MAX_LEN = 60;
const DOWNLOAD_TIMEOUT_MS = 30000;
// Keeps timestamp + slug + ".md" + a uniquify suffix under the 255-byte filename limit.
const SLUG_MAX_BYTES = 200;

function utf8Length(codePoint) {
  const cp = codePoint.codePointAt(0);
  if (cp < 0x80) return 1;
  if (cp < 0x800) return 2;
  if (cp < 0x10000) return 3;
  return 4;
}

function slugify(text) {
  if (!text) return 'untitled';
  let s = text.normalize('NFC').replace(/[^\p{L}\p{M}\p{N}\s_-]/gu, '').trim().toLowerCase();
  s = s.replace(/[\s_-]+/g, '-');
  const kept = [];
  let bytes = 0;
  for (const cp of Array.from(s).slice(0, SLUG_MAX_LEN)) {
    bytes += utf8Length(cp);
    if (bytes > SLUG_MAX_BYTES) break;
    kept.push(cp);
  }
  s = kept.join('').replace(/^-+|-+$/g, '');
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

// encodeURIComponent throws on unpaired surrogates, which badly encoded pages contain.
function replaceLoneSurrogates(s) {
  return s.replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g, '�');
}

function markdownDataUrl(content) {
  return 'data:text/markdown;charset=utf-8,' + encodeURIComponent(replaceLoneSurrogates(content));
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
  const dataUrl = markdownDataUrl(content);

  const downloadId = await chrome.downloads.download({
    url: dataUrl,
    filename: path,
    saveAs: false,
    conflictAction: 'uniquify',
  });
  await waitForDownload(downloadId);
  return downloadId;
}

function waitForDownload(downloadId, timeoutMs = DOWNLOAD_TIMEOUT_MS) {
  return new Promise((resolve, reject) => {
    let settled = false;
    let timer;
    const finish = (err) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      chrome.downloads.onChanged.removeListener(onChanged);
      if (err) reject(err);
      else resolve();
    };
    const settleFrom = (state, error) => {
      if (state === 'complete') finish();
      else if (state === 'interrupted') finish(new Error(`Download interrupted: ${error || 'unknown'}`));
    };
    const onChanged = (delta) => {
      if (delta.id !== downloadId) return;
      settleFrom(delta.state && delta.state.current, delta.error && delta.error.current);
    };
    chrome.downloads.onChanged.addListener(onChanged);
    timer = setTimeout(() => finish(new Error('Download did not finish in time')), timeoutMs);
    // The download may already have finished before the listener was attached.
    chrome.downloads.search({ id: downloadId }).then(
      ([item]) => { if (item) settleFrom(item.state, item.error); },
      () => {}
    );
  });
}

if (typeof module === 'object' && module.exports) {
  module.exports = {
    slugify,
    yamlEscape,
    buildFrontmatter,
    normalizeSubdir,
    timestampForFilename,
    markdownDataUrl,
    waitForDownload,
  };
}

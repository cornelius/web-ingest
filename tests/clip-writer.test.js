const test = require('node:test');
const assert = require('node:assert/strict');
const {
  slugify,
  yamlEscape,
  buildFrontmatter,
  normalizeSubdir,
  timestampForFilename,
  markdownDataUrl,
} = require('../extension/clip-writer.js');

const DATA_PREFIX = 'data:text/markdown;charset=utf-8,';

function decodeDataUrl(url) {
  assert.ok(url.startsWith(DATA_PREFIX));
  return decodeURIComponent(url.slice(DATA_PREFIX.length));
}

test('markdownDataUrl round-trips text including astral characters', () => {
  const text = '# Title\n\nCafé \u{1F600} 漢字';
  assert.equal(decodeDataUrl(markdownDataUrl(text)), text);
});

test('markdownDataUrl replaces lone surrogates instead of throwing', () => {
  const broken = 'a\uD83Db \uDE00c';
  assert.equal(decodeDataUrl(markdownDataUrl(broken)), 'a�b �c');
});

test('slugify lowercases and joins words with single hyphens', () => {
  assert.equal(slugify('Hello World'), 'hello-world');
  assert.equal(slugify('  Multiple   Spaces  '), 'multiple-spaces');
  assert.equal(slugify('Mixed_CASE-Words'), 'mixed-case-words');
});

test('slugify strips punctuation but keeps unicode letters', () => {
  assert.equal(slugify('Title with: punctuation!'), 'title-with-punctuation');
  assert.equal(slugify('Café Crème'), 'café-crème');
});

test('slugify falls back to "untitled" for empty or all-stripped input', () => {
  assert.equal(slugify(''), 'untitled');
  assert.equal(slugify(null), 'untitled');
  assert.equal(slugify(undefined), 'untitled');
  assert.equal(slugify('!!!'), 'untitled');
});

test('slugify caps at 60 characters', () => {
  const s = slugify('a'.repeat(100));
  assert.equal(s.length, 60);
});

test('slugify truncates at code-point boundaries, not surrogates', () => {
  // U+20000 is a supplementary-plane CJK letter (two utf-16 code units).
  // Sixty of them: 60 code points, 120 code units.
  const sixty = '\u{20000}'.repeat(60);
  const overflow = sixty + 'x';
  const result = slugify(overflow);
  assert.equal(Array.from(result).length, 60);
  // No lone surrogates.
  assert.equal(result, sixty);
});

test('slugify trims leading and trailing hyphens after truncation', () => {
  assert.equal(slugify('--leading-and-trailing--'), 'leading-and-trailing');
});

test('yamlEscape always emits a double-quoted scalar', () => {
  assert.equal(yamlEscape('simple'), '"simple"');
  assert.equal(yamlEscape(''), '""');
  assert.equal(yamlEscape('null'), '"null"');
  assert.equal(yamlEscape('true'), '"true"');
  assert.equal(yamlEscape('123'), '"123"');
  assert.equal(yamlEscape('-leading-dash'), '"-leading-dash"');
});

test('yamlEscape escapes backslash, quote, newline, CR, and tab', () => {
  assert.equal(yamlEscape('back\\slash'), '"back\\\\slash"');
  assert.equal(yamlEscape('has "quote"'), '"has \\"quote\\""');
  assert.equal(yamlEscape('two\nlines'), '"two\\nlines"');
  assert.equal(yamlEscape('with\rcr'), '"with\\rcr"');
  assert.equal(yamlEscape('with\ttab'), '"with\\ttab"');
});

test('buildFrontmatter emits three required keys with a trailing blank line', () => {
  const out = buildFrontmatter({
    title: 'Hello',
    url: 'https://example.com/x',
    clippedAt: '2026-05-23T22:05:31.000Z',
  });
  assert.equal(
    out,
    '---\n' +
      'title: "Hello"\n' +
      'url: "https://example.com/x"\n' +
      'clipped_at: "2026-05-23T22:05:31.000Z"\n' +
      '---\n\n'
  );
});

test('buildFrontmatter includes a comment when one is supplied', () => {
  const out = buildFrontmatter({
    title: 'Hello',
    url: 'https://example.com/x',
    clippedAt: '2026-05-23T22:05:31.000Z',
    comment: 'a note',
  });
  assert.match(out, /^comment: "a note"$/m);
});

test('buildFrontmatter omits the comment line for empty or whitespace input', () => {
  const out = buildFrontmatter({
    title: 'Hello',
    url: 'https://example.com/x',
    clippedAt: '2026-05-23T22:05:31.000Z',
    comment: '   ',
  });
  assert.doesNotMatch(out, /^comment:/m);
});

test('buildFrontmatter encodes a multiline comment as a single yaml line', () => {
  const out = buildFrontmatter({
    title: 'Hello',
    url: 'https://example.com/x',
    clippedAt: '2026-05-23T22:05:31.000Z',
    comment: 'line one\nline two',
  });
  assert.match(out, /^comment: "line one\\nline two"$/m);
});

test('normalizeSubdir strips leading and trailing slashes', () => {
  assert.equal(normalizeSubdir('web-clips'), 'web-clips');
  assert.equal(normalizeSubdir('/web-clips/'), 'web-clips');
  assert.equal(normalizeSubdir('///notes/web///'), 'notes/web');
});

test('normalizeSubdir returns empty for empty or missing input', () => {
  assert.equal(normalizeSubdir(''), '');
  assert.equal(normalizeSubdir(null), '');
  assert.equal(normalizeSubdir(undefined), '');
  assert.equal(normalizeSubdir('   '), '');
});

test('timestampForFilename uses ISO 8601 basic format in local time', () => {
  // May = month index 4
  const d = new Date(2026, 4, 23, 22, 5);
  assert.equal(timestampForFilename(d), '20260523T2205');
});

test('timestampForFilename zero-pads single-digit components', () => {
  const d = new Date(2026, 0, 3, 4, 7);
  assert.equal(timestampForFilename(d), '20260103T0407');
});

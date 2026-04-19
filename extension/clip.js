(() => {
  try {
    const article = new Readability(document.cloneNode(true)).parse();
    if (!article) return null;

    const turndown = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced',
      bulletListMarker: '-',
      emDelimiter: '_',
    });

    return {
      title: article.title || document.title || '',
      markdown: turndown.turndown(article.content || ''),
    };
  } catch (e) {
    return { error: String(e) };
  }
})();

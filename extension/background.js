const HOST_NAME = 'de.cornelius.web_ingest';
const BADGE_DURATION_MS = 3000;

chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id || !tab.url || !/^https?:/.test(tab.url)) {
    await flashBadge('SKIP', '#9e9e9e');
    return;
  }

  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['lib/readability.js', 'lib/turndown.js', 'clip.js'],
    });
    const clip = results?.[results.length - 1]?.result;
    if (!clip || !clip.markdown) {
      throw new Error('Readability returned nothing — page may not be an article');
    }

    const response = await chrome.runtime.sendNativeMessage(HOST_NAME, {
      url: tab.url,
      title: clip.title || tab.title || '',
      markdown: clip.markdown,
      clipped_at: new Date().toISOString(),
    });

    if (response && response.ok) {
      await flashBadge('OK', '#4caf50');
    } else {
      throw new Error(response?.error || 'host returned no ok flag');
    }
  } catch (err) {
    console.error('[web-ingest] clip failed:', err);
    await flashBadge('ERR', '#f44336');
  }
});

async function flashBadge(text, color) {
  await chrome.action.setBadgeText({ text });
  await chrome.action.setBadgeBackgroundColor({ color });
  setTimeout(() => chrome.action.setBadgeText({ text: '' }), BADGE_DURATION_MS);
}

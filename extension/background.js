importScripts('clip-writer.js');

const BADGE_DURATION_MS = 3000;
const DEFAULT_SUBDIR = 'web-clips';
const DEFAULT_TITLE = 'Clip page as markdown';

async function syncPopup() {
  const { askForComment } = await chrome.storage.sync.get({ askForComment: false });
  await chrome.action.setPopup({ popup: askForComment ? 'popup.html' : '' });
}

syncPopup();
chrome.runtime.onInstalled.addListener(syncPopup);
chrome.runtime.onStartup.addListener(syncPopup);

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && 'askForComment' in changes) {
    syncPopup();
  }
});

// Fires only when default_popup is unset (askForComment === false).
// The popup path is handled entirely in popup.js.
chrome.action.onClicked.addListener(async (tab) => {
  const tabId = tab.id;
  await resetTitle(tabId);

  if (!tabId || !tab.url || !/^https?:/.test(tab.url)) {
    await flashBadge(tabId, 'SKIP', '#9e9e9e');
    return;
  }

  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      files: ['lib/readability.js', 'lib/turndown.js', 'clip.js'],
    });
    const clip = results?.[results.length - 1]?.result;
    if (clip?.error) {
      throw new Error(clip.error);
    }
    if (!clip || !clip.markdown) {
      throw new Error('Readability returned nothing - page may not be an article');
    }

    const { subdir } = await chrome.storage.sync.get({ subdir: DEFAULT_SUBDIR });

    await saveClip({
      title: clip.title || tab.title || '',
      url: tab.url,
      markdown: clip.markdown,
      subdir,
    });

    await flashBadge(tabId, 'OK', '#4caf50');
  } catch (err) {
    console.error('[web-ingest] clip failed:', err);
    await setTitle(tabId, `Web Ingest - ${err.message}`);
    await flashBadge(tabId, 'ERR', '#f44336');
  }
});

const badgeTimers = new Map();

// Badge and title calls reject once the tab is closed; a clip finishing after that is not an error.
async function flashBadge(tabId, text, color) {
  if (!tabId) return;
  clearTimeout(badgeTimers.get(tabId));
  try {
    await chrome.action.setBadgeText({ text, tabId });
    await chrome.action.setBadgeBackgroundColor({ color, tabId });
  } catch {
    badgeTimers.delete(tabId);
    return;
  }
  badgeTimers.set(tabId, setTimeout(() => {
    badgeTimers.delete(tabId);
    chrome.action.setBadgeText({ text: '', tabId }).catch(() => {});
  }, BADGE_DURATION_MS));
}

function setTitle(tabId, title) {
  if (!tabId) return Promise.resolve();
  return chrome.action.setTitle({ tabId, title }).catch(() => {});
}

function resetTitle(tabId) {
  return setTitle(tabId, DEFAULT_TITLE);
}

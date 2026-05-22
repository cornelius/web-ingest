const HOST_NAME = 'de.cornelius.web_ingest';

const titleEl = document.getElementById('title');
const urlEl = document.getElementById('url');
const commentEl = document.getElementById('comment');
const statusEl = document.getElementById('status');
const saveBtn = document.getElementById('save');
const cancelBtn = document.getElementById('cancel');

let activeTab = null;

(async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  activeTab = tab;
  titleEl.textContent = tab?.title || '(no title)';
  urlEl.textContent = tab?.url || '';
  if (!tab?.id || !tab?.url || !/^https?:/.test(tab.url)) {
    setStatus("Can't clip this page (must be http/https).", 'error');
    saveBtn.disabled = true;
  }
})();

cancelBtn.addEventListener('click', () => window.close());
saveBtn.addEventListener('click', save);

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    window.close();
  } else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    save();
  }
});

async function save() {
  if (!activeTab || saveBtn.disabled) return;
  saveBtn.disabled = true;
  cancelBtn.disabled = true;
  setStatus('Saving…', '');

  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId: activeTab.id },
      files: ['lib/readability.js', 'lib/turndown.js', 'clip.js'],
    });
    const clip = results?.[results.length - 1]?.result;
    if (!clip || !clip.markdown) {
      throw new Error('Readability returned nothing — page may not be an article');
    }

    const response = await chrome.runtime.sendNativeMessage(HOST_NAME, {
      url: activeTab.url,
      title: clip.title || activeTab.title || '',
      markdown: clip.markdown,
      comment: commentEl.value,
      clipped_at: new Date().toISOString(),
    });

    if (response && response.ok) {
      setStatus('Saved.', 'ok');
      setTimeout(() => window.close(), 400);
    } else {
      throw new Error(response?.error || 'host returned no ok flag');
    }
  } catch (err) {
    console.error('[web-ingest] clip failed:', err);
    setStatus(err.message || String(err), 'error');
    saveBtn.disabled = false;
    cancelBtn.disabled = false;
  }
}

function setStatus(text, cls) {
  statusEl.textContent = text;
  statusEl.className = 'status' + (cls ? ' ' + cls : '');
}

const DEFAULT_SUBDIR = 'web-clips';
const SAVE_DEBOUNCE_MS = 300;

const subdir = document.getElementById('subdir');
const subdirError = document.getElementById('subdirError');
const askForComment = document.getElementById('askForComment');
const saved = document.getElementById('saved');

let savedTimer;
function showSaved() {
  saved.textContent = 'Saved.';
  clearTimeout(savedTimer);
  savedTimer = setTimeout(() => { saved.textContent = ''; }, 1500);
}

let saveTimer;
function scheduleSaveSubdir() {
  clearTimeout(saveTimer);
  const error = validateSubdir(subdir.value);
  subdirError.textContent = error || '';
  if (error) return;
  saveTimer = setTimeout(async () => {
    await chrome.storage.sync.set({ subdir: subdir.value.trim() });
    showSaved();
  }, SAVE_DEBOUNCE_MS);
}

chrome.storage.sync.get({ subdir: DEFAULT_SUBDIR, askForComment: false }, (values) => {
  subdir.value = values.subdir;
  askForComment.checked = values.askForComment;
});

subdir.addEventListener('input', scheduleSaveSubdir);

askForComment.addEventListener('change', async () => {
  await chrome.storage.sync.set({ askForComment: askForComment.checked });
  showSaved();
});

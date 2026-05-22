const DEFAULT_SUBDIR = 'web-clips';

const subdir = document.getElementById('subdir');
const askForComment = document.getElementById('askForComment');
const saved = document.getElementById('saved');

let savedTimer;
function showSaved() {
  saved.textContent = 'Saved.';
  clearTimeout(savedTimer);
  savedTimer = setTimeout(() => { saved.textContent = ''; }, 1500);
}

chrome.storage.sync.get({ subdir: DEFAULT_SUBDIR, askForComment: false }, (values) => {
  subdir.value = values.subdir;
  askForComment.checked = values.askForComment;
});

subdir.addEventListener('change', async () => {
  await chrome.storage.sync.set({ subdir: subdir.value.trim() });
  showSaved();
});

askForComment.addEventListener('change', async () => {
  await chrome.storage.sync.set({ askForComment: askForComment.checked });
  showSaved();
});

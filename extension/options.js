const outputDir = document.getElementById('outputDir');
const askForComment = document.getElementById('askForComment');
const saved = document.getElementById('saved');

let savedTimer;
function showSaved() {
  saved.textContent = 'Saved.';
  clearTimeout(savedTimer);
  savedTimer = setTimeout(() => { saved.textContent = ''; }, 1500);
}

chrome.storage.sync.get({ outputDir: '', askForComment: false }, (values) => {
  outputDir.value = values.outputDir;
  askForComment.checked = values.askForComment;
});

outputDir.addEventListener('change', async () => {
  await chrome.storage.sync.set({ outputDir: outputDir.value.trim() });
  showSaved();
});

askForComment.addEventListener('change', async () => {
  await chrome.storage.sync.set({ askForComment: askForComment.checked });
  showSaved();
});

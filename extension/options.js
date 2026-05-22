const checkbox = document.getElementById('askForComment');
const saved = document.getElementById('saved');

chrome.storage.sync.get({ askForComment: false }, ({ askForComment }) => {
  checkbox.checked = askForComment;
});

checkbox.addEventListener('change', async () => {
  await chrome.storage.sync.set({ askForComment: checkbox.checked });
  saved.textContent = 'Saved.';
  setTimeout(() => { saved.textContent = ''; }, 1500);
});

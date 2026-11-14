const test = require('node:test');
const assert = require('node:assert/strict');
const { waitForDownload } = require('../extension/clip-writer.js');

function mockDownloads(searchResult = []) {
  const listeners = new Set();
  globalThis.chrome = {
    downloads: {
      onChanged: {
        addListener: (fn) => listeners.add(fn),
        removeListener: (fn) => listeners.delete(fn),
      },
      search: async () => searchResult,
    },
  };
  return {
    listeners,
    emit: (delta) => [...listeners].forEach((fn) => fn(delta)),
  };
}

test('waitForDownload resolves when the download completes', async () => {
  const dl = mockDownloads([{ id: 7, state: 'in_progress' }]);
  const p = waitForDownload(7, 1000);
  dl.emit({ id: 8, state: { current: 'interrupted' } });
  dl.emit({ id: 7, state: { current: 'complete' } });
  await p;
  assert.equal(dl.listeners.size, 0);
});

test('waitForDownload rejects with the reason when interrupted', async () => {
  const dl = mockDownloads([{ id: 7, state: 'in_progress' }]);
  const p = waitForDownload(7, 1000);
  dl.emit({ id: 7, state: { current: 'interrupted' }, error: { current: 'FILE_NO_SPACE' } });
  await assert.rejects(p, /Download interrupted: FILE_NO_SPACE/);
  assert.equal(dl.listeners.size, 0);
});

test('waitForDownload resolves when the download had already completed', async () => {
  const dl = mockDownloads([{ id: 7, state: 'complete' }]);
  await waitForDownload(7, 1000);
  assert.equal(dl.listeners.size, 0);
});

test('waitForDownload rejects after the timeout', async () => {
  const dl = mockDownloads([{ id: 7, state: 'in_progress' }]);
  await assert.rejects(waitForDownload(7, 20), /did not finish in time/);
  assert.equal(dl.listeners.size, 0);
});

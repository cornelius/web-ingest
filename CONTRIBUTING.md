# Contributing

Issues and pull requests are welcome. Report bugs, pages that clip badly, or ideas at [GitHub issues](https://github.com/cornelius/web-ingest/issues). For a larger change, open an issue first so we can agree on the approach.

## Prerequisites

- Google Chrome or Chromium
- Node.js 20 or later, for the tests
- `make` and `zip`, for packaging

## Run the extension from source

1. Clone the repo.
2. Open `chrome://extensions` and turn on *Developer mode*.
3. Click *Load unpacked* and select the `extension/` folder.

After changing a file, click the reload arrow on the extension's card at `chrome://extensions`.

The extension has no build step: Chrome loads the files in `extension/` as they are. Third-party libraries are vendored in `extension/lib/`.

## Test

```sh
make test
```

The unit tests cover `extension/clip-writer.js` and use Node's built-in test runner, so there is nothing to install. Also try a change by hand: clip a few pages, with the comment dialog both off and on.

## Build the store package

```sh
make package
```

This writes `dist/web-ingest-<version>.zip`, the file uploaded to the Chrome Web Store. `make clean` removes it.

## Pull requests

- Keep each commit to one logical change.
- Use [Conventional Commits](https://www.conventionalcommits.org/) messages, for example `fix(extension): handle pages without a title`.
- Run `make test` before opening the pull request.

`ARCHITECTURE.md` explains how the extension is put together.

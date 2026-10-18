# Security

## What the app can do

- It makes no network requests. The Content Security Policy in `index.html` sets `connect-src 'none'`, allows only same-origin scripts and styles, and forbids inline code, frames, plugins, forms and `eval`.
- It uses no third-party code, no CDN, no fonts or images from elsewhere.
- It asks for no permissions: no camera, microphone, location, contacts, files or notifications.
- It stores data only in the browser's local storage (`js/store.js`). Everything loaded or imported is validated and clamped, and unknown keys are dropped.
- It never writes HTML from data (no `innerHTML`); text is always inserted as text.
- The service worker only serves the app's own cached files and ignores other sites.

`node tools/audit.mjs` enforces these rules on every file and fails the build if any is broken. CI runs it on every push.

## Protecting the repository

The main risk with any app hosted from GitHub is someone else changing your code. To reduce it:

1. Turn on two-factor authentication for your GitHub account.
2. Under Settings > Branches, protect `main` (require a pull request and passing checks).
3. Do not add collaborators or install GitHub Apps you do not need.
4. If you add other GitHub Actions, pin them to a commit SHA and keep `permissions: contents: read`.
5. Read the diff, and let `node tools/audit.mjs` pass, before you merge any change.

## Reporting a problem

Open an issue on your repository. Your data never leaves your phone, so erasing it (Settings > Erase) or clearing the site's data in Chrome resets everything.

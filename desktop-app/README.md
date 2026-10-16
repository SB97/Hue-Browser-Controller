# Open Hue Controller (desktop app)

Electron wrapper around the website in the repo root. Only the app-specific files live here: `src/index.js` (main process), `src/preload.js` (exposes `window.desktopApp.ready()`), `src/icons/`, `scripts/copy-web.js` and `package.json`.

## Building (Windows)

Requires Node.js (LTS).

```sh
npm ci           # or `npm install` the first time, to create package-lock.json
npm start        # run the app locally
npm run dist     # build dist/Open Hue Controller Setup <version> Windows.exe
```

Both scripts first run `scripts/copy-web.js`, which copies the website from the repo root into `src/` (the main process loads `src/index.html`). The copied files, `node_modules/` and `dist/` are git-ignored.

The installer is built with electron-builder (NSIS, per-machine install to `C:\Program Files\Open Hue Controller\`). Electron is pinned to an exact version (currently 44.8.0, which needs Windows 10 or later and 64-bit Windows). Since Electron 42 the `electron` package no longer downloads its binary on `npm install`; `npm start` fetches it on first run. `nsis.guid` is the uninstall key of the released installers (1.0.2 and later), so a new build upgrades an existing installation instead of installing next to it. Don't change it.

To release a new version, bump `version` in `package.json` before building.

## Patching an existing installation

On Windows the app installs to `C:\Program Files\Open Hue Controller\`. The installer ships it as `resources\app.asar`. Once that archive has been extracted to `resources\app\` (and `app.asar` renamed so Electron loads the folder), you can overwrite `src\index.js` or `src\preload.js` there. You need admin rights for that.

# Open Hue Controller (desktop app)

Electron wrapper around the website in the repo root. Only the app-specific files live here: `src/index.js` (main process), `src/preload.js` (exposes `window.desktopApp.ready()`), `src/icons/` and `package.json`.

## Building

The main process loads `src/index.html`, so the website has to be copied into `src/` before packaging:

```sh
cp -r ../index.html ../css ../js ../img ../svg ../libraries ../bootstrap-5.0.0-dist src/
npm install --save-dev electron @electron-forge/cli @electron-forge/maker-squirrel @electron-forge/maker-zip
npx electron-forge make
```

Don't commit the copied website files or `node_modules/`.

## Patching an existing installation

On Windows the app installs to `C:\Program Files\Open Hue Controller\`. The installer ships it as `resources\app.asar`. Once that archive has been extracted to `resources\app\` (and `app.asar` renamed so Electron loads the folder), you can overwrite `src\index.js` or `src\preload.js` there. You need admin rights for that.

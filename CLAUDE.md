# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

A static website (no build step, no package manager, no tests, no linter) that controls Philips Hue lights by calling the Hue Bridge's local REST API (v1, `http://<bridge-ip>/api/<token>/...`) directly from the browser. Deployed via GitHub Pages from the `deploy` branch. The same page is also loaded by a separate "Open Hue Controller" desktop app (installers in `downloads/`, linked from `download.html`). That app's Electron main/preload code and its electron-builder config are in `desktop-app/` (see its README for building the Windows installer); the installers in `downloads/` are not rebuilt automatically.

## Running

Open `index.html` directly in a browser, or serve the folder with any static server (e.g. `python -m http.server`). Because the bridge is only reachable over plain `http://`, an `https://` deployment requires the user to allow "insecure content" in the browser (see `img/InsecureContent*.jpg` and the login error text).

## Architecture

All JS is plain global-scope scripts — no modules. `index.html` loads them in a fixed order that matters, since later files call functions defined by earlier ones:

`bootstrap.js` → `qrcode.min.js` → `api.js` → `actions.js` → `ColorConverter.js` → `dashboardSite.js` → `mainScript.js` → `login.js` → `reactOnInput.js`

- **`js/api.js`** — thin `fetch` wrappers (`getRequest`, `putRequest`, `postRequest`, `testIP`, `connectionGood`). URLs are passed *without* scheme; the wrapper prepends `http://` (or `https://` in `getRequestSecure`). Errors are frequently matched by their stringified form elsewhere (e.g. `err == "Error: AbortTimeout"`, `"TypeError: Failed to fetch"`), so changing error messages here breaks UI error handling in `login.js`.
- **`js/login.js`** — entry point (runs on load). Flow: `checkQueryArgs()` (accepts `?token=&ip=`, which is what the dashboard's QR code / share link encodes) → `checkLocalStorage()` → `setDashboard()`. New connections use `discovery.meethue.com` to find bridges, then poll `POST /api` every 1.5s waiting for the link button. `setDashboard()` is the universal "refresh": it refetches rooms/lights/scenes and replaces `#mainSite` innerHTML wholesale.
- **`js/mainScript.js`** — fetches and normalizes bridge data (`getHueRooms/Lights/Scenes`), filtering by the `allowedGroups`/`allowedLights`/`allowedScenes` type lists; also settings, theme and logout. Holds global state `allRooms` and `selectedRoomID`. `testingEnvironment` swaps in `testGroups`/`testLights`/`testScenes` JSON, but those variables are not defined anywhere in the repo.
- **`js/dashboardSite.js`** — `DashboardPage.getHtml()` and helpers build the whole dashboard as template-literal HTML strings with inline `onclick`/`onchange` attributes.
- **`js/reactOnInput.js`** — the global `*_click` / `*_change` handlers referenced by those inline attributes. Most actions call `setDashboard()` afterward to re-render. Handlers must stay global for the inline attributes to resolve.
- **`js/actions.js`** — `actions` class issuing `PUT` state changes to groups/lights.

### Persistence

`localStorage` keys: `hueAcc` (`{token, ip}`) and `siteSettings` (`{effects, showUnreachable, theme}`).

### Desktop app hook

When run inside the desktop app (`desktop-app/src/preload.js`), `window.desktopApp` exists and its window stays hidden until `window.desktopApp.ready()` is called. `signalAppReady()` in `login.js` must be called on every path that finishes painting the first view (login screen shown, dashboard rendered, or error). In a normal browser `window.desktopApp` is undefined and this is a no-op. `window.desktopApp.version` and `.exePath` (passed from the main process via `additionalArguments`) are shown in the title bar and in a "Desktop app" section of the settings modal.

`desktop-app/scripts/copy-web.js` copies the website into the app and strips the cookie consent banner, Google Analytics, the "Update Cookies" button and the login screen's Download button from `index.html` (website-only). It matches them by the `<!-- Cookie Consent` … `<!-- end of Google Analytics-->` comments, `id="open_preferences_center"` and `id="downloadBtn"`, and fails the build if those change. The dashboard's Download link is instead skipped at runtime when `window.desktopApp` exists.

### Vendored code

`bootstrap-5.0.0-dist/`, `js/qrcode.min.js` and `libraries/rgb-color-converter/` are third-party; don't edit them.

// Copies the website from the repo root into src/, where the main process loads it from.
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..', '..');
const target = path.join(__dirname, '..', 'src');
const entries = ['index.html', 'css', 'js', 'img', 'svg', 'libraries', 'bootstrap-5.0.0-dist', 'favicon'];

for (const entry of entries) {
  const dest = path.join(target, entry);
  fs.rmSync(dest, { recursive: true, force: true });
  fs.cpSync(path.join(root, entry), dest, { recursive: true });
}

// The cookie consent banner, Google Analytics and the link to the app's own download
// page are only meant for the website (download.html isn't even copied).
// Fail the build if a pattern no longer matches, so they can't silently slip back in.
const removeFromHtml = [
  /[ \t]*<!-- Cookie Consent[\s\S]*?<!-- end of Google Analytics-->\r?\n/,
  /[ \t]*<a [^>]*id="open_preferences_center"[^>]*>.*?<\/a>\r?\n/,
  /[ \t]*<a [^>]*id="downloadBtn"[^>]*>.*?<\/a>\r?\n/
];
const indexPath = path.join(target, 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');
for (const pattern of removeFromHtml) {
  if (!pattern.test(html)) throw new Error(`copy-web: ${pattern} not found in index.html`);
  html = html.replace(pattern, '');
}
fs.writeFileSync(indexPath, html);

console.log(`Copied website into ${target}`);

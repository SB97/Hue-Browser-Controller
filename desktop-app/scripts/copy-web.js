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
console.log(`Copied website into ${target}`);

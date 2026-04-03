/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require("fs");
const path = require("path");

// In production we ship compiled JS at ./build/preload.js
const compiledPreloadPath = path.join(__dirname, "build", "preload.js");

if (fs.existsSync(compiledPreloadPath)) {
  require(compiledPreloadPath);
} else {
  // Dev: allow loading the TypeScript preload via tsx
  require("tsx/cjs");
  require(path.join(__dirname, "preload.ts"));
}

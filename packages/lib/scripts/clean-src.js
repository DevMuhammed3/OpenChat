#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const src = path.resolve(__dirname, "..", "src");

function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const stat = fs.statSync(full);

    if (stat.isDirectory()) {
      walk(full);
    } else if (stat.isFile() && full.endsWith(".js")) {
      try {
        fs.unlinkSync(full);
        console.log("removed", full);
      } catch (e) {
        console.error("failed to remove", full, e.message);
      }
    }
  }
}

walk(src);

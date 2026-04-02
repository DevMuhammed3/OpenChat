import { spawnSync } from "node:child_process";
import fs from "node:fs";

function hasLibcryptSo1() {
  const candidates = [
    "/lib64/libcrypt.so.1",
    "/usr/lib64/libcrypt.so.1",
    "/lib/x86_64-linux-gnu/libcrypt.so.1",
    "/usr/lib/x86_64-linux-gnu/libcrypt.so.1",
  ];

  return candidates.some((p) => fs.existsSync(p));
}

function run(cmd, args) {
  const result = spawnSync(cmd, args, { stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

function printLinuxDebHint() {
  // Fedora/RHEL family usually needs libxcrypt-compat to provide libcrypt.so.1
  console.warn(
    [
      "",
      "NOTE: Skipping .deb packaging because `libcrypt.so.1` is missing.",
      "On Fedora you can enable .deb builds by installing: `sudo dnf install -y libxcrypt-compat`",
      "Or set `OPENCHAT_SKIP_DEB=1` to silence this message and always build AppImage only.",
      "",
    ].join("\n"),
  );
}

const skipDeb = process.env.OPENCHAT_SKIP_DEB === "1" || process.env.OPENCHAT_SKIP_DEB === "true";

// electron-builder will build what’s configured in `desktop/electron-builder.json` by default.
// On Fedora, the bundled `fpm` (used for .deb) requires `libcrypt.so.1`, which is not installed by default.
if (process.platform === "linux" && (skipDeb || !hasLibcryptSo1())) {
  if (!skipDeb && !hasLibcryptSo1()) printLinuxDebHint();
  // Build only AppImage to keep local Linux builds reliable.
  run("pnpm", ["exec", "electron-builder", "--linux", "AppImage"]);
} else {
  run("pnpm", ["exec", "electron-builder"]);
}

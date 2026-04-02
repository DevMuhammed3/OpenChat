/**
 * electron-builder calls this hook before installing/rebuilding production dependencies.
 *
 * In this monorepo, running a production-only install from inside `desktop/` can cause pnpm
 * to operate at the workspace root and prune dev dependencies that electron-builder still needs
 * (like `app-builder-bin`), leading to ENOENT in CI.
 *
 * Returning `false` skips dependency install/rebuild steps.
 */
exports.default = async function beforeBuild() {
  return false;
};


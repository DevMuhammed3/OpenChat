import path from "node:path";
import fs from "node:fs/promises";

const repoRoot = path.resolve(import.meta.dirname, "..", "..");
const desktopDir = path.resolve(import.meta.dirname, "..");

const frontendDir = path.join(repoRoot, "apps", "frontend");
const nextDir = path.join(frontendDir, ".next");

const standaloneDir = path.join(nextDir, "standalone");
const staticDir = path.join(nextDir, "static");
const publicDir = path.join(frontendDir, "public");

const rendererDir = path.join(desktopDir, "renderer");

async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  if (!(await exists(standaloneDir))) {
    throw new Error(
      `Missing ${standaloneDir}. Run the frontend build first (pnpm --filter frontend build).`,
    );
  }

  await fs.rm(rendererDir, { recursive: true, force: true });
  await fs.mkdir(rendererDir, { recursive: true });

  // Copy the standalone server bundle (includes server.js + minimal node_modules)
  await fs.cp(standaloneDir, rendererDir, { recursive: true });

  const serverEntryCandidates = [
    path.join(rendererDir, "server.js"),
    path.join(rendererDir, "apps", "frontend", "server.js"),
  ];
  const serverEntry = await (async () => {
    for (const candidate of serverEntryCandidates) {
      // eslint-disable-next-line no-await-in-loop
      if (await exists(candidate)) return candidate;
    }
    return null;
  })();

  if (!serverEntry) {
    throw new Error(`Could not find server.js inside ${rendererDir}`);
  }

  const serverBaseDir = path.dirname(serverEntry);

  if (await exists(staticDir)) {
    await fs.mkdir(path.join(serverBaseDir, ".next"), { recursive: true });
    await fs.cp(staticDir, path.join(serverBaseDir, ".next", "static"), { recursive: true });
  }

  if (await exists(publicDir)) {
    await fs.cp(publicDir, path.join(serverBaseDir, "public"), { recursive: true });
  }
}

await main();

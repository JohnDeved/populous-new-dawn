import { execFileSync } from "node:child_process";
import vinext from "vinext";
import { defineConfig } from "vite";
import hostingConfig from "./.openai/hosting.json";
import { sites } from "./build/sites-vite-plugin";

// Embed the actual checkout identity, never a guessed release/version. Archives
// without Git metadata explicitly report unknown in diagnostic exports.
function buildRevision() {
  if (process.env.PND_RUNTIME_ROOT) {
    const source = process.env.PND_RUNTIME_SOURCE;
    const revision = process.env.PND_RUNTIME_REVISION;
    const pool = process.env.PND_RUNTIME_POOL;
    if (!source || !revision || !pool) throw new Error("Incomplete shared runtime identity");
    // A caller-supplied revision is not proof. The verifier rechecks the Git commit,
    // every materialized source file, and every externally linked asset byte.
    const verified = execFileSync("python3", [
      `${import.meta.dirname}/scripts/orchestration/shared_runtime.py`, "revision",
      "--source", source, "--revision", revision, "--pool", pool,
      "--runtime", import.meta.dirname,
    ], { encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] }).trim();
    if (!/^[0-9a-f]{40}$/.test(verified)) throw new Error("Invalid shared runtime revision");
    return verified;
  }
  try {
    const revision = execFileSync("git", ["rev-parse", "HEAD"], { cwd: import.meta.dirname, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
    const dirty = execFileSync("git", ["status", "--porcelain"], { cwd: import.meta.dirname, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
    return /^[0-9a-f]{40}$/.test(revision) ? revision + (dirty ? "-dirty" : "") : "unknown";
  } catch { return "unknown"; }
}

const SITE_CREATOR_PLACEHOLDER_DATABASE_ID =
  "00000000-0000-4000-8000-000000000000";

const { d1, r2 } = hostingConfig;

// macOS Seatbelt blocks FSEvents, so Codex previews need polling for HMR.
const isCodexSeatbeltSandbox = process.env.CODEX_SANDBOX === "seatbelt";

const localBindingConfig = {
  main: "./worker/index.ts",
  compatibility_flags: ["nodejs_compat"],
  d1_databases: d1
    ? [
        {
          binding: d1,
          database_name: "site-creator-d1",
          database_id: SITE_CREATOR_PLACEHOLDER_DATABASE_ID,
        },
      ]
    : [],
  r2_buckets: r2
    ? [
        {
          binding: r2,
          bucket_name: "site-creator-r2",
        },
      ]
    : [],
};

export default defineConfig(async () => {
  // Keep Wrangler and Miniflare state project-local. These are non-secret tool
  // settings; application environment belongs in ignored `.env*` files.
  process.env.WRANGLER_WRITE_LOGS ??= "false";
  process.env.WRANGLER_LOG_PATH ??= ".wrangler/logs";
  process.env.MINIFLARE_REGISTRY_PATH ??= ".wrangler/registry";

  // Wrangler snapshots its log path while the Cloudflare plugin is imported.
  const { cloudflare } = await import("@cloudflare/vite-plugin");

  return {
    define: { __PND_BUILD_REVISION__: JSON.stringify(buildRevision()) },
    // Keep generated caches outside potentially shared, read-only dependencies.
    cacheDir: "work/build-cache/node_modules/.vite",
    server: {
      watch: isCodexSeatbeltSandbox
        ? { useFsEvents: false, usePolling: true, ignored: ['**/work/**'] }
        : { ignored: ['**/work/**'] },
    },
    plugins: [
      vinext(),
      sites(),
      cloudflare({
        viteEnvironment: { name: "rsc", childEnvironments: ["ssr"] },
        ...(process.env.PND_CLOUDFLARE === "1"
          ? { configPath: "./wrangler.cloudflare.jsonc" }
          : { config: localBindingConfig }),
      }),
    ],
  };
});

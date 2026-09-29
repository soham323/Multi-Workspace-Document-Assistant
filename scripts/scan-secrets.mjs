// scripts/scan-secrets.mjs
// Pre-commit hook script: Scans git staged diff for credentials and secrets.
// Exits with code 1 if any secret pattern is found, blocking git commit.

import { execSync } from "node:child_process";

const SECRET_PATTERNS = [
  { name: "Supabase JWT / Service Role / Anon Key", regex: /eyJhbGciOi[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/ },
  { name: "Supabase Publishable Key", regex: /sb_publishable_[A-Za-z0-9_-]{20,}/ },
  { name: "Google / Gemini API Key", regex: /(AIza[0-9A-Za-z-_]{35}|AQ\.[0-9A-Za-z-_]{30,})/ },
  { name: "Discord Webhook with Token", regex: /https:\/\/discord\.com\/api\/webhooks\/\d+\/[A-Za-z0-9_-]{20,}/ },
  { name: "Private Key Header", regex: /-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----/ },
];

function checkStagedDiff() {
  let diff = "";
  try {
    diff = execSync("git diff --cached -U0", { encoding: "utf-8" });
  } catch (err) {
    // If not in a git repo or no commits yet
    return;
  }

  if (!diff.trim()) {
    return;
  }

  // Check only added lines (lines starting with '+' but not '+++')
  const addedLines = diff
    .split("\n")
    .filter((line) => line.startsWith("+") && !line.startsWith("+++"))
    .map((line) => line.slice(1));

  const violations = [];

  for (let i = 0; i < addedLines.length; i++) {
    const line = addedLines[i];
    for (const pattern of SECRET_PATTERNS) {
      if (pattern.regex.test(line)) {
        violations.push({
          pattern: pattern.name,
          preview: line.trim().slice(0, 60) + "...",
        });
      }
    }
  }

  // Also check if any staged file is an env file containing secrets
  try {
    const stagedFiles = execSync("git diff --cached --name-only", { encoding: "utf-8" })
      .split("\n")
      .map((f) => f.trim())
      .filter(Boolean);

    for (const file of stagedFiles) {
      if (/^\.env(\..+)?\.local$/.test(file) || file === ".env") {
        violations.push({
          pattern: "Attempted to commit an active environment file",
          preview: file,
        });
      }
    }
  } catch {}

  if (violations.length > 0) {
    console.error("\n❌ [GIT PRE-COMMIT HOOK] COMMIT ABORTED: Sensitive secrets detected in staged changes!");
    console.error("================================================================================");
    violations.forEach((v, idx) => {
      console.error(`  ${idx + 1}. Type: ${v.pattern}`);
      console.error(`     Snippet: ${v.preview}`);
    });
    console.error("================================================================================");
    console.error("Please remove all hardcoded keys and load them from .env.local via process.env.\n");
    process.exit(1);
  }

  console.log("✅ [GIT PRE-COMMIT HOOK] Secret scan passed. No secrets detected in staged files.");
}

checkStagedDiff();

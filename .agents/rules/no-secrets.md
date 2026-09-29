# Rule: Strict Secret Isolation & Zero Credential Leaks

## Purpose
Prevent any API keys, access tokens, service role credentials, webhooks, or sensitive secrets from ever being committed to Git or hardcoded in any workspace file.

## Rules
1. **Never Hardcode Secrets**:
   - Never embed actual API keys, database connection strings, JWT tokens (`eyJ...`), service role keys, webhook URLs with tokens, or passwords in ANY code, script, test, scratch file, or documentation.
   - Always load secrets dynamically at runtime from `process.env` or `.env.local`.

2. **Always Use Environment Placeholders in Examples/Docs**:
   - Files like `.env.example`, README, TDS, and TRD must ONLY use placeholder strings (e.g., `your-api-key-here`, `your-service-role-key-here`).

3. **Verify Git Staging Before Commits**:
   - Before executing `git commit` or `git add`, verify that no staged file contains raw credentials or secret patterns.
   - Never stage `.env`, `.env.local`, or any `.env.*.local` file. Ensure `.gitignore` explicitly blocks them.

4. **Self-Correction & Purge**:
   - If a secret is ever accidentally staged or committed locally, it must be amended (`git commit --amend`) or reset immediately before pushing, and the corresponding remote branch force-pushed to ensure no trace exists on GitHub.

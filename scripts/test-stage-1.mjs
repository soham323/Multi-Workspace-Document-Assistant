// scripts/test-stage-1.mjs
// Automated verification script for Stage 1: Database Schema & Supabase Setup
// Reads credentials STRICTLY from .env.local — NEVER hardcode secrets.

import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";

// Helper to load .env.local if not already loaded into process.env
function loadEnvLocal() {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, "utf-8").split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx > 0) {
        const key = trimmed.slice(0, eqIdx).trim();
        const val = trimmed.slice(eqIdx + 1).trim();
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

loadEnvLocal();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment or .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function runStage1Verification() {
  console.log("=== STAGE 1 VERIFICATION START ===\n");

  const tables = [
    { name: "workspaces", taskId: "ST-1-1" },
    { name: "documents", taskId: "ST-1-2" },
    { name: "document_chunks", taskId: "ST-1-3" },
    { name: "tasks", taskId: "ST-1-6" },
    { name: "chat_messages", taskId: "ST-1-7" },
    { name: "tool_calls_log", taskId: "ST-1-8" },
  ];

  let allPassed = true;

  for (const { name, taskId } of tables) {
    const { data, error } = await supabase.from(name).select("*").limit(1);
    if (error) {
      console.error(`❌ [${taskId}] Table '${name}' check failed:`, error.message);
      allPassed = false;
    } else {
      console.log(`✅ [${taskId}] Table '${name}' is active and queryable (Row count: ${data.length})`);
    }
  }

  console.log("\n--- [ST-1-5] Verifying match_workspace_chunks RPC Function ---");
  const dummyEmbedding = new Array(768).fill(0.001);
  const testWorkspaceId = "00000000-0000-0000-0000-000000000000";

  const { data: rpcData, error: rpcError } = await supabase.rpc(
    "match_workspace_chunks",
    {
      query_embedding: dummyEmbedding,
      filter_workspace_id: testWorkspaceId,
      match_threshold: 0.1,
      match_count: 5,
    }
  );

  if (rpcError) {
    console.error("❌ [ST-1-5] RPC match_workspace_chunks error:", rpcError.message);
    allPassed = false;
  } else {
    console.log("✅ [ST-1-5] RPC match_workspace_chunks executed successfully! Return array length:", rpcData.length);
  }

  console.log("\n==================================");
  if (allPassed) {
    console.log("🎉 ALL STAGE 1 CHECKS PASSED!");
  } else {
    console.error("⚠️ SOME CHECKS FAILED.");
    process.exit(1);
  }
}

runStage1Verification();

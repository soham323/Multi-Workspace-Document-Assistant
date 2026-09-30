import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { runIngestionPipeline } from "../lib/ingestion/index";

function loadEnv() {
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

loadEnv();

async function main() {
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const alphaId = "f5c8b97d-986f-4e21-a072-c293cef3a5ac"; // Workspace Alpha
  const betaId = "f1570e1e-ee73-4dd4-8ef7-983afda21abf";  // Workspace Beta

  console.log("Preloading Workspace Alpha with workspace_alpha_artemis.txt...");
  const artemisBuf = fs.readFileSync("demo_data/workspace_alpha_artemis.txt");
  const artemisHash = crypto.createHash("sha256").update(artemisBuf).digest("hex");

  // Check if doc already exists
  const { data: existingA } = await sb
    .from("documents")
    .select("id")
    .eq("workspace_id", alphaId)
    .eq("file_hash", artemisHash)
    .maybeSingle();

  if (existingA) {
    console.log("Workspace Alpha already has document:", existingA.id);
  } else {
    const { data: docA, error: errA } = await sb
      .from("documents")
      .insert({
        workspace_id: alphaId,
        title: "workspace_alpha_artemis.txt",
        file_type: "txt",
        file_hash: artemisHash,
        status: "processing",
        chunk_count: 0,
      })
      .select()
      .single();

    if (errA) {
      console.error("Insert A error:", errA);
    } else {
      const resA = await runIngestionPipeline(
        artemisBuf,
        "txt",
        alphaId,
        docA.id,
        "workspace_alpha_artemis.txt"
      );
      console.log("Workspace Alpha successfully ingested:", resA);
    }
  }

  console.log("Preloading Workspace Beta with workspace_beta_neptune.txt...");
  const neptuneBuf = fs.readFileSync("demo_data/workspace_beta_neptune.txt");
  const neptuneHash = crypto.createHash("sha256").update(neptuneBuf).digest("hex");

  const { data: existingB } = await sb
    .from("documents")
    .select("id")
    .eq("workspace_id", betaId)
    .eq("file_hash", neptuneHash)
    .maybeSingle();

  if (existingB) {
    console.log("Workspace Beta already has document:", existingB.id);
  } else {
    const { data: docB, error: errB } = await sb
      .from("documents")
      .insert({
        workspace_id: betaId,
        title: "workspace_beta_neptune.txt",
        file_type: "txt",
        file_hash: neptuneHash,
        status: "processing",
        chunk_count: 0,
      })
      .select()
      .single();

    if (errB) {
      console.error("Insert B error:", errB);
    } else {
      const resB = await runIngestionPipeline(
        neptuneBuf,
        "txt",
        betaId,
        docB.id,
        "workspace_beta_neptune.txt"
      );
      console.log("Workspace Beta successfully ingested:", resB);
    }
  }

  console.log("All demo workspaces successfully preloaded!");
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});

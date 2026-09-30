// components/documents/UploadZone.tsx
"use client";

import { useState, useRef, type DragEvent, type ChangeEvent } from "react";

interface UploadZoneProps {
  workspaceId: string;
  onUploadSuccess: (newDoc: { id: string; title: string; chunkCount: number }) => void;
}

const MAX_SIZE_MB = 10;
const MAX_BYTES = MAX_SIZE_MB * 1024 * 1024;
const ALLOWED_EXTENSIONS = [".pdf", ".txt", ".docx"];

export default function UploadZone({ workspaceId, onUploadSuccess }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStep, setUploadStep] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      await processUpload(files[0]);
    }
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await processUpload(files[0]);
      // Reset input value so re-selecting same file triggers change
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const validateFile = (file: File): string | null => {
    const nameLower = file.name.toLowerCase();
    const hasValidExt = ALLOWED_EXTENSIONS.some((ext) => nameLower.endsWith(ext));

    if (!hasValidExt) {
      return `Unsupported file format. Please upload PDF, TXT, or DOCX files only.`;
    }

    if (file.size > MAX_BYTES) {
      return `File size (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds the ${MAX_SIZE_MB} MB limit.`;
    }

    return null;
  };

  const processUpload = async (file: File) => {
    setError(null);
    setSuccessMsg(null);

    const validationErr = validateFile(file);
    if (validationErr) {
      setError(validationErr);
      return;
    }

    try {
      setIsUploading(true);
      setUploadStep("Uploading file...");

      const formData = new FormData();
      formData.append("file", file);
      formData.append("workspace_id", workspaceId);

      // Simulate step updates for user feedback during ingestion
      const stepTimer1 = setTimeout(() => {
        setUploadStep("Extracting text and chunking...");
      }, 1200);

      const stepTimer2 = setTimeout(() => {
        setUploadStep("Computing Gemini 768-dim embeddings & indexing in pgvector...");
      }, 2800);

      const res = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);

      const rawText = await res.text();
      let data: Record<string, any> = {};
      try {
        data = rawText ? JSON.parse(rawText) : {};
      } catch {
        data = {};
      }

      if (!res.ok) {
        if (res.status === 409) {
          setError(
            `Duplicate document: "${file.name}" has already been ingested into this workspace. Re-indexing was skipped.`
          );
        } else {
          setError(
            data.error ||
            (rawText && rawText.length < 200 ? rawText : null) ||
            `Upload failed (HTTP ${res.status}). Please check the file and try again.`
          );
        }
        return;
      }

      const chunkCount = data.chunkCount || data.document?.chunk_count || 0;
      setSuccessMsg(`✓ "${file.name}" ingested successfully (${chunkCount} vector chunks created).`);
      onUploadSuccess({
        id: data.documentId || data.document?.id,
        title: data.title || file.name,
        chunkCount,
      });

      // Clear success banner after 6s
      setTimeout(() => setSuccessMsg(null), 6000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Network error during upload.";
      setError(msg);
    } finally {
      setIsUploading(false);
      setUploadStep("");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.txt,.docx,application/pdf,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        onChange={handleFileChange}
        style={{ display: "none" }}
        id="file-upload-input"
        disabled={isUploading}
      />

      {/* Drag & Drop Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        style={{
          border: isDragging
            ? "2px dashed var(--accent-primary)"
            : "2px dashed rgba(255, 255, 255, 0.15)",
          borderRadius: "var(--radius-lg)",
          background: isDragging
            ? "rgba(99, 102, 241, 0.08)"
            : "rgba(15, 23, 42, 0.5)",
          padding: "36px 24px",
          textAlign: "center",
          cursor: isUploading ? "not-allowed" : "pointer",
          transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
          boxShadow: isDragging ? "0 0 25px rgba(99, 102, 241, 0.2)" : "none",
          transform: isDragging ? "scale(1.005)" : "scale(1)",
        }}
      >
        {isUploading ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "14px",
            }}
          >
            <div
              className="spinner"
              style={{ width: "32px", height: "32px", borderWidth: "3px" }}
            />
            <div>
              <p
                style={{
                  fontSize: "15px",
                  fontWeight: "600",
                  color: "var(--text-primary)",
                  marginBottom: "4px",
                }}
              >
                {uploadStep}
              </p>
              <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                Parsing text, computing SHA-256 idempotency hash, and batch embedding into vector store...
              </p>
            </div>
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "12px",
            }}
          >
            {/* Upload Icon */}
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "14px",
                background: "linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.2))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid rgba(99, 102, 241, 0.3)",
              }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#818cf8"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>

            <div>
              <p
                style={{
                  fontSize: "15px",
                  fontWeight: "600",
                  color: "var(--text-primary)",
                  marginBottom: "4px",
                }}
              >
                <span style={{ color: "#818cf8" }}>Click to upload</span> or drag and drop
              </p>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                Supported formats: <strong>PDF</strong>, <strong>TXT</strong>, <strong>DOCX</strong> (up to 10 MB)
              </p>
            </div>

            {/* Badges for supported formats */}
            <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: "600",
                  padding: "3px 8px",
                  borderRadius: "var(--radius-sm)",
                  background: "rgba(239, 68, 68, 0.15)",
                  color: "#f87171",
                  border: "1px solid rgba(239, 68, 68, 0.25)",
                }}
              >
                PDF
              </span>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: "600",
                  padding: "3px 8px",
                  borderRadius: "var(--radius-sm)",
                  background: "rgba(16, 185, 129, 0.15)",
                  color: "#34d399",
                  border: "1px solid rgba(16, 185, 129, 0.25)",
                }}
              >
                TXT
              </span>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: "600",
                  padding: "3px 8px",
                  borderRadius: "var(--radius-sm)",
                  background: "rgba(59, 130, 246, 0.15)",
                  color: "#60a5fa",
                  border: "1px solid rgba(59, 130, 246, 0.25)",
                }}
              >
                DOCX
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div
          className="alert-error"
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            style={{
              background: "transparent",
              border: "none",
              color: "inherit",
              cursor: "pointer",
              padding: "2px",
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Success Message */}
      {successMsg && (
        <div
          className="alert-success"
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span>{successMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMsg(null)}
            style={{
              background: "transparent",
              border: "none",
              color: "inherit",
              cursor: "pointer",
              padding: "2px",
            }}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}

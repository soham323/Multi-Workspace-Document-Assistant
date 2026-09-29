// components/chat/ChatInput.tsx
"use client";

import { useState, useRef, type KeyboardEvent, type FormEvent } from "react";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

const MAX_MESSAGE_LENGTH = 2000;

export default function ChatInput({ onSendMessage, disabled = false }: ChatInputProps) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e?: FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || disabled) return;

    onSendMessage(trimmed);
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter without Shift submits
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    if (val.length <= MAX_MESSAGE_LENGTH) {
      setInput(val);
      // Auto-grow textarea up to 160px
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
        textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
      }
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        gap: "6px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: "10px",
          background: "var(--bg-input)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-lg)",
          padding: "8px 12px",
          transition: "border-color 0.2s ease, box-shadow 0.2s ease",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = "var(--border-focus)";
          e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99, 102, 241, 0.2)";
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = "var(--border-subtle)";
          e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.2)";
        }}
      >
        <textarea
          ref={textareaRef}
          value={input}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question about your workspace documents (e.g. 'Summarize key points', 'What are the main findings?')..."
          disabled={disabled}
          rows={1}
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            outline: "none",
            color: "var(--text-primary)",
            fontSize: "14px",
            resize: "none",
            maxHeight: "160px",
            padding: "6px 4px",
            lineHeight: "1.5",
            fontFamily: "inherit",
          }}
        />

        <button
          type="submit"
          disabled={disabled || !input.trim()}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "36px",
            height: "36px",
            borderRadius: "10px",
            background: disabled || !input.trim()
              ? "rgba(255, 255, 255, 0.08)"
              : "var(--accent-gradient)",
            border: "none",
            color: "#ffffff",
            cursor: disabled || !input.trim() ? "not-allowed" : "pointer",
            flexShrink: 0,
            transition: "all 0.2s ease",
            boxShadow: disabled || !input.trim() ? "none" : "var(--shadow-glow)",
          }}
          title={disabled ? "Generating answer..." : "Send question (Enter)"}
        >
          {disabled ? (
            <div className="spinner" style={{ width: "16px", height: "16px", borderWidth: "2px" }} />
          ) : (
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
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          )}
        </button>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0 6px",
          fontSize: "11px",
          color: "var(--text-muted)",
        }}
      >
        <span>Press <strong>Enter</strong> to send, <strong>Shift + Enter</strong> for new line</span>
        <span>{input.length} / {MAX_MESSAGE_LENGTH}</span>
      </div>
    </form>
  );
}

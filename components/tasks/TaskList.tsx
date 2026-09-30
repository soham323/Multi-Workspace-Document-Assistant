// components/tasks/TaskList.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import type { Task, TaskPriority } from "@/types/app";

interface TaskListProps {
  workspaceId: string;
  refreshTrigger?: number;
}

export default function TaskList({ workspaceId, refreshTrigger = 0 }: TaskListProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/tasks?workspaceId=${encodeURIComponent(workspaceId)}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch workspace tasks.");
      }

      setTasks(data.tasks || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load tasks.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    if (workspaceId) {
      fetchTasks();
    }
  }, [workspaceId, refreshTrigger, fetchTasks]);

  const handleToggleStatus = async (task: Task) => {
    const newStatus = task.status === "done" ? "todo" : "done";
    setUpdatingId(task.id);

    try {
      const res = await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: task.id,
          workspaceId,
          status: newStatus,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update task status.");
      }

      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t))
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error updating task.";
      setError(msg);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      const res = await fetch(
        `/api/tasks?id=${encodeURIComponent(taskId)}&workspaceId=${encodeURIComponent(workspaceId)}`,
        { method: "DELETE" }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete task.");
      }

      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error deleting task.";
      setError(msg);
    }
  };

  const getPriorityBadge = (priority: TaskPriority) => {
    switch (priority) {
      case "critical":
        return { bg: "rgba(239, 68, 68, 0.15)", color: "#f87171", border: "1px solid rgba(239, 68, 68, 0.3)" };
      case "high":
        return { bg: "rgba(245, 158, 11, 0.15)", color: "#fbbf24", border: "1px solid rgba(245, 158, 11, 0.3)" };
      case "low":
        return { bg: "rgba(100, 116, 139, 0.15)", color: "#94a3b8", border: "1px solid rgba(100, 116, 139, 0.3)" };
      default:
        return { bg: "rgba(99, 102, 241, 0.15)", color: "#818cf8", border: "1px solid rgba(99, 102, 241, 0.3)" };
    }
  };

  return (
    <div
      className="glass-panel"
      style={{
        padding: "24px",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingBottom: "12px",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              background: "rgba(99, 102, 241, 0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid rgba(99, 102, 241, 0.3)",
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#818cf8"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="9 11 12 14 22 4" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
          </div>
          <div>
            <h4 style={{ fontSize: "16px", fontWeight: "700", color: "var(--text-primary)" }}>
              Workspace Tasks
            </h4>
            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              Auto-created by AI tool calling (`save_workspace_task`)
            </span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span
            style={{
              fontSize: "11px",
              fontWeight: "600",
              padding: "2px 8px",
              borderRadius: "var(--radius-full)",
              background: "rgba(255, 255, 255, 0.08)",
              color: "var(--text-secondary)",
            }}
          >
            {tasks.length} {tasks.length === 1 ? "task" : "tasks"}
          </span>

          <button
            type="button"
            onClick={fetchTasks}
            disabled={loading}
            className="btn-secondary"
            style={{ padding: "4px 8px", fontSize: "11px" }}
            title="Refresh tasks"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ animation: loading ? "spin 1s linear infinite" : "none" }}
            >
              <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
            </svg>
          </button>
        </div>
      </div>

      {error && <div className="alert-error" style={{ fontSize: "12px" }}>{error}</div>}

      {/* Loading Skeletons */}
      {loading && tasks.length === 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {[1, 2].map((i) => (
            <div
              key={i}
              className="glass-panel"
              style={{ height: "54px", animation: "pulse 1.5s infinite" }}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && tasks.length === 0 && (
        <div
          style={{
            padding: "28px 16px",
            textAlign: "center",
            background: "rgba(15, 23, 42, 0.3)",
            borderRadius: "var(--radius-md)",
            border: "1px dashed var(--border-subtle)",
          }}
        >
          <p style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-primary)", marginBottom: "4px" }}>
            No tasks created yet
          </p>
          <p style={{ fontSize: "12px", color: "var(--text-muted)", maxWidth: "340px", margin: "0 auto" }}>
            Ask the assistant in chat: <em>&ldquo;Extract the action items from my document and save them as tasks&rdquo;</em> to see them appear here.
          </p>
        </div>
      )}

      {/* Task List */}
      {tasks.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "300px", overflowY: "auto" }}>
          {tasks.map((task) => {
            const isDone = task.status === "done";
            const badge = getPriorityBadge(task.priority);

            return (
              <div
                key={task.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 14px",
                  borderRadius: "var(--radius-md)",
                  background: isDone ? "rgba(16, 185, 129, 0.05)" : "rgba(15, 23, 42, 0.5)",
                  border: isDone ? "1px solid rgba(16, 185, 129, 0.2)" : "1px solid var(--border-subtle)",
                  transition: "all 0.2s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1, minWidth: 0 }}>
                  {/* Status Toggle Checkbox */}
                  <input
                    type="checkbox"
                    checked={isDone}
                    disabled={updatingId === task.id}
                    onChange={() => handleToggleStatus(task)}
                    style={{
                      width: "16px",
                      height: "16px",
                      cursor: "pointer",
                      accentColor: "#10b981",
                    }}
                  />

                  <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                    <span
                      style={{
                        fontSize: "13px",
                        fontWeight: "600",
                        color: isDone ? "var(--text-muted)" : "var(--text-primary)",
                        textDecoration: isDone ? "line-through" : "none",
                        wordBreak: "break-word",
                      }}
                    >
                      {task.title}
                    </span>
                    {task.description && (
                      <span
                        style={{
                          fontSize: "11px",
                          color: "var(--text-muted)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {task.description}
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                  <span
                    style={{
                      fontSize: "10px",
                      fontWeight: "700",
                      padding: "2px 6px",
                      borderRadius: "var(--radius-sm)",
                      background: badge.bg,
                      color: badge.color,
                      border: badge.border,
                      textTransform: "uppercase",
                    }}
                  >
                    {task.priority}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleDeleteTask(task.id)}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "var(--text-muted)",
                      cursor: "pointer",
                      padding: "2px",
                      fontSize: "14px",
                    }}
                    title="Delete task"
                  >
                    ✕
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

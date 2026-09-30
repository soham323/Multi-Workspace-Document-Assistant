// context/WorkspaceContext.tsx
"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { Workspace } from "@/types/app";

const STORAGE_KEY = "docuassistant_active_workspace_id";

interface WorkspaceContextType {
  workspaces: Workspace[];
  activeWorkspace: Workspace | null;
  loading: boolean;
  error: string | null;
  setActiveWorkspace: (workspace: Workspace) => void;
  createWorkspace: (name: string) => Promise<Workspace>;
  refreshWorkspaces: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspace, setActiveWorkspaceState] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const setActiveWorkspace = useCallback((workspace: Workspace) => {
    setActiveWorkspaceState(workspace);
    try {
      localStorage.setItem(STORAGE_KEY, workspace.id);
    } catch {
      // localStorage may fail in restricted environments
    }
  }, []);

  const refreshWorkspaces = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch("/api/workspaces");
      if (!res.ok) {
        throw new Error("Failed to load workspaces.");
      }
      const data = await res.json();
      const list: Workspace[] = data.workspaces ?? [];
      setWorkspaces(list);

      if (list.length === 0) {
        setActiveWorkspaceState(null);
        return;
      }

      // Check saved ID in localStorage
      let savedId: string | null = null;
      try {
        savedId = localStorage.getItem(STORAGE_KEY);
      } catch {}

      const found = list.find((w) => w.id === savedId);
      if (found) {
        setActiveWorkspaceState(found);
      } else {
        // Default to newest / first workspace
        setActiveWorkspace(list[0]);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error fetching workspaces";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [setActiveWorkspace]);

  useEffect(() => {
    refreshWorkspaces();
  }, [refreshWorkspaces]);

  const createWorkspace = async (name: string): Promise<Workspace> => {
    setError(null);
    const res = await fetch("/api/workspaces", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to create workspace.");
    }

    const created: Workspace = data.workspace;
    setWorkspaces((prev) => [created, ...prev]);
    setActiveWorkspace(created);
    return created;
  };

  return (
    <WorkspaceContext.Provider
      value={{
        workspaces,
        activeWorkspace,
        loading,
        error,
        setActiveWorkspace,
        createWorkspace,
        refreshWorkspaces,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace(): WorkspaceContextType {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return context;
}

// lib/tools/registry.ts
// Tool registry — maps tool names to their Zod schemas and handlers.
// Adding a new tool = adding one entry here. The tool loop requires zero changes.

// TODO: Stage 6 — register tools after handlers and schemas are implemented
export const TOOL_REGISTRY: Record<
  string,
  {
    schema: unknown;
    handler: (args: unknown, workspaceId: string) => Promise<Record<string, unknown>>;
  }
> = {};

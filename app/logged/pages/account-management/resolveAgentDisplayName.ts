/** Row from GET /api/v1/agents (maps agents_db.agent_id → agent_name as `name`). */
export type AgentListItem = { id_agent?: string; name?: string };

export function buildAgentIdToNameMap(agents: AgentListItem[]): Map<string, string> {
  const m = new Map<string, string>();
  for (const a of agents ?? []) {
    const id = String(a?.id_agent ?? "").trim();
    const name = String(a?.name ?? "").trim();
    if (id) m.set(id, name || id);
  }
  return m;
}

/** Resolves `agent_id` stored on proposal/contract rows to `agent_name` when present in the map. */
export function resolveAgentDisplayName(
  agentIdFromRow: string | undefined | null,
  map: ReadonlyMap<string, string>
): string {
  const id = String(agentIdFromRow ?? "").trim();
  if (!id) return "—";
  return map.get(id) ?? id;
}

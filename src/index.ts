// Placeholder typed entry — matches the convention of other agent extension
// packages in `extensions/cinatra-ai/*-agent/src/index.ts` (the agent runtime
// is OAS-driven; this file exists for `main`/`types` resolution and is not
// imported at runtime).
export const apolloProspectingAgent = {
  packageName: "@cinatra-ai/apollo-prospecting-agent",
  apiVersion: "cinatra.ai/v1",
  kind: "agent" as const,
};

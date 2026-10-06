#!/usr/bin/env node
// MCP server for the CallChatSyn API (https://callchatsyn.com/developers).
// Gives an AI assistant three tools backed by one small business's own data:
// answer a customer question, list open appointment times, book a time.
// Configure with CALLCHATSYN_API_KEY (a ccs_live_… key from Dashboard > Developers).
// Without one it uses the public demo key: answers come from a demo business
// and bookings are dry runs.
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { TOOLS } from "./tools.js";

const BASE = process.env.CALLCHATSYN_BASE_URL ?? "https://callchatsyn.com";
const DEMO_KEY = "ccs_demo_public";
const KEY = process.env.CALLCHATSYN_API_KEY || DEMO_KEY;

type Json = Record<string, unknown>;

async function call(path: string, init: { method?: string; body?: Json } = {}): Promise<{ ok: boolean; status: number; data: Json }> {
  if (!KEY.startsWith("ccs_live_") && KEY !== DEMO_KEY) {
    return { ok: false, status: 401, data: { error: { code: "unauthorized", message: "Set CALLCHATSYN_API_KEY to a ccs_live_… key (Dashboard > Developers)." } } };
  }
  const res = await fetch(`${BASE}${path}`, {
    method: init.method ?? "GET",
    headers: { Authorization: `Bearer ${KEY}`, ...(init.body ? { "Content-Type": "application/json" } : {}) },
    body: init.body ? JSON.stringify(init.body) : undefined,
  });
  const data = (await res.json().catch(() => ({}))) as Json;
  return { ok: res.ok, status: res.status, data };
}

const asText = (r: { ok: boolean; status: number; data: Json }) => ({
  content: [{ type: "text" as const, text: JSON.stringify(r.data) }],
  isError: !r.ok,
});

const server = new McpServer({ name: "callchatsyn", version: "0.3.0" });

server.registerTool("answer_customer_question", TOOLS.answer_customer_question, async ({ message }) =>
  asText(await call("/api/v1/answer", { method: "POST", body: { message } })),
);

server.registerTool("list_open_times", TOOLS.list_open_times, async ({ lang }) =>
  asText(await call(`/api/v1/slots${lang ? `?lang=${lang}` : ""}`)),
);

server.registerTool("book_appointment", TOOLS.book_appointment, async (args) =>
  asText(await call("/api/v1/bookings", { method: "POST", body: args })),
);

server.registerTool("cancel_appointment", TOOLS.cancel_appointment, async ({ id }) =>
  asText(await call(`/api/v1/bookings/${encodeURIComponent(id)}`, { method: "DELETE" })),
);

await server.connect(new StdioServerTransport());

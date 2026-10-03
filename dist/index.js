#!/usr/bin/env node
// MCP server for the CallChatSyn API (https://callchatsyn.com/developers).
// Gives an AI assistant three tools backed by one small business's own data:
// answer a customer question, list open appointment times, book a time.
// Configure with CALLCHATSYN_API_KEY (a ccs_live_… key from Dashboard > Developers).
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
const BASE = process.env.CALLCHATSYN_BASE_URL ?? "https://callchatsyn.com";
const KEY = process.env.CALLCHATSYN_API_KEY ?? "";
async function call(path, init = {}) {
    if (!KEY.startsWith("ccs_live_")) {
        return { ok: false, status: 401, data: { error: { code: "unauthorized", message: "Set CALLCHATSYN_API_KEY to a ccs_live_… key (Dashboard > Developers)." } } };
    }
    const res = await fetch(`${BASE}${path}`, {
        method: init.method ?? "GET",
        headers: { Authorization: `Bearer ${KEY}`, ...(init.body ? { "Content-Type": "application/json" } : {}) },
        body: init.body ? JSON.stringify(init.body) : undefined,
    });
    const data = (await res.json().catch(() => ({})));
    return { ok: res.ok, status: res.status, data };
}
const asText = (r) => ({
    content: [{ type: "text", text: JSON.stringify(r.data) }],
    isError: !r.ok,
});
const server = new McpServer({ name: "callchatsyn", version: "0.1.0" });
server.registerTool("answer_customer_question", {
    title: "Answer a customer question",
    description: "Answer a customer's message using the business's own FAQs and order data (English or Chinese). Returns intent (faq, order_status, appointment, human_handoff), the reply, and matched=false when no FAQ fit.",
    inputSchema: { message: z.string().min(1).max(2000).describe("The customer's message, as written") },
}, async ({ message }) => asText(await call("/api/v1/answer", { method: "POST", body: { message } })));
server.registerTool("list_open_times", {
    title: "List open appointment times",
    description: "List the next open appointment times (labels in the business's time zone), plus its services and locations.",
    inputSchema: { lang: z.enum(["en", "zh"]).optional().describe("Label language") },
}, async ({ lang }) => asText(await call(`/api/v1/slots${lang ? `?lang=${lang}` : ""}`)));
server.registerTool("book_appointment", {
    title: "Book an appointment",
    description: "Book one of the open times from list_open_times. Needs the exact 'start' value, a service, and the customer's email or phone. Confirm details with the customer before calling.",
    inputSchema: {
        start: z.string().describe("A 'start' value returned by list_open_times"),
        service: z.string().min(1).describe("One of the business's services"),
        name: z.string().optional(),
        email: z.string().optional(),
        phone: z.string().optional(),
        remarks: z.string().max(500).optional(),
    },
}, async (args) => asText(await call("/api/v1/bookings", { method: "POST", body: args })));
await server.connect(new StdioServerTransport());

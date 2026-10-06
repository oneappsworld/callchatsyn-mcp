import { z } from "zod";
// Tool definitions shared by the remote MCP server (/api/mcp) and the
// callchatsyn-mcp npm/stdio server (keep the copy in that repo identical).
// Descriptions say what each tool changes, when to use it, and what it returns,
// because MCP clients (and directory scorers like Glama) rely on them.
export const TOOLS = {
    answer_customer_question: {
        title: "Answer a customer question",
        description: "Answer a customer's message for one small business using only that business's own FAQs and order records. " +
            "Rule-based, not generated, so it never invents prices or opening hours; English and Chinese are detected automatically. " +
            "Read-only: it never books or changes anything. Use it first for any customer message. " +
            "If it returns intent 'appointment', call list_open_times next; if matched is false or intent is 'human_handoff', tell the customer a person will follow up. " +
            "Authenticates with the connection's API key (Authorization: Bearer ccs_live_…); without a key it answers as a public demo business. " +
            "Returns JSON { intent, lang, matched, reply, next? }.",
        inputSchema: {
            message: z
                .string()
                .min(1)
                .max(2000)
                .describe("The customer's message exactly as they wrote it (1-2,000 characters, English or Chinese). Don't rephrase or translate it."),
        },
        annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
    },
    list_open_times: {
        title: "List open appointment times",
        description: "List the business's next open appointment times: up to 5, soonest first, within the next 7 days, labelled in the business's time zone, plus its services and locations. " +
            "Read-only. Call it before book_appointment and whenever a customer asks when they can come in. " +
            "Times come from the business's CallChatSyn hours or from its connected Cal.com calendar. " +
            "Returns JSON { slots: [{ start, label }], services, locations }; pass a slot's 'start' to book_appointment unchanged. An empty slots list means nothing is open this week.",
        inputSchema: {
            lang: z.enum(["en", "zh"]).optional().describe("Language of the human-readable labels: 'en' (default) or 'zh'. Times themselves are always ISO 8601 UTC."),
        },
        annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
    },
    book_appointment: {
        title: "Book an appointment",
        description: "Book one appointment for a customer. This creates a real booking: the business is notified, and if it has connected Cal.com the booking is created there too. " +
            "With the demo key it's a dry run that books nothing. Not idempotent: booking the same time twice fails the second time. " +
            "Only call it after the customer has confirmed the time and service; needs a 'start' from list_open_times and the customer's email or phone. " +
            "Errors: 404 the time is no longer offered (call list_open_times again), 409 it was just taken, 400 missing start, service, or both email and phone. " +
            "Returns JSON { booked, start, label }.",
        inputSchema: {
            start: z.string().describe("The exact 'start' value returned by list_open_times (ISO 8601 UTC), unchanged."),
            service: z.string().min(1).describe("What the customer is booking; use one of the 'services' returned by list_open_times."),
            name: z.string().optional().describe("The customer's name as they gave it; shown to the business."),
            email: z.string().optional().describe("The customer's email. Give email or phone (at least one is required)."),
            phone: z.string().optional().describe("The customer's phone in international format, e.g. +6591234567. Give email or phone (at least one is required)."),
            remarks: z.string().max(500).optional().describe("Optional note for the business, up to 500 characters (e.g. 'first visit')."),
        },
        annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
    },
};

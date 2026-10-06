# CallChatSyn MCP server

Let an AI assistant (Claude, Cursor, any MCP client) answer customer questions and book appointments for a small business, using that business's own FAQs and opening hours on [CallChatSyn](https://callchatsyn.com/developers).

**Free for the first 1,000 businesses** (founder offer: 100 API calls a day, 2,000 a month).

## Tools
| Tool | Changes data? | What it does |
|---|---|---|
| `answer_customer_question` | No (read-only) | Answers from the business's FAQs and order data (English/Chinese); flags booking and "talk to a person" requests |
| `list_open_times` | No (read-only) | Next open times (up to 5, next 7 days) in the business's time zone, plus services and locations; from CallChatSyn hours or the business's connected Cal.com |
| `book_appointment` | Yes, creates a booking | Books one of those times and returns its `id`; the business is notified and, with Cal.com connected, the booking is created there. Not idempotent. Demo key = dry run |
| `cancel_appointment` | Yes, cancels a booking | Cancels a booking by `id` (also in Cal.com if connected). To reschedule: cancel, then book a new time. Demo key = dry run |

## Remote server (nothing to install)
Add this URL as a custom connector (Claude: Settings → Connectors → Add custom connector; Cursor and others: a Streamable HTTP server):

```
https://callchatsyn.com/api/mcp
```

Without a key it uses the demo business. To act for your own business, send the header `Authorization: Bearer ccs_live_...`. Also listed in the official MCP Registry as `com.callchatsyn/callchatsyn`.

## Local setup (npx)
1. Create a CallChatSyn account, add FAQs and opening hours, then Dashboard → Developers → claim founder access → create an API key.
2. Add to your MCP client config:

```json
{
  "mcpServers": {
    "callchatsyn": {
      "command": "npx",
      "args": ["-y", "github:oneappsworld/callchatsyn-mcp"],
      "env": { "CALLCHATSYN_API_KEY": "ccs_live_..." }
    }
  }
}
```

Keep the key private; it acts for one business.

No key yet? Leave `CALLCHATSYN_API_KEY` out and the server uses the public demo key (`ccs_demo_public`): answers come from a demo business and bookings are dry runs, so you can try every tool before signing up.

## Notes
- Answers are rule-based FAQ matching (fast, predictable), not free-form generation.
- API docs and OpenAPI spec: https://callchatsyn.com/developers · https://callchatsyn.com/openapi.json

MIT licensed.

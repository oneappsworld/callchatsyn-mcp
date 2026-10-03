# CallChatSyn MCP server

Let an AI assistant (Claude, Cursor, any MCP client) answer customer questions and book appointments for a small business, using that business's own FAQs and opening hours on [CallChatSyn](https://callchatsyn.com/developers).

**Free for the first 1,000 businesses** (founder offer: 100 API calls a day, 2,000 a month).

## Tools
| Tool | What it does |
|---|---|
| `answer_customer_question` | Answers from the business's FAQs and order data (English/Chinese); flags booking and "talk to a person" requests |
| `list_open_times` | Next open appointment times in the business's time zone, plus services and locations |
| `book_appointment` | Books one of those times (only offered times; the business is notified) |

## Setup
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

## Notes
- Answers are rule-based FAQ matching (fast, predictable), not free-form generation.
- API docs and OpenAPI spec: https://callchatsyn.com/developers · https://callchatsyn.com/openapi.json

MIT licensed.

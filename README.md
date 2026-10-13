# inbox-agent-ts

**Live demo:** https://markusisaksson1982.github.io/showcases/inbox-agent-ts/

Background agent that turns email/CRM events into action.

What it does:

- Ingests email/CRM events from `data/events.json`
- Builds typed knowledge-graph memory of people, companies, and deal stages
- Runs a follow-up planner for reply / nudge / meeting prep, deduplicated and prioritised

Files:

- `src/types.ts` – event, graph, and task types
- `src/memory.ts` – in-memory knowledge graph
- `src/agent.ts` – ingestion + planner
- `test/*.test.ts` – deterministic unit tests
- `data/events.json` – sample events
- `index.html` – minimal demo view

Run:

```text
npm install
npm test
npm run build
python3 -m http.server
```

`npm test` runs `tsc --strict` plus `node --test`.

Design notes:

- Strict types throughout, no implicit any.
- Deterministic planner: rules decide what to do next, so an LLM can later draft the messages but never decides silently.
- Graph memory without a database dependency, with a shape that can be swapped for Neo4j.

Next steps:

- Neo4j adapter
- LLM-drafted replies validated against the graph
- Schedule runner for periodic planning

Built by Markus Isaksson's night queue with Grok Bot.

# Commands

- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run check` — type-check (runs `svelte-kit sync` first; `.svelte-kit/tsconfig.json` must exist)
- `npm run lint` — Prettier format check
- `npm run format` — Prettier write (auto-fix)

**Order that matters:** `build` does not run `check` first. Run `check` before pushing.

No test suite exists in this repo. Do not guess test commands.

# Stack

- **Svelte 5** (runes: `$props()`, `$derived()`, `{@render ...}`, `$state()`, `$effect()`)
- **SvelteKit 2** (`adapter-auto` → deploys to Vercel)
- **TypeScript** with `strict: true`
- **Vite 6**

# Project structure

```
src/
  lib/             # shared utilities, $lib alias
  routes/          # SvelteKit pages
    components/    # route-specific shared components
    tools/         # /tools route + subtools
    blog/          # /blog + posts
    art/           # /art + art pieces
  components/      # site-wide shared components (rare, prefer route-level)
static/            # static assets (fonts, OG images, global CSS)
docs/              # feature specs (see below)
```

- `src/routes/components/` is for components shared across routes.
- `src/components/` is for truly global components (currently just `SocialHeaders.svelte`).

# Styling conventions

- Global styles: `static/globalStyles.css` (linked in `app.html`)
- Component styles: scoped `<style>` blocks in `.svelte` files
- CSS custom properties for theming defined in `+layout.svelte`
- Icons: `@iconify/svelte` with `mdi:` prefix (Material Design Icons)

# Prettier config (non-default)

```json
{
  "useTabs": true,
  "singleQuote": true,
  "trailingComma": "none",
  "printWidth": 100,
  "plugins": ["prettier-plugin-svelte"]
}
```

- Indent with **tabs**, not spaces
- No trailing commas
- 100-char line width (not 80)

# Svelte 5 gotchas

- Route components receive `{ children }` via `$props()`, not `export let data`
- Use `{@render children()}` in layouts, not `<slot />`
- `on:click` → `onclick`, `on:input` → `oninput` (lowercase event handlers)

# Feature documentation pattern

Every new user-facing feature or document type gets its own folder under `docs/`, created **before** implementation starts:

```
docs/<feature>/
  user-spec.md  # initial raw spec given by the user
  spec.md       # scope, user flow, fields, in/out of scope (generated after a grill-me session)
  decisions.md  # design decisions + why; append-only
  tasks.md      # implementation checklist
```

See `docs/airline-print/` for the canonical example.

Rules:

- Before writing code for a new feature, draft `spec.md` and confirm scope with the user.
- Whenever a non-obvious design call is made (visual direction, state model, library choice, layout/print tradeoffs, anything a future contributor would otherwise re-derive), add an entry to `decisions.md`. Each entry: the decision, then **Why:**. Don't edit historical entries — supersede them with a new one.
- Tick items in `tasks.md` as they ship. Keep ticked items in the file as a record.
- If scope changes mid-build, update `spec.md` and add a `decisions.md` entry explaining the change.

# Print-specific patterns (airline-print)

- PDF via `window.print()` + `@media print` CSS — no PDF library
- Hide nav/form in `@media print`; show only the ticket preview
- Logo uploads: `FileReader` → canvas resize (max 200px) → PNG data URL; SVGs bypass canvas
- localStorage key: `airline-print-booking`, debounced auto-save (300ms), auto-restore on mount

# Skills

This repo has `grill-me` installed. Use it before coding a new feature to stress-test the plan.

# Feature documentation pattern

Every new user-facing feature or document type gets its own folder under `docs/`, created **before** implementation starts:

```
docs/<feature>/
  user-spec.md  # initial raw spec given by the user
  spec.md       # scope, user flow, fields, in/out of scope (generated after a grill-me session)
  decisions.md  # design decisions + why; append-only
  tasks.md      # implementation checklist
```

See [docs/hotel-reservation/](docs/hotel-reservation/) for the canonical example and [docs/README.md](docs/README.md) for the conventions.

Rules:

- Before writing code for a new feature, draft `spec.md` and confirm scope with the user.
- Whenever a non-obvious design call is made (visual direction, state model, library choice, layout/print tradeoffs, anything a future contributor would otherwise re-derive), add an entry to `decisions.md`. Each entry: the decision, then **Why:**. Don't edit historical entries — supersede them with a new one.
- Tick items in `tasks.md` as they ship. Keep ticked items in the file as a record.
- If scope changes mid-build, update `spec.md` and add a `decisions.md` entry explaining the change.

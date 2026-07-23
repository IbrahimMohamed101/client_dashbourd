# Premium Meals frontend audit

Frontend route ownership: `/premium-meals`.

Verified backend resources:

- `GET /api/dashboard/premium-upgrades`
- `GET /api/dashboard/premium-upgrades/readiness`
- `GET /api/dashboard/premium-upgrades/sources`
- `GET /api/dashboard/premium-upgrades/:id`
- `POST /api/dashboard/premium-upgrades`
- `PATCH /api/dashboard/premium-upgrades/:id`
- `POST /api/dashboard/premium-upgrades/:id/archive`

Canonical relink payload:

```json
{
  "expectedRevision": 4,
  "kind": "option",
  "sourceId": "optionId"
}
```

The frontend must not submit relation display metadata during relink. The backend derives and validates option relation context from `kind + sourceId`.

List, readiness, source, detail, and builder premium caches are invalidated together and active queries are awaited before success feedback and dialog close.

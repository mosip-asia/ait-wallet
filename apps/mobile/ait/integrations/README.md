# `ait/integrations/`

Boundaries to AIT's backend / issuer, behind interfaces (repository pattern), so
features depend on a contract — not on raw `fetch` calls. Endpoints come from
`ait/config/runtimeConfig`.

Placeholder for now. Credential issuance/verification/storage themselves are
reused from Inji (thin-client, Directive #7); this layer only brokers
AIT-specific requests.

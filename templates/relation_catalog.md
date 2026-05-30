# Relation Catalog

Status: draft  
Owner Agent: topos_domain_architect  
Last Verified: not yet

| Relation | From | To | Is relation object? | Fields/state | Owner service | Notes |
|---|---|---|---|---|---|---|
| TODO | TODO | TODO | yes/no | TODO | TODO | TODO |

## Forbidden relations

| Forbidden edge | Why forbidden | Correct API path |
|---|---|---|
| frontend -> trusted userId | userId can be forged | frontend sends userToken; router resolves userId |
| service A -> service B tables | breaks microservice boundary | service A calls service B public API |

# API Registry

Status: draft  
Owner Agent: api_contract_alignment  
Last Verified: not yet

| API | Query/Command | Frontend request | Router transform | Backend message/request | Response | Failure | Permission | Frontend path | Backend path | Status |
|---|---|---|---|---|---|---|---|---|---|---|
| TODO | query/command | TODO | TODO | TODO | TODO | TODO | TODO | TODO | TODO | draft |

## API rules

- Frontend and backend fields must be aligned through this registry.
- If frontend sends `userToken`, router resolves it to trusted `userId`.
- Backend business API must not trust frontend-provided `userId`.
- Query should not change the world; command may change the world.

# AI Boundary Forbidden Dependencies

Status: draft  
Owner Agent: boundary_checker  
Last Verified: 2026-05-30

- Must not be imported by React components.
- Must not expose provider keys to frontend request/response payloads.
- Must not depend on task history tables directly.
- Must not persist reports; daily summaries service owns persistence.

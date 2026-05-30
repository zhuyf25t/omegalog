# Task History Forbidden Dependencies

Status: draft  
Owner Agent: boundary_checker  
Last Verified: 2026-05-30

- Must not import React components.
- Must not write task files directly.
- Must not call DeepSeek or own summary prompt logic.
- Must not expose `FileSystemFileHandle` outside the local adapter.

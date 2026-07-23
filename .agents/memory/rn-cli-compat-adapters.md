---
name: React Native CLI compatibility adapters
description: Preserve the imported screen surface while replacing Expo runtime modules with platform-specific React Native CLI adapters.
---

Use local platform-specific adapters when legacy screen imports must remain unchanged during a React Native CLI migration. Resolve them through Metro and webpack aliases, and keep native implementations backed by installed CLI modules rather than retaining the Expo runtime.

**Why:** The project has a large existing screen surface and its UI must not be redesigned during migration; changing every import would add unnecessary regression risk.

**How to apply:** When adding a new native capability, add the CLI dependency and adapter together, provide a web implementation where needed, and verify both TypeScript resolution and the webpack/native bundlers.
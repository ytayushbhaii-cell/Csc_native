---
name: Mobile background-removal safety
description: Memory and latency constraints for browser-based background removal on Android and iOS.
---

Mobile browsers have a much smaller tab memory budget than desktop browsers. Large ONNX sessions plus full-resolution RGBA buffers and synchronous multi-pass alpha matting can terminate the tab with an “Aw, Snap!” crash before the app can show an error.

**Why:** The model file size alone is misleading; ORT WASM can allocate a much larger runtime heap, and CPU post-processing multiplies memory and JS-thread time with each image dimension.

**How to apply:** On mobile web, route only to the compact U2Net model, cap the working image at 1024px on the long side, skip BEN2 and multi-pass CPU matting, avoid asynchronous debug mask PNG/data-URL snapshots, and keep a bounded timeout. Desktop/native paths may retain larger models and richer refinement when resources allow.
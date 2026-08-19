# Walkthrough - Shelby CDN Explorer

We have audited and remediated the **Shelby CDN Explorer**, a decentralized asset explorer and developer portal built on Next.js (App Router), Tailwind CSS, Framer Motion, and the official `@shelby-protocol/sdk` and `@aptos-labs/ts-sdk`.

## Key Features & Remediation Summary

1. **Header & Navigation ([components/Header.tsx](file:///home/gamp/web3/shely-cdn-explorer/components/Header.tsx))**:
   - Dark theme UI with neon cyan & indigo radial glows.
   - Network indicator badge and quick feature pills (Sub-second latency, Ephemeral signer, Edge CDN).
   - Real Aptos wallet connector with sandbox session indicator.

2. **Drag & Drop Upload Zone ([components/UploadSection.tsx](file:///home/gamp/web3/shely-cdn-explorer/components/UploadSection.tsx))**:
   - Drag-and-drop dropzone with animated hover states and file picker fallback.
   - Strict MIME-type validation for Images (PNG, JPG, WebP, GIF, SVG), Videos (MP4, WebM), and PDFs up to 50MB.
   - Fixed Object URL memory leak with lifecycle cleanup (`URL.revokeObjectURL`).
   - Mode Toggle: **Browser SDK (Direct)** vs. **Node API Route (Secure)**.
   - Clean error propagation and feedback.

3. **Asset Dashboard & Previews ([components/AssetDashboard.tsx](file:///home/gamp/web3/shely-cdn-explorer/components/AssetDashboard.tsx))**:
   - **Rich Previews**: Native Image lightboxing with keyboard Escape listener, HTML5 Video player controls, and PDF viewer options.
   - **Public CDN URL**: Single-click URL copy with copy-state toast feedback.
   - **Performance Metrics**: Breakdown of ArrayBuffer Read, Signer Generation, Network Latency, and Total Duration.
   - **Storage Metadata**: Blob Name, Signer Address, Expiration Date (30 Days), and Timestamp.
   - **Developer Snippet Generator**: Multi-tab code snippets (React Client, Node.js API Route, Aptos SDK, cURL) updated to match current SDK API signatures.

4. **Secure Server API Routes**:
   - [app/api/upload/route.ts](file:///home/gamp/web3/shely-cdn-explorer/app/api/upload/route.ts): Server-side uploads using `ShelbyNodeClient` with strict sanitization and error handling.
   - [app/api/blob/route.ts](file:///home/gamp/web3/shely-cdn-explorer/app/api/blob/route.ts): Edge proxy stream with AccountAddress validation and edge caching fallback.
   - [app/api/cdn/[...blobPath]/route.ts](file:///home/gamp/web3/shely-cdn-explorer/app/api/cdn/%5B...blobPath%5D/route.ts): High-availability CDN edge delivery with safe directory traversal protection.

5. **Manual Blob Lookup & Local History**:
   - [components/ManualLookup.tsx](file:///home/gamp/web3/shely-cdn-explorer/components/ManualLookup.tsx) for looking up existing blobs with real edge verification.
   - [components/RecentUploads.tsx](file:///home/gamp/web3/shely-cdn-explorer/components/RecentUploads.tsx) storing session history without leaking expired blob URLs.

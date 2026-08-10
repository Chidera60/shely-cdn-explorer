# Walkthrough - Shelby CDN Explorer

We have built the **Shelby CDN Explorer**, a decentralized asset explorer and developer portal built on Next.js (App Router), Tailwind CSS, Framer Motion, and the official `@shelby-protocol/sdk` and `@aptos-labs/ts-sdk`.

## Key Features Implemented

1. **Header & Navigation ([components/Header.tsx](file:///home/fawaz/Documents/code/shely-cdn-explorer/components/Header.tsx))**:
   - Sleek dark theme UI with neon cyan & indigo radial glows.
   - Active `MAINNET` network indicator badge and quick feature pills (Sub-second latency, Ephemeral signer, Edge CDN).

2. **Drag & Drop Upload Zone ([components/UploadSection.tsx](file:///home/fawaz/Documents/code/shely-cdn-explorer/components/UploadSection.tsx))**:
   - Drag-and-drop dropzone with animated hover states and file picker fallback.
   - Strict MIME-type validation for Images (PNG, JPG, WebP, GIF, SVG), Videos (MP4, WebM), and PDFs up to 50MB.
   - Immediate client-side object URL preview (`URL.createObjectURL`).
   - Mode Toggle: **Browser SDK (Direct)** vs. **Node API Route (Secure)**.
   - Upload action button with loading spinner and status steps.

3. **Asset Dashboard & Previews ([components/AssetDashboard.tsx](file:///home/fawaz/Documents/code/shely-cdn-explorer/components/AssetDashboard.tsx))**:
   - **Rich Previews**: Native Image lightboxing, HTML5 Video player controls, and PDF viewer options.
   - **Public CDN URL**: Single-click URL copy with copy-state toast feedback.
   - **Performance Metrics**: Breakdown of ArrayBuffer Read, Signer Generation, Network Latency, and Total Duration.
   - **Storage Metadata**: Blob Name, Ephemeral Signer Address, Expiration Date (30 Days), and Timestamp.
   - **Developer Snippet Generator**: Multi-tab code snippets (React Client, Node.js API Route, Aptos SDK, cURL).

4. **Secure Server API Route ([app/api/upload/route.ts](file:///home/fawaz/Documents/code/shely-cdn-explorer/app/api/upload/route.ts))**:
   - Production API route demonstrating secure server-side uploads using `ShelbyNodeClient` from `@shelby-protocol/sdk/node` to protect private API keys.

5. **Manual Blob Lookup & Local History**:
   - [components/ManualLookup.tsx](file:///home/fawaz/Documents/code/shely-cdn-explorer/components/ManualLookup.tsx) for looking up existing blobs.
   - [components/RecentUploads.tsx](file:///home/fawaz/Documents/code/shely-cdn-explorer/components/RecentUploads.tsx) storing session history in Local Storage.

---

## Visual Demonstration

![Shelby CDN Explorer Dashboard](/home/fawaz/.gemini/antigravity/brain/9c1056c8-3da7-4f0c-992a-03aa170aa80a/.system_generated/click_feedback/click_feedback_1785675823881.png)

---

## Verification Results

### Production Build Validation

Executed `npm run build` with 0 errors:

- TypeScript check passed cleanly.
- Static page generation (4/4) completed.
- Server API route `/api/upload` generated dynamically.

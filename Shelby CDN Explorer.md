# **Product Requirements Document (PRD) \- Shelby CDN Explorer**

## **1\. Product Vision & Goals**

**Vision:** To provide developers and users with a lightning-fast, intuitive interface for uploading media (Images, Videos, PDFs) to the Shelby decentralized storage network and instantly retrieving CDN-ready URLs, previews, and integration snippets.

**Goals:**

* Demonstrate the speed and reliability of the Shelby Protocol.  
* Simplify the developer experience for storing and serving static assets.  
* Provide a production-ready example of integrating Shelby SDK in a Next.js environment.

## **2\. Target Audience**

* **Web3 Developers:** Looking for decentralized alternatives to AWS S3/CloudFront.  
* **Content Creators:** Needing a simple, immutable way to host and share files.  
* **Hackathon Participants:** Needing quick setup for storage in their dApps.

## **3\. Key Features**

* **Drag-and-Drop Upload:** Seamless interface for uploading Images (JPG, PNG, GIF), Videos (MP4, WebM), and PDFs.  
* **Instant Processing:** Immediate interaction with the Shelby network to encode and distribute blobs.  
* **Asset Dashboard:** Post-upload view featuring:  
  * Rich Media Preview (Image viewer, Video player, PDF thumbnail/viewer).  
  * Public CDN URL (clickable/copiable).  
  * File Metadata (Size, Type, Upload timestamp, Shelby Blob Name).  
  * Performance Metrics (Upload duration, estimated retrieval latency).  
  * Developer Integration Snippet (React/Next.js code snippet showing how to fetch the specific asset).

## **4\. Non-Functional Requirements**

* **Performance:** Uploads should initialize within \< 1 second. Previews must load instantly using local object URLs before final network confirmation if necessary.  
* **Scalability:** The app should handle concurrent uploads gracefully (client-side limits may apply based on SDK capabilities).  
* **Reliability:** Clear error handling for network failures, unsupported file types, or oversized files.

# **Technical Requirements Document (TRD) \- Shelby CDN Explorer**

## **1\. Tech Stack**

* **Framework:** Next.js (App Router, TypeScript)  
* **Styling:** Tailwind CSS, Framer Motion (for smooth transitions)  
* **Shelby Integration:** @shelby-protocol/sdk (Browser client for direct client-to-network uploads to minimize server bottlenecks).  
* **Blockchain Context:** @aptos-labs/ts-sdk (for ephemeral signer generation).  
* **Deployment:** Vercel.

## **2\. Architecture & Data Flow**

1. **Client-Side Upload:** User selects a file. The browser generates a preview using URL.createObjectURL().  
2. **SDK Interaction:** The Next.js client uses ShelbyClient to upload the Uint8Array to the Shelby TESTNET (or MAINNET configurable via .env). An ephemeral Aptos account signs the transaction.  
3. **Metadata Generation:** Upon successful upload, the app constructs the public CDN URL (e.g., via a Shelby gateway if applicable, or uses the blob name for SDK retrieval).  
4. **State Management:** React useState manages the active file, upload progress, and the resulting dashboard data (blob name, URLs, metadata).

## **3\. API & Dependencies**

* NEXT\_PUBLIC\_SHELBY\_API\_KEY: Required for SDK initialization (if using authenticated gateways).  
* **File Size Limits:** Implement client-side validation (e.g., Max 50MB per file) to prevent browser memory issues during arrayBuffer conversion before handing off to the SDK.

## **4\. Security Considerations**

* **API Keys:** If using a private API key for subsidized uploads, the Next.js API Routes (/api/upload) must be used instead of the browser SDK to prevent key exposure. (The PRD assumes browser SDK for simplicity, but production TRD must flag this).  
* **Content Sanitization:** Only allow specific MIME types (image/\*, video/mp4, application/pdf).

# **User Stories**

## **Epic 1: File Upload Experience**

* **US1.1:** As a user, I want to drag and drop a file onto the page so that I can easily start the upload process without clicking through menus.  
* **US1.2:** As a user, I want to see visual feedback (e.g., a progress spinner and status text) during the upload so that I know the system is actively working.  
* **US1.3:** As a user, I want to be blocked from uploading unsupported file types (like .exe or .zip) so that I don't waste time on failed network requests.

## **Epic 2: Asset Dashboard & Previews**

* **US2.1:** As a user, once my image is uploaded, I want to see a visual preview of it immediately so I can verify the correct file was stored.  
* **US2.2:** As a user, I want to copy a public, shareable CDN URL with one click so I can easily embed the asset in my own application.  
* **US2.3:** As a user, I want to view metadata (file size, blob name, timestamp) so I can keep track of my storage usage on the Shelby network.

## **Epic 3: Developer Tools**

* **US3.1:** As a developer, I want to see an auto-generated React/JavaScript code snippet for my specific file so that I can copy-paste the exact code needed to retrieve this file in my own project.  
* **US3.2:** As a developer, I want to see the upload latency metrics so I can evaluate the performance of the Shelby Protocol for my use case.
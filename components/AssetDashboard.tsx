"use client";

import { ShelbyUploadResult } from "@/lib/shelby/client";
import { motion } from "framer-motion";
import {
  Activity,
  Calendar,
  Check,
  Clock,
  Code2,
  Copy,
  Download,
  ExternalLink,
  FileText,
  HardDrive,
  Image as ImageIcon,
  Key,
  Maximize2,
  Sparkles,
  Video as VideoIcon,
  X,
} from "lucide-react";
import React, { useState, useEffect } from "react";

interface AssetDashboardProps {
  asset: ShelbyUploadResult | null;
  onToast: (
    type: "success" | "error" | "info",
    title: string,
    description?: string,
  ) => void;
}

export const AssetDashboard: React.FC<AssetDashboardProps> = ({
  asset,
  onToast,
}) => {
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [copiedBlob, setCopiedBlob] = useState(false);
  const [activeSnippetTab, setActiveSnippetTab] = useState<
    "react" | "node" | "aptos" | "curl"
  >("react");
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  // Close image modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsImageModalOpen(false);
      }
    };
    if (isImageModalOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isImageModalOpen]);

  if (!asset) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-10 text-center rounded-2xl border border-white/10 bg-surface-300/30 glass-panel min-h-[460px]">
        <div className="w-16 h-16 rounded-2xl bg-surface-200 border border-white/10 flex items-center justify-center mb-4 text-gray-500">
          <HardDrive className="w-8 h-8 opacity-60" />
        </div>
        <h3 className="text-lg font-bold text-gray-300">No Asset Loaded</h3>
        <p className="text-xs text-gray-500 mt-1 max-w-xs">
          Upload a file on the left or lookup an existing Shelby Blob Name to
          view CDN previews, metadata, and code snippets.
        </p>
      </div>
    );
  }

  const copyToClipboard = (text: string, type: "url" | "snippet" | "blob") => {
    navigator.clipboard.writeText(text);
    if (type === "url") {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
      onToast("success", "URL Copied!", "Public CDN link copied to clipboard.");
    } else if (type === "snippet") {
      setCopiedSnippet(true);
      setTimeout(() => setCopiedSnippet(false), 2000);
      onToast(
        "success",
        "Code Snippet Copied!",
        "Integration code copied to clipboard.",
      );
    } else if (type === "blob") {
      setCopiedBlob(true);
      setTimeout(() => setCopiedBlob(false), 2000);
      onToast("success", "Blob Name Copied!", asset.blobName);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes || bytes === 0) return "Edge Blob";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const getSnippets = () => {
    return {
      react: `import { ShelbyClient } from '@shelby-protocol/sdk/browser';
import { Network } from '@aptos-labs/ts-sdk';

const shelby = new ShelbyClient({
  network: Network.MAINNET,
  apiKey: process.env.NEXT_PUBLIC_SHELBY_API_KEY || 'anonymous',
});

// Download blob content directly by account and blobName
export async function loadAsset() {
  const blob = await shelby.download({
    account: '${asset.signerAddress}',
    blobName: '${asset.blobName}',
  });
  return blob;
}`,
      node: `import { ShelbyNodeClient } from '@shelby-protocol/sdk/node';
import { Network, AccountAddress } from '@aptos-labs/ts-sdk';

const client = new ShelbyNodeClient({
  network: Network.MAINNET,
  apiKey: process.env.SHELBY_SECRET_API_KEY,
});

// Secure server-side download stream
const blobStream = await client.download({
  account: AccountAddress.from('${asset.signerAddress}'),
  blobName: '${asset.blobName}',
});`,
      aptos: `import { Account, Network } from "@aptos-labs/ts-sdk";
import { ShelbyClient } from "@shelby-protocol/sdk/browser";

const shelby = new ShelbyClient({ network: Network.MAINNET });

// Upload payload reference:
// Blob Name: ${asset.blobName}
// Signer Address: ${asset.signerAddress}`,
      curl: `# Fetch raw binary data from Shelby CDN Edge Gateway
curl -X GET "${asset.publicUrl}" \\
  -H "Accept: ${asset.mimeType}" \\
  -o "${asset.fileName}"`,
    };
  };

  const isImage = asset.mimeType.startsWith("image/");
  const isVideo = asset.mimeType.startsWith("video/");
  const isPdf = asset.mimeType === "application/pdf";
  const mediaSrc = asset.localPreviewUrl || asset.proxyUrl || asset.publicUrl;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
      className="flex flex-col gap-6"
    >
      {/* 1. Rich Media Preview Header */}
      <div className="rounded-2xl border border-white/10 bg-surface-300/60 backdrop-blur-xl overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-surface-200/50">
          <div className="flex items-center gap-2">
            {isImage && <ImageIcon className="w-4 h-4 text-shelby-cyan" />}
            {isVideo && <VideoIcon className="w-4 h-4 text-shelby-purple" />}
            {isPdf && <FileText className="w-4 h-4 text-shelby-indigo" />}
            <span className="text-xs font-semibold text-gray-200 truncate max-w-xs">
              {asset.fileName}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-shelby-indigo/20 text-shelby-indigo border border-shelby-indigo/30 text-[10px] font-mono font-semibold">
              {asset.mimeType}
            </span>
            <a
              href={mediaSrc}
              target="_blank"
              rel="noopener noreferrer"
              className="pressable p-1.5 rounded-lg bg-surface-100 hover:bg-surface-50 text-gray-300 transition-colors"
              title="Open Raw File"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Media Player Container */}
        <div className="relative min-h-[220px] max-h-[360px] bg-black/80 flex items-center justify-center overflow-hidden">
          {isImage && (
            <div className="relative group w-full h-full flex items-center justify-center p-4">
              <img
                src={mediaSrc}
                alt={asset.fileName}
                className="max-h-[300px] object-contain rounded-lg shadow-xl cursor-pointer hover:scale-[1.01] transition-transform"
                onClick={() => setIsImageModalOpen(true)}
              />
              <button
                type="button"
                onClick={() => setIsImageModalOpen(true)}
                className="pressable absolute bottom-3 right-3 p-2 rounded-lg bg-black/60 backdrop-blur-md text-white border border-white/20 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
          )}

          {isVideo && (
            <div className="w-full h-full flex items-center justify-center p-2">
              <video
                src={mediaSrc}
                controls
                className="max-h-[300px] w-full rounded-lg shadow-xl"
              />
            </div>
          )}

          {isPdf && (
            <div className="p-8 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-shelby-indigo/20 border border-shelby-indigo/30 flex items-center justify-center mb-3 text-shelby-indigo">
                <FileText className="w-8 h-8" />
              </div>
              <h4 className="text-sm font-semibold text-white">
                PDF Document Preview
              </h4>
              <p className="text-xs text-gray-400 mt-1">
                {asset.fileName} {asset.fileSize > 0 ? `(${formatFileSize(asset.fileSize)})` : ""}
              </p>
              <a
                href={mediaSrc}
                target="_blank"
                rel="noopener noreferrer"
                className="pressable mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-shelby-indigo text-white text-xs font-semibold shadow-lg hover:bg-shelby-indigo/90 transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Open / Download PDF</span>
              </a>
            </div>
          )}

          {!isImage && !isVideo && !isPdf && (
            <div className="p-8 text-center text-gray-400 text-xs">
              Preview not available natively for this MIME type. Use public CDN
              URL to access raw file.
            </div>
          )}
        </div>
      </div>

      {/* 2. Public CDN & Edge Proxy URLs */}
      <div className="p-5 rounded-2xl border border-shelby-cyan/30 bg-gradient-to-r from-surface-200 to-surface-300 backdrop-blur-xl relative overflow-hidden shadow-lg flex flex-col gap-4">
        {/* Instant Edge CDN URL */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-shelby-cyan uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-shelby-cyan" />
              Instant Edge CDN URL (Fast Delivery)
            </span>
            <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded font-mono font-semibold">
              ACTIVE & SERVING
            </span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={typeof window !== "undefined" ? `${window.location.origin}${asset.proxyUrl || `/api/blob?account=${asset.signerAddress}&blobName=${encodeURIComponent(asset.blobName)}`}` : asset.proxyUrl}
              className="flex-1 bg-surface-400 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-gray-200 focus:outline-none select-all"
            />

            <button
              onClick={() => {
                const fullProxy = typeof window !== "undefined" ? `${window.location.origin}${asset.proxyUrl || `/api/blob?account=${asset.signerAddress}&blobName=${encodeURIComponent(asset.blobName)}`}` : asset.proxyUrl || "";
                copyToClipboard(fullProxy, "url");
              }}
              className="pressable flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-shelby-cyan to-shelby-indigo text-white font-semibold text-xs shadow-md hover:brightness-110 transition-all shrink-0"
            >
              {copiedUrl ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4 text-white" />}
              <span>{copiedUrl ? "Copied" : "Copy CDN Link"}</span>
            </button>

            <a
              href={asset.proxyUrl || `/api/blob?account=${asset.signerAddress}&blobName=${encodeURIComponent(asset.blobName)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="pressable flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-surface-100 hover:bg-surface-50 border border-white/15 text-white font-semibold text-xs shadow-md transition-all shrink-0"
            >
              <span>Open</span>
              <ExternalLink className="w-3.5 h-3.5 text-shelby-cyan" />
            </a>
          </div>
        </div>

        {/* Public Decentralized Mainnet Gateway URL */}
        <div className="pt-3 border-t border-white/10 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-gray-400 flex items-center gap-1.5">
              <HardDrive className="w-3 h-3 text-shelby-purple" />
              Shelby Public RPC Gateway (Decentralized On-Chain)
            </span>
            <span className="text-[10px] text-gray-400 font-mono">
              Mainnet
            </span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={asset.publicUrl}
              className="flex-1 bg-surface-400/60 border border-white/5 rounded-xl px-3 py-1.5 text-[11px] font-mono text-gray-400 focus:outline-none select-all"
            />

            <button
              onClick={() => copyToClipboard(asset.publicUrl, "url")}
              className="pressable flex items-center gap-1 px-3 py-1.5 rounded-xl bg-surface-100 hover:bg-surface-50 text-gray-300 text-xs transition-colors shrink-0"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </button>

            {asset.explorerUrl && (
              <a
                href={asset.explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="pressable flex items-center gap-1 px-3 py-1.5 rounded-xl bg-surface-100 hover:bg-surface-50 text-gray-300 text-xs transition-colors shrink-0"
              >
                <span>Aptos Explorer</span>
                <ExternalLink className="w-3.5 h-3.5 text-shelby-purple" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* 3. Performance Metrics Badge */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl bg-surface-300/80 border border-white/10 flex flex-col">
          <span className="text-[10px] text-gray-400 flex items-center gap-1">
            <Clock className="w-3 h-3 text-shelby-cyan" /> ArrayBuffer Read
          </span>
          <span className="text-sm font-bold text-white mt-1 font-mono">
            {asset.metrics.readMs} ms
          </span>
        </div>

        <div className="p-3 rounded-xl bg-surface-300/80 border border-white/10 flex flex-col">
          <span className="text-[10px] text-gray-400 flex items-center gap-1">
            <Key className="w-3 h-3 text-shelby-purple" /> Signer Key Gen
          </span>
          <span className="text-sm font-bold text-white mt-1 font-mono">
            {asset.metrics.signerMs} ms
          </span>
        </div>

        <div className="p-3 rounded-xl bg-surface-300/80 border border-white/10 flex flex-col">
          <span className="text-[10px] text-gray-400 flex items-center gap-1">
            <Activity className="w-3 h-3 text-emerald-400" /> Upload Latency
          </span>
          <span className="text-sm font-bold text-white mt-1 font-mono">
            {asset.metrics.uploadMs} ms
          </span>
        </div>

        <div className="p-3 rounded-xl bg-surface-300/80 border border-white/10 flex flex-col">
          <span className="text-[10px] text-gray-400 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-400" /> Total Duration
          </span>
          <span className="text-sm font-bold text-white mt-1 font-mono">
            {asset.metrics.totalMs} ms
          </span>
        </div>
      </div>

      {/* 4. Metadata Details Grid */}
      <div className="p-5 rounded-2xl border border-white/10 bg-surface-300/50 backdrop-blur-xl">
        <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-4 flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-shelby-indigo" />
          Shelby Storage Metadata
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          {/* Blob Name */}
          <div className="flex flex-col gap-1 p-2.5 rounded-lg bg-surface-200/50 border border-white/5">
            <span className="text-gray-400 font-medium">Blob Name:</span>
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-gray-200 truncate">
                {asset.blobName}
              </span>
              <button
                onClick={() => copyToClipboard(asset.blobName, "blob")}
                className="pressable text-gray-400 hover:text-white"
              >
                {copiedBlob ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          {/* Ephemeral Signer */}
          <div className="flex flex-col gap-1 p-2.5 rounded-lg bg-surface-200/50 border border-white/5">
            <span className="text-gray-400 font-medium">
              Signer Address:
            </span>
            <span
              className="font-mono text-gray-200 truncate"
              title={asset.signerAddress}
            >
              {asset.signerAddress.slice(0, 10)}...
              {asset.signerAddress.slice(-8)}
            </span>
          </div>

          {/* Upload Timestamp */}
          <div className="flex flex-col gap-1 p-2.5 rounded-lg bg-surface-200/50 border border-white/5">
            <span className="text-gray-400 font-medium flex items-center gap-1">
              <Calendar className="w-3 h-3 text-gray-400" /> Upload Timestamp:
            </span>
            <span className="font-mono text-gray-200">
              {new Date(asset.timestamp).toLocaleString()}
            </span>
          </div>

          {/* Network & Expiration */}
          <div className="flex flex-col gap-1 p-2.5 rounded-lg bg-surface-200/50 border border-white/5">
            <span className="text-gray-400 font-medium">
              Network & Expiration:
            </span>
            <span className="font-mono text-gray-200">
              {asset.network} • 30 Days Valid
            </span>
          </div>
        </div>
      </div>

      {/* 5. Developer Code Snippet Generator */}
      <div className="rounded-2xl border border-white/10 bg-surface-300/50 backdrop-blur-xl overflow-hidden">
        <div className="p-4 border-b border-white/10 flex flex-wrap items-center justify-between gap-3 bg-surface-200/60">
          <div className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-shelby-cyan" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Developer Integration Snippet
            </span>
          </div>

          {/* Tab Selector */}
          <div className="flex items-center gap-1 bg-surface-400 p-1 rounded-lg border border-white/5">
            <button
              onClick={() => setActiveSnippetTab("react")}
              className={`pressable px-2.5 py-1 rounded text-[11px] font-semibold transition-all ${
                activeSnippetTab === "react"
                  ? "bg-shelby-indigo text-white shadow"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              React / Next.js
            </button>
            <button
              onClick={() => setActiveSnippetTab("node")}
              className={`pressable px-2.5 py-1 rounded text-[11px] font-semibold transition-all ${
                activeSnippetTab === "node"
                  ? "bg-shelby-indigo text-white shadow"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              Node.js API
            </button>
            <button
              onClick={() => setActiveSnippetTab("aptos")}
              className={`pressable px-2.5 py-1 rounded text-[11px] font-semibold transition-all ${
                activeSnippetTab === "aptos"
                  ? "bg-shelby-indigo text-white shadow"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              Aptos SDK
            </button>
            <button
              onClick={() => setActiveSnippetTab("curl")}
              className={`pressable px-2.5 py-1 rounded text-[11px] font-semibold transition-all ${
                activeSnippetTab === "curl"
                  ? "bg-shelby-indigo text-white shadow"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              cURL
            </button>
          </div>
        </div>

        {/* Code Snippet Container */}
        <div className="relative p-4 bg-surface-400 text-xs font-mono text-gray-200 overflow-x-auto code-scroll">
          <button
            onClick={() =>
              copyToClipboard(getSnippets()[activeSnippetTab], "snippet")
            }
            className="pressable absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-200 hover:bg-surface-100 border border-white/10 text-gray-300 text-[11px] transition-colors"
          >
            {copiedSnippet ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
            <span>{copiedSnippet ? "Copied" : "Copy Code"}</span>
          </button>

          <pre className="pr-20 text-[12px] leading-relaxed text-cyan-300 whitespace-pre">
            {getSnippets()[activeSnippetTab]}
          </pre>
        </div>
      </div>

      {/* Fullscreen Image Lightbox Modal */}
      {isImageModalOpen && isImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setIsImageModalOpen(false)}
        >
          <button
            type="button"
            onClick={() => setIsImageModalOpen(false)}
            className="pressable absolute top-5 right-5 p-2 rounded-xl bg-surface-200 hover:bg-surface-100 text-gray-400 hover:text-white transition-colors z-10"
          >
            <X className="w-5 h-5" />
          </button>
          <div
            className="relative max-w-5xl max-h-[90vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={mediaSrc}
              alt={asset.fileName}
              className="max-h-[85vh] max-w-full rounded-xl object-contain shadow-2xl"
            />
          </div>
        </div>
      )}
    </motion.div>
  );
};

"use client";

import React, { useState } from "react";
import { Header } from "@/components/Header";
import { UploadSection } from "@/components/UploadSection";
import { AssetDashboard } from "@/components/AssetDashboard";
import { ManualLookup } from "@/components/ManualLookup";
import { RecentUploads } from "@/components/RecentUploads";
import { ToastContainer, ToastMessage } from "@/components/Toast";
import { ShelbyUploadResult } from "@/lib/shelby/client";
import { Github, ExternalLink, ShieldAlert, Sparkles, Cpu } from "lucide-react";

export default function Home() {
  const [activeAsset, setActiveAsset] = useState<ShelbyUploadResult | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: "success" | "error" | "info", title: string, description?: string) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    setToasts((prev) => [...prev, { id, type, title, description }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-gray-100 relative">
      {/* Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* Header Navigation */}
      <Header />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Intro Hero Banner */}
        <div className="mb-8 p-6 rounded-2xl border border-white/10 bg-gradient-to-r from-surface-300/80 via-surface-200/50 to-surface-300/80 backdrop-blur-xl relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-shelby-indigo/10 rounded-full blur-3xl pointer-events-none" />
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-shelby-indigo/20 text-shelby-cyan text-xs font-semibold mb-2 border border-shelby-indigo/30">
                <Sparkles className="w-3.5 h-3.5 animate-spin-slow" />
                <span>Next-Gen Decentralized Media CDN</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Store Once, Serve Globally at Edge Speed
              </h2>
              <p className="text-xs sm:text-sm text-gray-400 mt-1 max-w-2xl">
                Upload media blobs to Shelby MAINNET using Aptos ephemeral signers. Instantly generate shareable public CDN links, inspect real-time performance metrics, and copy developer SDK snippets.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <a
                href="https://shelby.xyz"
                target="_blank"
                rel="noopener noreferrer"
                className="pressable inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-100 hover:bg-surface-50 border border-white/15 text-xs font-semibold text-white shadow-lg transition-all"
              >
                <span>Shelby Docs</span>
                <ExternalLink className="w-3.5 h-3.5 text-shelby-cyan" />
              </a>
            </div>
          </div>
        </div>

        {/* Two-Column Explorer Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Upload Section & Lookup (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <UploadSection
              onUploadSuccess={(result) => setActiveAsset(result)}
              onToast={addToast}
            />

            <ManualLookup
              onRetrieve={(result) => setActiveAsset(result)}
              onToast={addToast}
            />

            <RecentUploads
              onSelect={(result) => setActiveAsset(result)}
              activeBlobName={activeAsset?.blobName}
            />
          </div>

          {/* Right Column: Asset Dashboard & Developer Snippets (7 cols) */}
          <div className="lg:col-span-7">
            <AssetDashboard
              asset={activeAsset}
              onToast={addToast}
            />
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-white/10 bg-surface-400 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-shelby-cyan" />
            <span>Shelby Protocol • Aptos Mainnet CDN Engine</span>
          </div>

          <div className="flex items-center gap-6">
            <a
              href="https://explorer.aptoslabs.com/?network=mainnet"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              Aptos Explorer
            </a>
            <a
              href="https://shelby.xyz"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              Protocol Docs
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

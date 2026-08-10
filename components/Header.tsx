"use client";

import React from "react";
import { Database, ShieldCheck, Zap, Globe } from "lucide-react";
import { ConnectWalletButton } from "@/components/ConnectWalletButton";

export const Header: React.FC = () => {
  return (
    <header className="relative w-full border-b border-white/10 bg-background/80 backdrop-blur-xl sticky top-0 z-40">
      {/* Background radial glow effect */}
      <div className="absolute inset-0 bg-glow-gradient pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 relative">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Logo & Title */}
          <div className="flex items-center gap-4">
            <div className="relative group">
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-shelby-cyan via-shelby-indigo to-shelby-purple blur-md opacity-75 group-hover:opacity-100 transition duration-300" />
              <div className="relative flex items-center justify-center w-12 h-12 rounded-xl bg-surface-300 border border-white/15 text-white">
                <Database className="w-6 h-6 text-shelby-cyan animate-pulse-glow" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
                  Shelby <span className="bg-gradient-to-r from-shelby-cyan via-shelby-indigo to-shelby-purple bg-clip-text text-transparent">CDN Explorer</span>
                </h1>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  MAINNET
                </span>
              </div>
              <p className="text-xs sm:text-sm text-gray-400 mt-1 max-w-xl">
                Decentralized media storage on Aptos & Shelby Protocol with instant CDN URLs, rich previews, and developer snippets.
              </p>
            </div>
          </div>

          {/* Quick Metrics Badges & Connect Wallet */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-200 border border-white/10 text-xs font-medium text-gray-300">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Sub-second Latency</span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-200 border border-white/10 text-xs font-medium text-gray-300">
              <Globe className="w-3.5 h-3.5 text-shelby-cyan" />
              <span>Edge CDN</span>
            </div>

            {/* Connect Web3 Wallet Button */}
            <ConnectWalletButton />
          </div>

        </div>
      </div>
    </header>
  );
};

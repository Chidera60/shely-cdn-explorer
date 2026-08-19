"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Wallet, ShieldCheck, Sparkles, ExternalLink, ArrowRight, Loader2, Check, AlertCircle, Download } from "lucide-react";
import { useWallet, WalletType } from "@/lib/wallet/WalletContext";

interface WalletOption {
  id: WalletType;
  name: string;
  description: string;
  badge?: string;
  recommended?: boolean;
  installUrl?: string;
  color: string;
}

const WALLET_OPTIONS: WalletOption[] = [
  {
    id: "petra",
    name: "Petra Wallet",
    description: "Official Aptos wallet extension by Aptos Labs",
    recommended: true,
    installUrl: "https://petra.app",
    color: "from-amber-500/20 to-orange-500/10 border-amber-500/30",
  },
  {
    id: "pontem",
    name: "Pontem Wallet",
    description: "Multi-platform Web3 wallet for Aptos ecosystem",
    installUrl: "https://pontem.network/pontem-wallet",
    color: "from-indigo-500/20 to-purple-500/10 border-indigo-500/30",
  },
  {
    id: "standard",
    name: "Aptos Standard Wallet",
    description: "Browser AIP-62 standard wallet detection",
    installUrl: "https://aptoslabs.com",
    color: "from-emerald-500/20 to-teal-500/10 border-emerald-500/30",
  },
  {
    id: "sandbox",
    name: "Sandbox / Ephemeral Signer",
    description: "Instant testing session with local ephemeral account",
    badge: "Zero Setup",
    color: "from-shelby-cyan/20 to-shelby-indigo/20 border-shelby-cyan/40",
  },
];

export const WalletModal: React.FC = () => {
  const { isWalletModalOpen, setIsWalletModalOpen, connectWallet, isConnecting, isConnected, walletType, connectionError, availableWallets } = useWallet();
  const [activeError, setActiveError] = useState<string | null>(null);
  const [missingExtension, setMissingExtension] = useState<WalletOption | null>(null);

  if (!isWalletModalOpen) return null;

  const handleSelectWallet = async (option: WalletOption) => {
    setActiveError(null);
    setMissingExtension(null);
    const result = await connectWallet(option.id);
    if (!result.success && result.error) {
      setActiveError(result.error);
      if (option.installUrl) {
        setMissingExtension(option);
      }
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={() => setIsWalletModalOpen(false)}
          className="absolute inset-0 bg-black/70 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 8 }}
          transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
          className="relative w-full max-w-lg rounded-2xl bg-surface-300 border border-white/15 p-6 shadow-2xl overflow-hidden z-10"
        >
          {/* Ambient Glow */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-shelby-cyan/15 rounded-full blur-3xl pointer-events-none" />

          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-shelby-indigo/20 border border-shelby-indigo/30 flex items-center justify-center text-shelby-cyan">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">Connect Aptos Wallet</h3>
                <p className="text-xs text-gray-400">Select a wallet to sign uploads & manage assets</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsWalletModalOpen(false)}
              className="pressable p-2 rounded-lg bg-surface-200 hover:bg-surface-100 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Error Banner */}
          {(activeError || connectionError) && (
            <div className="mb-4 p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/30 flex items-start justify-between gap-3 text-xs text-rose-200">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block">{activeError || connectionError}</span>
                  {missingExtension?.installUrl && (
                    <span className="text-gray-300 mt-1 block">
                      Install the browser extension and refresh to connect.
                    </span>
                  )}
                </div>
              </div>

              {missingExtension?.installUrl && (
                <a
                  href={missingExtension.installUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pressable inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-white font-medium shrink-0 transition-colors"
                >
                  <Download className="w-3 h-3" />
                  <span>Install</span>
                </a>
              )}
            </div>
          )}

          {/* Wallet List */}
          <div className="flex flex-col gap-3">
            {WALLET_OPTIONS.map((option) => {
              const isActive = isConnected && walletType === option.id;
              const isDetected =
                option.id === "sandbox" ||
                availableWallets?.some(
                  (w) =>
                    w.name?.toLowerCase().includes(option.id) ||
                    (option.id === "petra" && w.name?.toLowerCase().includes("petra")) ||
                    (option.id === "pontem" && w.name?.toLowerCase().includes("pontem")) ||
                    (option.id === "standard" && availableWallets.length > 0)
                );

              return (
                <button
                  key={option.id}
                  type="button"
                  disabled={isConnecting}
                  onClick={() => handleSelectWallet(option)}
                  className={`pressable w-full text-left p-4 rounded-xl border bg-gradient-to-r transition-all duration-200 flex items-center justify-between group relative overflow-hidden ${
                    isActive
                      ? "border-emerald-500/50 bg-emerald-500/10"
                      : `${option.color} hover:border-white/30 hover:bg-surface-200/80`
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-surface-400/80 border border-white/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Wallet className="w-4 h-4 text-shelby-cyan group-hover:scale-110 transition-transform" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-white tracking-tight">{option.name}</h4>
                        {isDetected && option.id !== "sandbox" && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            Detected
                          </span>
                        )}
                        {option.recommended && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            Recommended
                          </span>
                        )}
                        {option.badge && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-shelby-cyan/20 text-shelby-cyan border border-shelby-cyan/30">
                            {option.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">{option.description}</p>
                    </div>
                  </div>

                  <div className="shrink-0 ml-3">
                    {isActive ? (
                      <span className="flex items-center gap-1 text-xs font-semibold text-emerald-400">
                        <Check className="w-4 h-4" />
                        Connected
                      </span>
                    ) : isConnecting ? (
                      <Loader2 className="w-4 h-4 animate-spin text-shelby-cyan" />
                    ) : (
                      <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Footer Info */}
          <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-gray-400">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-shelby-indigo" />
              Secure Aptos Account Signer
            </span>
            <a
              href="https://aptoslabs.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white inline-flex items-center gap-1 transition-colors"
            >
              <span>Learn about Aptos</span>
              <ExternalLink className="w-3 h-3 text-shelby-cyan" />
            </a>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

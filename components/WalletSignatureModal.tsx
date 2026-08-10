"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, KeyRound, HardDrive, Zap, CheckCircle, X, Loader2, ArrowRight } from "lucide-react";
import { useWallet } from "@/lib/wallet/WalletContext";

export const WalletSignatureModal: React.FC = () => {
  const { pendingSignature, resolvePendingSignature, walletAddress, walletName, balance } = useWallet();
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!pendingSignature) return null;

  const handleApprove = async () => {
    setIsSubmitting(true);
    try {
      await resolvePendingSignature(true);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = () => {
    resolvePendingSignature(false);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={handleReject}
          className="absolute inset-0 bg-black/75 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
          className="relative w-full max-w-md rounded-2xl bg-surface-300 border border-shelby-cyan/30 p-6 shadow-2xl overflow-hidden z-10"
        >
          {/* Subtle Ambient Lighting */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-shelby-indigo/20 rounded-full blur-3xl pointer-events-none" />

          {/* Header Banner */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-shelby-cyan/20 to-shelby-purple/20 border border-shelby-cyan/40 flex items-center justify-center text-shelby-cyan">
                <KeyRound className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">Sign Upload Request</h3>
                <p className="text-xs text-gray-400">Authorize storage transaction from wallet</p>
              </div>
            </div>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleReject}
              className="pressable p-1.5 rounded-lg bg-surface-200 hover:bg-surface-100 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Connected Wallet Identity */}
          <div className="p-3 rounded-xl bg-surface-200/80 border border-white/10 mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <div className="min-w-0">
                <span className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold block">
                  Signer Account ({walletName || "Wallet"})
                </span>
                <span className="text-xs font-mono font-medium text-white truncate block">
                  {walletAddress ? `${walletAddress.slice(0, 10)}...${walletAddress.slice(-8)}` : ""}
                </span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="text-[10px] uppercase text-gray-400 block font-semibold">Available</span>
              <span className="text-xs font-bold text-emerald-400 font-mono">{balance.toFixed(4)} APT</span>
            </div>
          </div>

          {/* Transaction Payload Details */}
          <div className="space-y-2.5 mb-6 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface-400/50 border border-white/5">
              <span className="text-gray-400 flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5 text-shelby-cyan" />
                Target File
              </span>
              <span className="font-semibold text-white truncate max-w-[180px]">
                {pendingSignature.fileName} ({formatFileSize(pendingSignature.fileSize)})
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface-400/50 border border-white/5">
              <span className="text-gray-400 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                Storage & Gas Fee
              </span>
              <span className="font-mono font-bold text-amber-300">
                ~{pendingSignature.estimatedFeeApt.toFixed(5)} APT
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface-400/50 border border-white/5">
              <span className="text-gray-400">Network Expiration</span>
              <span className="text-gray-200">30 Days (Aptos Mainnet DSN)</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleReject}
              className="pressable flex-1 py-2.5 px-4 rounded-xl border border-white/15 bg-surface-200 hover:bg-surface-100 text-xs font-semibold text-gray-300 hover:text-white transition-all text-center"
            >
              Reject
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleApprove}
              className="pressable flex-[1.5] py-2.5 px-4 rounded-xl bg-gradient-to-r from-shelby-cyan via-shelby-indigo to-shelby-purple text-xs font-bold text-white shadow-lg hover:brightness-110 transition-all flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Signing Transaction...</span>
                </>
              ) : (
                <>
                  <span>Sign & Charge Wallet</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

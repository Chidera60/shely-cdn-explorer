"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet, ChevronDown, Copy, Check, ExternalLink, LogOut, Coins, ShieldCheck } from "lucide-react";
import { useWallet } from "@/lib/wallet/WalletContext";

export const ConnectWalletButton: React.FC = () => {
  const { isConnected, walletAddress, walletName, balance, setIsWalletModalOpen, disconnectWallet } = useWallet();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const copyAddress = () => {
    if (!walletAddress) return;
    navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const truncatedAddress = walletAddress
    ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
    : "";

  if (!isConnected) {
    return (
      <button
        type="button"
        onClick={() => setIsWalletModalOpen(true)}
        className="pressable relative group inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-shelby-cyan via-shelby-indigo to-shelby-purple text-xs font-bold text-white shadow-lg shadow-shelby-indigo/25 hover:brightness-110 transition-all border border-white/20"
      >
        <Wallet className="w-4 h-4 text-white group-hover:rotate-12 transition-transform duration-200" />
        <span>Connect Wallet</span>
      </button>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="pressable flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-surface-200 hover:bg-surface-100 border border-white/15 text-xs font-medium text-white transition-all shadow-md"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>

        <span className="font-mono font-semibold">{truncatedAddress}</span>

        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 font-mono font-bold text-[11px] border border-emerald-500/20">
          <Coins className="w-3 h-3" />
          {balance.toFixed(2)} APT
        </span>

        <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {dropdownOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 4 }}
            transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
            className="absolute right-0 mt-2 w-64 rounded-xl bg-surface-300 border border-white/15 shadow-2xl p-2 z-50 text-xs"
          >
            {/* Header info */}
            <div className="p-2.5 rounded-lg bg-surface-400/50 mb-1.5 border border-white/5">
              <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 block">Connected Provider</span>
              <span className="font-semibold text-white flex items-center gap-1.5 mt-0.5">
                <ShieldCheck className="w-3.5 h-3.5 text-shelby-cyan" />
                {walletName}
              </span>
            </div>

            {/* Actions */}
            <button
              type="button"
              onClick={copyAddress}
              className="pressable w-full text-left px-3 py-2 rounded-lg hover:bg-surface-200 text-gray-300 hover:text-white flex items-center justify-between transition-colors"
            >
              <span className="flex items-center gap-2">
                <Copy className="w-3.5 h-3.5 text-shelby-cyan" />
                Copy Wallet Address
              </span>
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : null}
            </button>

            <a
              href={`https://explorer.aptoslabs.com/account/${walletAddress}?network=testnet`}
              target="_blank"
              rel="noopener noreferrer"
              className="pressable w-full text-left px-3 py-2 rounded-lg hover:bg-surface-200 text-gray-300 hover:text-white flex items-center gap-2 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5 text-shelby-indigo" />
              View on Aptos Explorer
            </a>

            <div className="h-px bg-white/10 my-1" />

            <button
              type="button"
              onClick={() => {
                setDropdownOpen(false);
                disconnectWallet();
              }}
              className="pressable w-full text-left px-3 py-2 rounded-lg hover:bg-rose-500/10 text-rose-400 hover:text-rose-300 flex items-center gap-2 transition-colors font-semibold"
            >
              <LogOut className="w-3.5 h-3.5" />
              Disconnect Wallet
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

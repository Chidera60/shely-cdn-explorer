"use client";

import React, { useState } from "react";
import { Search, ArrowRight, Database, Loader2 } from "lucide-react";
import { fetchByBlobName, ShelbyUploadResult } from "@/lib/shelby/client";

interface ManualLookupProps {
  onRetrieve: (result: ShelbyUploadResult) => void;
  onToast: (type: "success" | "error" | "info", title: string, description?: string) => void;
}

export const ManualLookup: React.FC<ManualLookupProps> = ({ onRetrieve, onToast }) => {
  const [blobInput, setBlobInput] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = blobInput.trim();
    if (!query) {
      onToast("error", "Empty Search", "Please enter a Shelby Blob Name.");
      return;
    }

    setIsSearching(true);
    try {
      const result = await fetchByBlobName(query);
      onRetrieve(result);
      onToast("info", "Blob Loaded", `Loaded dashboard for '${query}'.`);
    } catch (err: any) {
      onToast("error", "Retrieval Failed", err?.message || `Could not find blob '${query}'.`);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="p-4 rounded-2xl border border-white/10 bg-surface-300/40 backdrop-blur-xl">
      <div className="flex items-center gap-2 mb-3">
        <Database className="w-4 h-4 text-shelby-cyan" />
        <h3 className="text-xs font-bold text-gray-200 uppercase tracking-wider">
          Manual Shelby Blob Retrieval
        </h3>
      </div>

      <form onSubmit={handleSearch} className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Enter Shelby Blob Name (e.g. uploads/1785920-avatar.png)"
            value={blobInput}
            onChange={(e) => setBlobInput(e.target.value)}
            disabled={isSearching}
            className="w-full bg-surface-400 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs font-mono text-white placeholder-gray-500 focus:outline-none focus:border-shelby-cyan transition-colors disabled:opacity-60"
          />
        </div>

        <button
          type="submit"
          disabled={isSearching}
          className="pressable flex items-center gap-1.5 px-4 py-2 rounded-xl bg-surface-100 hover:bg-surface-50 border border-white/15 text-xs font-semibold text-white shadow-md transition-all disabled:opacity-60"
        >
          {isSearching ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-shelby-cyan" />
          ) : (
            <>
              <span>Retrieve</span>
              <ArrowRight className="w-3.5 h-3.5 text-shelby-cyan" />
            </>
          )}
        </button>
      </form>
    </div>
  );
};

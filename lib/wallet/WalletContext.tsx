"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { formatAptosAddress } from "@/lib/shelby/client";

export type WalletType = "petra" | "pontem" | "standard" | "sandbox";

export interface WalletState {
  isConnected: boolean;
  walletAddress: string | null;
  walletName: string | null;
  walletType: WalletType | null;
  balance: number; // in APT
  network: string;
  isConnecting: boolean;
  isSandbox: boolean;
  connectionError: string | null;
}

export interface PendingSignatureRequest {
  fileName: string;
  fileSize: number;
  blobName: string;
  mimeType: string;
  estimatedFeeApt: number;
}

interface WalletContextType extends WalletState {
  connectWallet: (type: WalletType) => Promise<{ success: boolean; error?: string }>;
  disconnectWallet: () => void;
  refreshBalance: () => Promise<void>;
  isWalletModalOpen: boolean;
  setIsWalletModalOpen: (open: boolean) => void;
  pendingSignature: PendingSignatureRequest | null;
  promptUploadSignature: (request: PendingSignatureRequest) => Promise<{ txHash: string; signerAddress: string }>;
  resolvePendingSignature: (confirmed: boolean) => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

const WALLET_STORAGE_KEY = "shelby_connected_wallet_session";

/**
 * Fetch real on-chain APT coin balance from Aptos Fullnode RPC
 */
async function fetchOnChainAptBalance(address: string): Promise<number> {
  try {
    const formatted = formatAptosAddress(address);
    const res = await fetch(
      `https://fullnode.mainnet.aptoslabs.com/v1/accounts/${formatted}/resource/0x1::coin::CoinStore%3C0x1::aptos_coin::AptosCoin%3E`,
      { cache: "no-store" }
    );
    if (!res.ok) return 0;
    const data = await res.json();
    const octas = data?.data?.coin?.value;
    if (octas) {
      return Number((Number(octas) / 100000000).toFixed(4));
    }
  } catch (e) {
    console.warn("Could not query on-chain Aptos balance:", e);
  }
  return 0;
}

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<WalletState>({
    isConnected: false,
    walletAddress: null,
    walletName: null,
    walletType: null,
    balance: 0,
    network: "Aptos Mainnet",
    isConnecting: false,
    isSandbox: false,
    connectionError: null,
  });

  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [pendingSignature, setPendingSignature] = useState<PendingSignatureRequest | null>(null);
  const [signatureResolver, setSignatureResolver] = useState<{
    resolve: (res: { txHash: string; signerAddress: string }) => void;
    reject: (err: Error) => void;
  } | null>(null);

  // Restore saved session on mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    const saved = localStorage.getItem(WALLET_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.address) {
          const isSandbox = parsed.type === "sandbox";
          setState({
            isConnected: true,
            walletAddress: formatAptosAddress(parsed.address),
            walletName: parsed.name || (isSandbox ? "Sandbox Account" : "Aptos Wallet"),
            walletType: parsed.type || "sandbox",
            balance: parsed.balance ?? (isSandbox ? 10.0 : 0),
            network: "Aptos Mainnet",
            isConnecting: false,
            isSandbox,
            connectionError: null,
          });

          // Fetch fresh balance if it's a real on-chain account
          if (!isSandbox) {
            fetchOnChainAptBalance(parsed.address).then((bal) => {
              setState((prev) => ({ ...prev, balance: bal }));
            });
          }
        }
      } catch (e) {}
    }
  }, []);

  const refreshBalance = useCallback(async () => {
    if (!state.isConnected || !state.walletAddress) return;
    if (state.isSandbox) {
      // Simulate minor fee reduction in sandbox mode
      setState((prev) => ({
        ...prev,
        balance: Math.max(0, Number((prev.balance - 0.00045).toFixed(4))),
      }));
    } else {
      const realBal = await fetchOnChainAptBalance(state.walletAddress);
      setState((prev) => ({ ...prev, balance: realBal }));
    }
  }, [state.isConnected, state.walletAddress, state.isSandbox]);

  const connectWallet = async (type: WalletType): Promise<{ success: boolean; error?: string }> => {
    setState((prev) => ({ ...prev, isConnecting: true, connectionError: null }));

    try {
      // 1. Sandbox Mode
      if (type === "sandbox") {
        let sandboxAddress = "";
        if (typeof window !== "undefined") {
          const storedKey = localStorage.getItem("shelby_sandbox_wallet_address");
          if (storedKey && storedKey.length > 42) {
            sandboxAddress = formatAptosAddress(storedKey);
          } else {
            sandboxAddress = formatAptosAddress(
              "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")
            );
            localStorage.setItem("shelby_sandbox_wallet_address", sandboxAddress);
          }
        } else {
          sandboxAddress = formatAptosAddress(
            "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")
          );
        }

        const walletData = {
          address: sandboxAddress,
          name: "Shelby Sandbox Account",
          type: "sandbox" as WalletType,
          balance: 10.0,
        };

        if (typeof window !== "undefined") {
          localStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify(walletData));
        }

        setState({
          isConnected: true,
          walletAddress: sandboxAddress,
          walletName: "Shelby Sandbox Account",
          walletType: "sandbox",
          balance: 10.0,
          network: "Aptos Mainnet (Sandbox)",
          isConnecting: false,
          isSandbox: true,
          connectionError: null,
        });

        setIsWalletModalOpen(false);
        return { success: true };
      }

      // 2. Real Browser Extension Connection
      const win = typeof window !== "undefined" ? (window as any) : {};
      let extensionProvider: any = null;
      let displayName = "Aptos Wallet";

      if (type === "petra") {
        extensionProvider = win.petra || (win.aptos && win.aptos.isPetra ? win.aptos : null);
        displayName = "Petra Wallet";
      } else if (type === "pontem") {
        extensionProvider = win.pontem;
        displayName = "Pontem Wallet";
      } else if (type === "standard") {
        extensionProvider = win.aptos;
        displayName = "Aptos Standard Wallet";
      }

      // Extension is NOT installed: Report clear error, do NOT fake connection
      if (!extensionProvider) {
        const errorMsg = `${displayName} extension is not installed in your browser.`;
        setState((prev) => ({
          ...prev,
          isConnecting: false,
          connectionError: errorMsg,
        }));
        return { success: false, error: errorMsg };
      }

      // Connect to the extension
      const response = await extensionProvider.connect();
      const account = await extensionProvider.account();
      const rawAddress = account?.address || response?.address || response?.account?.address;
      
      if (!rawAddress) {
        throw new Error("Could not retrieve account address from wallet.");
      }

      const address = formatAptosAddress(rawAddress);
      const realBalance = await fetchOnChainAptBalance(address);

      const walletData = {
        address: address,
        name: displayName,
        type,
        balance: realBalance,
      };

      if (typeof window !== "undefined") {
        localStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify(walletData));
      }

      setState({
        isConnected: true,
        walletAddress: address,
        walletName: displayName,
        walletType: type,
        balance: realBalance,
        network: "Aptos Mainnet",
        isConnecting: false,
        isSandbox: false,
        connectionError: null,
      });

      setIsWalletModalOpen(false);
      return { success: true };
    } catch (err: any) {
      console.error("Wallet connection failed:", err);
      const msg = err?.message || "Failed to connect to wallet provider.";
      setState((prev) => ({ ...prev, isConnecting: false, connectionError: msg }));
      return { success: false, error: msg };
    }
  };

  const disconnectWallet = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(WALLET_STORAGE_KEY);
    }
    setState({
      isConnected: false,
      walletAddress: null,
      walletName: null,
      walletType: null,
      balance: 0,
      network: "Aptos Mainnet",
      isConnecting: false,
      isSandbox: false,
      connectionError: null,
    });
  };

  const promptUploadSignature = (
    request: PendingSignatureRequest
  ): Promise<{ txHash: string; signerAddress: string }> => {
    return new Promise((resolve, reject) => {
      setPendingSignature(request);
      setSignatureResolver({ resolve, reject });
    });
  };

  const resolvePendingSignature = async (confirmed: boolean) => {
    if (!signatureResolver || !pendingSignature || !state.walletAddress) return;

    if (!confirmed) {
      signatureResolver.reject(new Error("User rejected wallet upload signature."));
      setPendingSignature(null);
      setSignatureResolver(null);
      return;
    }

    try {
      const win = typeof window !== "undefined" ? (window as any) : {};
      const aptos = win.aptos || win.petra;
      let txHash = "";

      if (aptos && !state.isSandbox) {
        try {
          if (typeof aptos.signMessage === "function") {
            const signedMsg = await aptos.signMessage({
              message: `Shelby Protocol Storage Authorization: ${pendingSignature.blobName}`,
              nonce: Date.now().toString(),
            });
            txHash = signedMsg?.signature || `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`;
          } else {
            txHash = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`;
          }
        } catch (e: any) {
          throw new Error(e?.message || "Wallet signature was declined by user.");
        }
      } else {
        txHash = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`;
      }

      await refreshBalance();

      signatureResolver.resolve({
        txHash,
        signerAddress: state.walletAddress,
      });
    } catch (err: any) {
      signatureResolver.reject(err || new Error("Failed to sign transaction with wallet"));
    } finally {
      setPendingSignature(null);
      setSignatureResolver(null);
    }
  };

  return (
    <WalletContext.Provider
      value={{
        ...state,
        connectWallet,
        disconnectWallet,
        refreshBalance,
        isWalletModalOpen,
        setIsWalletModalOpen,
        pendingSignature,
        promptUploadSignature,
        resolvePendingSignature,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
};

"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  AptosWalletAdapterProvider,
  useWallet as useAptosAdapterWallet,
} from "@aptos-labs/wallet-adapter-react";
import { formatAptosAddress } from "@/lib/shelby/client";

export type WalletType = "petra" | "pontem" | "standard" | "sandbox" | string;

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
  availableWallets: ReadonlyArray<any>;
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

const InnerWalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const aptos = useAptosAdapterWallet();

  const [isSandboxConnected, setIsSandboxConnected] = useState(false);
  const [sandboxAddress, setSandboxAddress] = useState<string | null>(null);
  const [sandboxBalance, setSandboxBalance] = useState<number>(10.0);

  const [realBalance, setRealBalance] = useState<number>(0);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

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
          if (parsed.type === "sandbox") {
            setIsSandboxConnected(true);
            setSandboxAddress(formatAptosAddress(parsed.address));
            setSandboxBalance(parsed.balance ?? 10.0);
          }
        }
      } catch (e) {}
    }
  }, []);

  // Update on-chain balance when official Aptos wallet connects
  useEffect(() => {
    if (aptos.connected && aptos.account?.address) {
      setIsSandboxConnected(false);
      const rawAddr = aptos.account.address.toString();
      const addr = formatAptosAddress(rawAddr);

      fetchOnChainAptBalance(addr).then((bal) => {
        setRealBalance(bal);
      });

      const walletData = {
        address: addr,
        name: aptos.wallet?.name || "Aptos Wallet",
        type: aptos.wallet?.name || "standard",
        balance: realBalance,
      };
      localStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify(walletData));
    }
  }, [aptos.connected, aptos.account?.address, aptos.wallet?.name]);

  const isConnected = isSandboxConnected || (aptos.connected && !!aptos.account?.address);
  const walletAddress = isSandboxConnected
    ? sandboxAddress
    : aptos.account?.address
    ? formatAptosAddress(aptos.account.address.toString())
    : null;
  const walletName = isSandboxConnected
    ? "Shelby Sandbox Account"
    : aptos.wallet?.name || "Aptos Wallet";
  const walletType = isSandboxConnected
    ? "sandbox"
    : aptos.wallet?.name?.toLowerCase().includes("petra")
    ? "petra"
    : aptos.wallet?.name?.toLowerCase().includes("pontem")
    ? "pontem"
    : "standard";
  const balance = isSandboxConnected ? sandboxBalance : realBalance;
  const isSandbox = isSandboxConnected;

  const refreshBalance = useCallback(async () => {
    if (!isConnected || !walletAddress) return;
    if (isSandbox) {
      setSandboxBalance((prev) => Math.max(0, Number((prev - 0.00045).toFixed(4))));
    } else {
      const realBal = await fetchOnChainAptBalance(walletAddress);
      setRealBalance(realBal);
    }
  }, [isConnected, walletAddress, isSandbox]);

  const connectWallet = async (type: WalletType): Promise<{ success: boolean; error?: string }> => {
    setIsConnecting(true);
    setConnectionError(null);

    try {
      // 1. Sandbox Mode
      if (type === "sandbox") {
        let addr = "";
        if (typeof window !== "undefined") {
          const stored = localStorage.getItem("shelby_sandbox_wallet_address");
          if (stored && stored.length > 42) {
            addr = formatAptosAddress(stored);
          } else {
            addr = formatAptosAddress(
              "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")
            );
            localStorage.setItem("shelby_sandbox_wallet_address", addr);
          }
        } else {
          addr = formatAptosAddress(
            "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")
          );
        }

        setIsSandboxConnected(true);
        setSandboxAddress(addr);
        setSandboxBalance(10.0);

        if (typeof window !== "undefined") {
          localStorage.setItem(
            WALLET_STORAGE_KEY,
            JSON.stringify({ address: addr, name: "Shelby Sandbox Account", type: "sandbox", balance: 10.0 })
          );
        }

        setIsConnecting(false);
        setIsWalletModalOpen(false);
        return { success: true };
      }

      // 2. Real Aptos Wallet via official Aptos Adapter (AIP-62)
      // Find matching wallet in detected wallets list
      let targetWalletName = "";
      if (type === "petra") {
        const petraWallet = aptos.wallets.find((w) => w.name.toLowerCase().includes("petra"));
        targetWalletName = petraWallet?.name || "Petra";
      } else if (type === "pontem") {
        const pontemWallet = aptos.wallets.find((w) => w.name.toLowerCase().includes("pontem"));
        targetWalletName = pontemWallet?.name || "Pontem Wallet";
      } else if (type === "standard") {
        targetWalletName = aptos.wallets[0]?.name || "Petra";
      } else {
        targetWalletName = type;
      }

      const isInstalled = aptos.wallets.some(
        (w) => w.name.toLowerCase() === targetWalletName.toLowerCase() || w.name.toLowerCase().includes(type.toLowerCase())
      );

      if (!isInstalled) {
        const errorMsg = `${type === "petra" ? "Petra" : type === "pontem" ? "Pontem" : type} Wallet is not detected in your browser.`;
        setConnectionError(errorMsg);
        setIsConnecting(false);
        return { success: false, error: errorMsg };
      }

      // Connect through official AIP-62 adapter
      await aptos.connect(targetWalletName);

      setIsSandboxConnected(false);
      setIsConnecting(false);
      setIsWalletModalOpen(false);
      return { success: true };
    } catch (err: any) {
      console.error("Wallet connection failed:", err);
      const msg = err?.message || "Failed to connect to wallet provider.";
      setConnectionError(msg);
      setIsConnecting(false);
      return { success: false, error: msg };
    }
  };

  const disconnectWallet = () => {
    if (isSandboxConnected) {
      setIsSandboxConnected(false);
      setSandboxAddress(null);
    }
    if (aptos.connected) {
      try {
        aptos.disconnect();
      } catch (e) {}
    }
    if (typeof window !== "undefined") {
      localStorage.removeItem(WALLET_STORAGE_KEY);
    }
    setConnectionError(null);
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
    if (!signatureResolver || !pendingSignature || !walletAddress) return;

    if (!confirmed) {
      signatureResolver.reject(new Error("User rejected wallet upload signature."));
      setPendingSignature(null);
      setSignatureResolver(null);
      return;
    }

    try {
      let txHash = "";

      if (!isSandbox && aptos.connected) {
        try {
          const res = await aptos.signMessage({
            message: `Shelby Protocol Storage Authorization: ${pendingSignature.blobName}`,
            nonce: Date.now().toString(),
          });
          txHash =
            typeof res === "object" && res && "signature" in res
              ? (res as any).signature
              : `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`;
        } catch (e: any) {
          throw new Error(e?.message || "Wallet signature was declined by user.");
        }
      } else {
        txHash = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`;
      }

      await refreshBalance();

      signatureResolver.resolve({
        txHash,
        signerAddress: walletAddress,
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
        isConnected,
        walletAddress,
        walletName,
        walletType,
        balance,
        network: "Aptos Mainnet",
        isConnecting,
        isSandbox,
        connectionError,
        connectWallet,
        disconnectWallet,
        refreshBalance,
        isWalletModalOpen,
        setIsWalletModalOpen,
        pendingSignature,
        promptUploadSignature,
        resolvePendingSignature,
        availableWallets: aptos.wallets,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <AptosWalletAdapterProvider
      autoConnect={true}
      onError={(error) => {
        console.warn("Aptos Wallet Adapter warning:", error);
      }}
    >
      <InnerWalletProvider>{children}</InnerWalletProvider>
    </AptosWalletAdapterProvider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
};

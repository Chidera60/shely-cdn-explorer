"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useWallet as useAdapterWallet } from "@aptos-labs/wallet-adapter-react";
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
import { SHELBYUSD_FA_METADATA_ADDRESS } from "@shelby-protocol/sdk/browser";
import { formatAptosAddress, getOrCreateSigner } from "@/lib/shelby/client";

export type WalletType = "petra" | "pontem" | "standard";

export interface WalletState {
  isConnected: boolean;
  walletAddress: string | null;
  walletName: string | null;
  walletType: WalletType | null;
  balance: number; // in ShelbyUSD
  network: string;
  isConnecting: boolean;
}

export interface PendingSignatureRequest {
  fileName: string;
  fileSize: number;
  blobName: string;
  mimeType: string;
  estimatedFeeShelbyUsd: number;
}

interface WalletContextType extends WalletState {
  connectWallet: (type: WalletType) => Promise<boolean>;
  disconnectWallet: () => void;
  refreshBalance: () => void;
  isWalletModalOpen: boolean;
  setIsWalletModalOpen: (open: boolean) => void;
  pendingSignature: PendingSignatureRequest | null;
  promptUploadSignature: (request: PendingSignatureRequest) => Promise<{ txHash: string; signerAddress: string }>;
  resolvePendingSignature: (confirmed: boolean) => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

// Read-only Aptos client used for on-chain view calls (balance, decimals).
// NOTE: confirm this points at the correct network for your environment
// (Mainnet here — switch to TESTNET/DEVNET while testing with real wallets).
const aptosConfig = new AptosConfig({ network: Network.SHELBYNET });
const aptosReadClient = new Aptos(aptosConfig);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    connect,
    disconnect,
    connected,
    isLoading,
    account,
    wallet,
    wallets,
    signAndSubmitTransaction,
  } = useAdapterWallet();

  const [balance, setBalance] = useState(0);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [pendingSignature, setPendingSignature] = useState<PendingSignatureRequest | null>(null);
  const [signatureResolver, setSignatureResolver] = useState<{
    resolve: (res: { txHash: string; signerAddress: string }) => void;
    reject: (err: Error) => void;
  } | null>(null);

  const walletAddress = account?.address ? formatAptosAddress(account.address.toString()) : null;

  const fetchShelbyUsdBalance = async (address: string): Promise<number> => {
    const [rawBalance] = await aptosReadClient.view<[string]>({
      payload: {
        function: "0x1::primary_fungible_store::balance",
        typeArguments: ["0x1::fungible_asset::Metadata"],
        functionArguments: [address, SHELBYUSD_FA_METADATA_ADDRESS],
      },
    });
    const [decimalsRaw] = await aptosReadClient.view<[number]>({
      payload: {
        function: "0x1::fungible_asset::decimals",
        typeArguments: ["0x1::fungible_asset::Metadata"],
        functionArguments: [SHELBYUSD_FA_METADATA_ADDRESS],
      },
    });
    return Number(rawBalance) / 10 ** Number(decimalsRaw);
  };

  // Refresh the real ShelbyUSD balance whenever the connected wallet address changes.
  useEffect(() => {
    if (!walletAddress) {
      setBalance(0);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const bal = await fetchShelbyUsdBalance(walletAddress);
        if (!cancelled) setBalance(bal);
      } catch (err) {
        console.error("Failed to fetch ShelbyUSD balance:", err);
        if (!cancelled) setBalance(0);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [walletAddress]);

  const connectWallet = async (type: WalletType): Promise<boolean> => {
    const match = wallets?.find((w) =>
      type === "petra"
        ? w.name.toLowerCase().includes("petra")
        : type === "pontem"
        ? w.name.toLowerCase().includes("pontem")
        : true
    );

    if (!match) {
      const label = type === "petra" ? "Petra" : type === "pontem" ? "Pontem" : "A compatible";
      alert(`${label} wallet wasn't detected. Please install it and refresh the page.`);
      if (typeof window !== "undefined") {
        window.open(type === "pontem" ? "https://pontem.network/" : "https://petra.app/", "_blank");
      }
      return false;
    }

    try {
      await connect(match.name);
      setIsWalletModalOpen(false);
      return true;
    } catch (err) {
      console.error("Wallet connection failed:", err);
      return false;
    }
  };

  const disconnectWallet = () => {
    disconnect();
    setBalance(0);
  };

  const refreshBalance = async () => {
    if (!walletAddress) return;
    try {
      const bal = await fetchShelbyUsdBalance(walletAddress);
      setBalance(bal);
    } catch (err) {
      console.error("Failed to refresh ShelbyUSD balance:", err);
    }
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
      // The ephemeral session signer that will actually perform the Shelby upload
      // transaction (Shelby's SDK requires a raw Account, which Petra can't provide
      // directly). The wallet here pays by funding that signer with ShelbyUSD.
      const ephemeralSigner = getOrCreateSigner();
      const recipientAddress = ephemeralSigner.accountAddress.toString();

      const [decimalsRaw] = await aptosReadClient.view<[number]>({
        payload: {
          function: "0x1::fungible_asset::decimals",
          typeArguments: ["0x1::fungible_asset::Metadata"],
          functionArguments: [SHELBYUSD_FA_METADATA_ADDRESS],
        },
      });
      const decimals = Number(decimalsRaw);
      const rawAmount = Math.round(pendingSignature.estimatedFeeShelbyUsd * 10 ** decimals);

      const res = await signAndSubmitTransaction({
        data: {
          function: "0x1::primary_fungible_store::transfer",
          typeArguments: ["0x1::fungible_asset::Metadata"],
          functionArguments: [SHELBYUSD_FA_METADATA_ADDRESS, recipientAddress, rawAmount],
        },
      });

      const txHash = res?.hash;
      if (!txHash) throw new Error("Wallet did not return a transaction hash.");

      await refreshBalance();

      signatureResolver.resolve({ txHash, signerAddress: walletAddress });
    } catch (err: any) {
      signatureResolver.reject(err instanceof Error ? err : new Error("Failed to sign transaction with wallet"));
    } finally {
      setPendingSignature(null);
      setSignatureResolver(null);
    }
  };

  const walletType: WalletType | null = wallet?.name
    ? wallet.name.toLowerCase().includes("petra")
      ? "petra"
      : wallet.name.toLowerCase().includes("pontem")
      ? "pontem"
      : "standard"
    : null;

  return (
    <WalletContext.Provider
      value={{
        isConnected: connected,
        walletAddress,
        walletName: wallet?.name ?? null,
        walletType,
        balance,
        network: "Shelbynet",
        isConnecting: isLoading,
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
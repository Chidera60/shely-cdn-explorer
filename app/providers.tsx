"use client";

import { AptosWalletAdapterProvider } from "@aptos-labs/wallet-adapter-react";
import { WalletProvider } from "@/lib/wallet/WalletContext";
import { WalletModal } from "@/components/WalletModal";
import { WalletSignatureModal } from "@/components/WalletSignatureModal";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AptosWalletAdapterProvider
      autoConnect={true}
      onError={(error) => console.error("Wallet adapter error:", error)}
    >
      <WalletProvider>
        {children}
        <WalletModal />
        <WalletSignatureModal />
      </WalletProvider>
    </AptosWalletAdapterProvider>
  );
}
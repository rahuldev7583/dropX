"use client";
import Airdrop from "@/components/Airdrop";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import {
  WalletModalProvider,
  WalletDisconnectButton,
  WalletMultiButton,
} from "@solana/wallet-adapter-react-ui";
import "@solana/wallet-adapter-react-ui/styles.css";

export default function Home() {
  const SOL_API = process.env.NEXT_PUBLIC_SOL_API || "";
  return (
    <div className="">
      <ConnectionProvider endpoint={SOL_API}>
        <WalletProvider wallets={[]} autoConnect>
          <WalletModalProvider>
            <div className="flex mt-4 ml-2 md:ml-8">
              <h1 className="text-3xl font-bold">AirDrift</h1>
              <div className="md:flex ml-12 md:ml-[60%] md:space-x-16">
                <WalletMultiButton />
                <WalletDisconnectButton />
              </div>
            </div>
            <Airdrop />
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </div>
  );
}
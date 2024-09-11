"use client";

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
import RecoilContextProvider from "./RecoilProvider";
import { Nerko_One } from "next/font/google";
import { GiBoltDrop } from "react-icons/gi";
import Landing from "@/components/Landing";

const nerko = Nerko_One({ weight: "400", subsets: ["latin"] });

export default function Home() {
  const SOL_API = process.env.NEXT_PUBLIC_DEVNET_SOL_API || "";
  return (
    <div className="bg-slate-800 text-gray-200 min-h-screen">
      <ConnectionProvider endpoint={SOL_API}>
        <WalletProvider wallets={[]} autoConnect>
          <WalletModalProvider>
            <div className="flex pt-4 ml-2 md:ml-8">
              <h1 className={`text-3xl font-bold  flex ${nerko.className}`}>
                <GiBoltDrop /> DropX
              </h1>
              <div className="md:flex ml-20 md:ml-[60%] md:space-x-16">
                <WalletMultiButton />
                <WalletDisconnectButton />
              </div>
            </div>
            <RecoilContextProvider>
              <Landing />
            </RecoilContextProvider>
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </div>
  );
}

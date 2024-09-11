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
import { solApi } from "./RecoilProvider";
import { Nerko_One } from "next/font/google";
import { GiBoltDrop } from "react-icons/gi";
import Landing from "@/components/Landing";
import { useRecoilState } from "recoil";
import { useState } from "react";

const nerko = Nerko_One({ weight: "400", subsets: ["latin"] });

export default function Home() {
  const [endpoint, setEndpoint] = useRecoilState(solApi);
  const [loading, setLoading] = useState(false);

  const DEVNET_SOL_API = process.env.NEXT_PUBLIC_DEVNET_SOL_API || "";
  const MAINNET_SOL_API = process.env.NEXT_PUBLIC_MAINNET_SOL_API || "";

  const toggleEndpoint = async () => {
    setLoading(true);

    const timer = setTimeout(() => {}, 100);

    try {
      if (endpoint.type === "Devnet") {
        setEndpoint({ url: MAINNET_SOL_API, type: "Mainnet" });
      } else {
        setEndpoint({ url: DEVNET_SOL_API, type: "Devnet" });
      }
    } finally {
      clearTimeout(timer);

      await new Promise((resolve) => setTimeout(resolve, 500));
      setLoading(false);
    }
  };

  return !loading ? (
    <div className="bg-slate-800 text-gray-200 min-h-screen">
      <ConnectionProvider endpoint={endpoint.url}>
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
            <div className=" justify-center my-4 absolute top-0 left-[37%]">
              <p
                className={`py-2 px-4 rounded text-center font-semibold ${
                  endpoint.type === "Devnet"
                    ? "bg-blue-200 text-blue-900"
                    : "bg-green-200 text-green-900"
                }`}
              >
                You are currently connected to{" "}
                {endpoint.type === "Devnet" ? "Devnet" : "Mainnet"}
              </p>
              <button
                onClick={toggleEndpoint}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-4 ml-20"
              >
                Switch to {endpoint.type === "Devnet" ? "Mainnet" : "Devnet"}
              </button>
            </div>

            <Landing />
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </div>
  ) : (
    <div className="flex  inset-0 w-screen h-screen items-center justify-center z-50 bg-slate-700 bg-opacity-50">
      <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent border-solid rounded-full animate-spin"></div>
    </div>
  );
}

"use client";

import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import {
  WalletModalProvider,
  WalletMultiButton,
} from "@solana/wallet-adapter-react-ui";
import "@solana/wallet-adapter-react-ui/styles.css";
import { solApi } from "./RecoilProvider";
import { Nerko_One } from "next/font/google";
import { GiBoltDrop } from "react-icons/gi";
import Landing from "@/components/Landing";
import { useRecoilState } from "recoil";
import { useState } from "react";
import { Switch } from "@/components/ui/switch";

const nerko = Nerko_One({ weight: "400", subsets: ["latin"] });

export default function Home() {
  const [endpoint, setEndpoint] = useRecoilState(solApi);
  const [loading, setLoading] = useState(false);

  const DEVNET_SOL_API = process.env.NEXT_PUBLIC_DEVNET_SOL_API || "";
  const MAINNET_SOL_API = process.env.NEXT_PUBLIC_MAINNET_SOL_API || "";

  const toggleEndpoint = async () => {
    setLoading(true);

    const timer = setTimeout(() => {}, 50);

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
    <div className=" bg-gradient-to-r from-[#002814] via-[#01072b] to-[#02001a] shadow-lg text-gray-200 min-h-screen">
      <ConnectionProvider endpoint={endpoint.url}>
        <WalletProvider wallets={[]} autoConnect>
          <WalletModalProvider>
            <div className="flex pt-4 ml-2 md:ml-8">
              <h1 className={`text-3xl font-bold  flex ${nerko.className}`}>
                <GiBoltDrop /> DropX
              </h1>
              <div className="md:flex ml-20 md:ml-[80%] md:space-x-16">
                <WalletMultiButton />

                {/* <WalletDisconnectButton /> */}
              </div>
            </div>
            <div className="pt-2 flex justify-center my-4 absolute top-0 left-[42.5%] ">
              <p
                className={`py-2 px-4 text-lg rounded-xl text-center font-semibold ${
                  endpoint.type === "Devnet"
                    ? "bg-[#FCDC94] text-gray-600"
                    : "bg-[#4b0982] text-gray-200"
                }`}
              >
                Connected to {endpoint.type === "Devnet" ? "Devnet" : "Mainnet"}
              </p>
              {/* <button
                onClick={toggleEndpoint}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-4 ml-20"
              >
                Switch to {endpoint.type === "Devnet" ? "Mainnet" : "Devnet"}
              </button> */}
              <div className="flex items-center space-x-2 ml-20">
                <label htmlFor="mode" className="font-semibold text-lg">
                  Switch to {endpoint.type === "Devnet" ? "Mainnet" : "Devnet"}
                </label>{" "}
                <Switch
                  id="mode"
                  className=""
                  checked={endpoint.type !== "Devnet"}
                  onCheckedChange={toggleEndpoint}
                />
              </div>
            </div>

            <Landing />
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </div>
  ) : (
    <div className="flex  inset-0 w-screen h-screen items-center justify-center z-50 bg-gradient-to-r from-[#002814] via-[#01072b] to-[#02001a] shadow-lg bg-opacity-100">
      <div className="w-16 h-16 border-4 border-slate-400 border-t-transparent border-solid rounded-full animate-spin"></div>
    </div>
  );
}

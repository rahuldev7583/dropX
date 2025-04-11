"use client";
import React from "react";
import GetToken from "./GetToken";
import GetBalance from "./GetBalance";
import SendSol from "@/components/SendSol";
import SendToken from "@/components/SendToken";
import { useWallet } from "@solana/wallet-adapter-react";
import { useToast } from "@/hooks/use-toast";
import Airdrop from "./Airdrop";
import { useRecoilState, useRecoilValue } from "recoil";
import {
  airDropState,
  historyState,
  sendSolState,
  sendTokenState,
  solApi,
  solBalanceState,
  tokenState,
} from "@/app/RecoilProvider";
import Image from "next/image";
import solana from "@/sol-logo.svg";
import GetTransaction from "./GetTransaction";

const Landing = () => {
  const wallet = useWallet();
  const { toast } = useToast();
  const [airDrop, setAirDrop] = useRecoilState(airDropState);
  const [sendSolStatus, setSendSolStatus] = useRecoilState(sendSolState);
  const [sendTokenStatus, setSendTokenStatus] = useRecoilState(sendTokenState);
  const [historyStatus, setHistoryStatus] = useRecoilState(historyState);
  const endpoint = useRecoilValue(solApi);
  const tokens = useRecoilValue(tokenState);
  const solBalance = useRecoilValue(solBalanceState);

  const handleAirdrop = () => {
    if (!wallet || !wallet.connected || !wallet.publicKey) {
      toast({
        variant: "destructive",
        title: `connect your wallet`,
      });
      return;
    }
    if (endpoint.type === "Devnet") {
      setHistoryStatus(false);
      setAirDrop(true);
    } else {
      toast({
        variant: "destructive",
        title: `Airdrop only support in Devnet`,
      });
      return;
    }
  };

  const handleSendSol = () => {
    if (!wallet || !wallet.connected || !wallet.publicKey) {
      toast({
        variant: "destructive",
        title: `connect your wallet`,
      });
      return;
    }
    if (parseFloat(solBalance) === 0) {
      toast({
        variant: "destructive",
        title: `You don't have SOL to send`,
      });
      return;
    }
    setHistoryStatus(false);
    setSendSolStatus(true);
  };

  const handleSendToken = () => {
    if (!wallet || !wallet.connected || !wallet.publicKey) {
      toast({
        variant: "destructive",
        title: `connect your wallet`,
      });
      return;
    }
    if (tokens.length === 0) {
      toast({
        variant: "destructive",
        title: `You don't have any tokens`,
      });
      return;
    }
    setHistoryStatus(false);
    setSendTokenStatus(true);
  };

  const handleHistory = () => {
    if (!wallet || !wallet.connected || !wallet.publicKey) {
      toast({
        variant: "destructive",
        title: `connect your wallet`,
      });
      return;
    }
    setHistoryStatus(true);
  };
  interface ButtonProp {
    className?: string;
  }

  const Buttons = ({ className }: ButtonProp) => {
    return (
      <div
        className={` bg-[#4b0982] px-8 py-2 rounded-full mt-12 flex flex-col lg:flex-row font-bold text-lg gap-6 shadow-xl ${className}`}
      >
        <button
          onClick={handleAirdrop}
          className="w-full lg:w-auto  hover:opacity-50  text-white font-medium py-3 px-4 rounded-lg transition duration-300"
        >
          Airdrop
        </button>
        <button
          onClick={handleSendSol}
          className="w-full lg:w-auto hover:opacity-50 text-white font-medium py-3 px-4 rounded-lg transition duration-300"
        >
          Send SOL
        </button>
        <button
          onClick={handleSendToken}
          className="w-full lg:w-auto hover:opacity-50 text-white font-medium py-3 px-4 rounded-lg transition duration-300"
        >
          Send Token
        </button>
        <button
          onClick={handleHistory}
          className="w-full lg:w-auto hover:opacity-50 text-white font-medium py-3 px-4 rounded-lg transition duration-300"
        >
          History
        </button>
      </div>
    );
  };
  return wallet.connected ? (
    <div className="mt-16">
      <GetBalance />
      {!historyStatus ? (
        <GetToken />
      ) : (
        <GetTransaction onClose={() => setHistoryStatus(false)} />
      )}

      <Buttons className="justify-center ml-[32%] lg:ml-[35%] z-50 fixed top-[80%]" />

      {airDrop && <Airdrop onClose={() => setAirDrop(false)} />}
      {sendSolStatus && <SendSol onClose={() => setSendSolStatus(false)} />}
      {sendTokenStatus && (
        <SendToken onClose={() => setSendTokenStatus(false)} />
      )}
    </div>
  ) : (
    <div className="mt-4">
      <section className=" py-8">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="text-center ">
            <h2 className="text-3xl font-bold text-gray-100">
              Manage Your Solana Assets
            </h2>
            <p className="mt-4 text-gray-100">
              Airdrop, Send SOL, and Send tokens seamlessly.
            </p>
          </div>
          <Image
            className="w-[30%]  ml-[35%] rounded-2xl mt-12"
            src={solana}
            alt="solana-img"
          />
          <Buttons className="justify-center ml-[30%] lg:ml-[24%] z-50 fixed top-[82%]" />
        </div>
      </section>
    </div>
  );
};

export default Landing;

"use client";
import React from "react";
import GetToken from "./GetToken";
import GetBalance from "./GetBalance";
import SendSol from "@/components/SendSol";
import SendToken from "@/components/SendToken";
import { useWallet } from "@solana/wallet-adapter-react";
import { useToast } from "@/hooks/use-toast";
import Airdrop from "./Airdrop";
import { useRecoilState } from "recoil";
import {
  airDropState,
  sendSolState,
  sendTokenState,
} from "@/app/RecoilProvider";

const Landing = () => {
  const wallet = useWallet();
  const { toast } = useToast();
  const [airDrop, setAirDrop] = useRecoilState(airDropState);
  const [sendSolStatus, setSendSolStatus] = useRecoilState(sendSolState);
  const [sendTokenStatus, setSendTokenStatus] = useRecoilState(sendTokenState);

  const handleAirdrop = () => {
    if (!wallet || !wallet.connected || !wallet.publicKey) {
      toast({
        variant: "destructive",
        title: `connect your wallet`,
      });
      return;
    }
    setAirDrop(true);
  };

  const handleSendSol = () => {
    if (!wallet || !wallet.connected || !wallet.publicKey) {
      toast({
        variant: "destructive",
        title: `connect your wallet`,
      });
      return;
    }
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
    setSendTokenStatus(true);
  };

  interface ButtonProp {
    className?: string;
  }

  const Buttons = ({ className }: ButtonProp) => {
    return (
      <div className={`mt-12 flex flex-col lg:flex-row  gap-6 ${className}`}>
        <button
          onClick={handleAirdrop}
          className="w-full lg:w-auto bg-gray-700 hover:bg-gray-600 text-white py-3 px-8 rounded-lg transition duration-300"
        >
          Airdrop SOL
        </button>
        <button
          onClick={handleSendSol}
          className="w-full lg:w-auto bg-gray-700 hover:bg-gray-600 text-white py-3 px-8 rounded-lg transition duration-300"
        >
          Send SOL
        </button>
        <button
          onClick={handleSendToken}
          className="w-full lg:w-auto bg-gray-700 hover:bg-gray-600 text-white py-3 px-8 rounded-lg transition duration-300"
        >
          Send Token
        </button>
      </div>
    );
  };
  return wallet.connected ? (
    <div>
      <GetBalance />
      <GetToken />
      <Buttons className="ml-[35%]" />
      {airDrop && <Airdrop onClose={() => setAirDrop(false)} />}
      {sendSolStatus && <SendSol onClose={() => setSendSolStatus(false)} />}
      {sendTokenStatus && (
        <SendToken onClose={() => setSendTokenStatus(false)} />
      )}
    </div>
  ) : (
    <div>
      <section className=" py-16">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-100">
              Manage Your Solana Assets
            </h2>
            <p className="mt-4 text-gray-400">
              Airdrop, Send SOL, and Send tokens seamlessly.
            </p>
          </div>
          <Buttons className="justify-center" />
        </div>
      </section>
    </div>
  );
};

export default Landing;

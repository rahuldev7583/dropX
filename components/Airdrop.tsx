"use client";

import { useToast } from "@/hooks/use-toast";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import React, { useState } from "react";
import LoadingSpinner from "./Loading";
import { useSetRecoilState } from "recoil";
import { airDropState, solBalanceState } from "@/app/RecoilProvider";
import { fetchBalance } from "./GetBalance";
interface AirdropProps {
  onClose: () => void;
}

const Airdrop = ({ onClose }: AirdropProps) => {
  const wallet = useWallet();
  const { connection } = useConnection();
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const setSolBalance = useSetRecoilState(solBalanceState);
  const { toast } = useToast();
  const setAirDrop = useSetRecoilState(airDropState);

  async function sendAirdrop() {
    if (!wallet || !wallet.connected || !wallet.publicKey) return;
    const amt = parseFloat(amount);
    if (!amt || amt <= 0 || amt > 1000) {
      toast({
        variant: "destructive",
        title: `Please Enter Valid Amount`,
      });
      setAmount("");
      return;
    }
    try {
      setLoading(true);
      const signature = await connection.requestAirdrop(
        wallet.publicKey,
        amt * LAMPORTS_PER_SOL
      );
      let confirmed = false;
      while (!confirmed) {
        const status = await connection.getSignatureStatus(signature);

        if (status?.value?.confirmationStatus === "confirmed") {
          confirmed = true;
          console.log("Transaction confirmed");
        } else if (status?.value?.err) {
          throw new Error("Transaction failed");
        }

        setAmount("");
        setAirDrop(false);
        setLoading(false);
      }
    } catch (error) {
      console.error("Airdrop failed:", error);
      toast({
        variant: "destructive",
        title: `Airdrop failed`,
      });
    } finally {
      toast({
        title: `${parseFloat(amount)} SOL has been Airdropped`,
      });
      fetchBalance(wallet, connection).then((balance) => {
        setSolBalance(balance);
      });
    }
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
      <div className="absolute bg-slate-800 text-gray-100 px-8 py-10 rounded-xl w-[30%] shadow-lg top-56">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-100"
        >
          ✖
        </button>
        <h2 className="text-xl font-semibold mb-4">Airdrop SOL to Devnet</h2>

        <input
          id="amount"
          name="amount"
          type="number"
          min={0}
          max={100}
          className="border border-gray-500 p-2 rounded w-full mb-4 bg-gray-700 text-white"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          disabled={loading}
        />
        <button
          onClick={sendAirdrop}
          className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? (
            <LoadingSpinner message="Airdropping..." />
          ) : (
            "Request Airdrop"
          )}
        </button>
      </div>
    </div>
  );
};

export default Airdrop;

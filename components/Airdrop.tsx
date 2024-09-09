"use client";

import { useToast } from "@/hooks/use-toast";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import React, { useState } from "react";
import LoadingSpinner from "./Loading";
import { useSetRecoilState } from "recoil";
import { solBalanceState } from "@/app/RecoilProvider";
import { fetchBalance } from "./GetBalance";

const Airdrop = () => {
  const wallet = useWallet();
  const { connection } = useConnection();
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const setSolBalance = useSetRecoilState(solBalanceState);
  const { toast } = useToast();

  async function sendAirdrop() {
    if (!wallet || !wallet.connected || !wallet.publicKey) {
      // alert("connect your wallet");
      toast({
        variant: "destructive",
        title: `connect your wallet`,
      });
      return;
    }

    setLoading(true);
    try {
      const amt = parseFloat(amount);
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

        setLoading(false);
      }
    } catch (error) {
      console.error("Airdrop failed:", error);
      alert("Airdrop failed");
    } finally {
      toast({
        title: `${parseFloat(amount)} SOL has been Airdropped`,
      });
      setAmount("");
      fetchBalance(wallet, connection).then((balance) => {
        setSolBalance(balance);
      });
    }
  }

  return (
    <div className="mt-4 w-[50%] border border-gray-200 rounded-xl py-4 px-4">
      <h2 className="text-xl font-semibold">Airdrop</h2>
      <label
        htmlFor="amount"
        className="block text-sm font-medium text-gray-700 mt-4"
      >
        Amount
      </label>
      <input
        id="amount"
        name="amount"
        type="number"
        className="border border-gray-300 p-2 rounded w-[55%] mt-1"
        placeholder="amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        disabled={loading}
      />
      <br />

      <button
        onClick={sendAirdrop}
        className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        disabled={loading}
      >
        {loading ? (
          <LoadingSpinner message="Airdropping..." />
        ) : (
          "Request Airdrop"
        )}
      </button>
    </div>
  );
};

export default Airdrop;

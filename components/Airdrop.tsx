"use client";

import { useToast } from "@/hooks/use-toast";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import React, { useState } from "react";
import LoadingSpinner from "./Loading";
import { useSetRecoilState } from "recoil";
import {
  airDropState,
  solBalanceState,
  transactionHistoryState,
} from "@/app/RecoilProvider";
import { fetchBalance } from "./GetBalance";
import { fetchTransactions } from "./GetTransaction";
import axios from "axios";

interface AirdropProps {
  onClose: () => void;
}

const Airdrop = ({ onClose }: AirdropProps) => {
  const wallet = useWallet();
  const { connection } = useConnection();
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const setSolBalance = useSetRecoilState(solBalanceState);
  const setTransactionHistory = useSetRecoilState(transactionHistoryState);
  const { toast } = useToast();
  const setAirDrop = useSetRecoilState(airDropState);
  const DEVNET_AIRDROP_API = process.env.NEXT_PUBLIC_DEVNET_AIRDROP || "";

  async function sendAirdrop() {
    if (!wallet || !wallet.connected || !wallet.publicKey) return;
    const amt = parseFloat(amount);
    if (!amt || amt <= 0 || amt > 10) {
      toast({
        variant: "destructive",
        title: `Please Enter Valid Amount`,
      });
      setAmount("");
      return;
    }
    try {
      setLoading(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response:any = await axios.post(DEVNET_AIRDROP_API,  {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "requestAirdrop",
        "params": [
          wallet.publicKey,
          amt * LAMPORTS_PER_SOL
        ]
      })

   
const signature = response.data.result;
      console.log(signature);
      let confirmed = false;
      let attempts = 0;
      const maxAttempts = 10;
      const retryInterval = 2000;

      while (!confirmed && attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, retryInterval));
        const status = await connection.getSignatureStatus(signature);

        if (status?.value?.confirmationStatus === "confirmed") {
          confirmed = true;

          if (status?.value?.err) {
            setLoading(false);
            setAirDrop(false);

            throw new Error("Transaction failed");
          } else {
            setAmount("");
            setAirDrop(false);
            setLoading(false);
            toast({
              title: `${parseFloat(amount)} SOL has been Airdropped`,
            });
            const txn = await fetchTransactions(wallet, connection, 1);
            setTransactionHistory((prevState) => [...txn, ...prevState]);
          }
        }

        attempts += 1;
      }

      if (!confirmed) {
        setLoading(false);
        setAirDrop(false);
        toast({
          variant: "destructive",
          title: `Airdrop failed`,
        });
        throw new Error("Transaction confirmation timeout");
      }
      setAmount("");
      setAirDrop(false);
      setLoading(false);
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    catch (error:any) {
      console.log({error});
      
      console.error("Airdrop failed:", error);
      setLoading(false);
      setAirDrop(false);
      const description = "Airdrop failed. Please try again later.";

      toast({
        variant: "destructive",
        title: "Airdrop failed",
      description: error.message ? error.response.data.error.message: description,
      });
    } finally {
      fetchBalance(wallet, connection).then((balance) => {
        setSolBalance(balance);
      });
    }
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50 ">
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
          max={10}
          className="border border-gray-500 p-2 rounded w-full mb-4 bg-gray-700 text-white"
          placeholder="Amount 0-10"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          disabled={loading}
        />
        <button
          onClick={sendAirdrop}
          className="w-full py-2 bg-[#4b0982] hover:bg-[#8b2fd6d5] text-white rounded  disabled:opacity-50"
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

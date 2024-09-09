"use client";

import { useToast } from "@/hooks/use-toast";
import React, { useState } from "react";
import {
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import LoadingSpinner from "./Loading";
import { fetchBalance } from "./GetBalance";
import { useSetRecoilState } from "recoil";
import { solBalanceState } from "@/app/RecoilProvider";

const SendSol = () => {
  const wallet = useWallet();
  const { connection } = useConnection();
  const [sendSol, setSendSol] = useState({ toPublicKey: "", amount: "" });
  const [loading, setLoading] = useState(false);
  const setSolBalance = useSetRecoilState(solBalanceState);
  const { toast } = useToast();

  async function sendSolana() {
    if (!wallet || !wallet.connected || !wallet.publicKey) {
      // alert("Please connect your wallet");
      toast({
        variant: "destructive",
        title: `connect your wallet`,
      });
      return;
    }
    setLoading(true);
    try {
      const amt = parseFloat(sendSol.amount);
      const transaction = new Transaction();
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: wallet.publicKey,
          toPubkey: new PublicKey(sendSol.toPublicKey),
          lamports: amt * LAMPORTS_PER_SOL,
        })
      );
      const signature = await wallet.sendTransaction(transaction, connection);
      console.log("Transaction signature:", signature);
      let confirmed = false;
      while (!confirmed) {
        const status = await connection.getSignatureStatus(signature);

        if (status?.value?.confirmationStatus === "confirmed") {
          confirmed = true;
          console.log("Transaction confirmed");
        } else if (status?.value?.err) {
          throw new Error("Transaction failed");
        }
      }

      setLoading(false);
    } catch (error) {
      console.error("Failed to send SOL:", error);
      alert(`Failed to send SOL`);
    } finally {
      toast({
        title: `${parseFloat(sendSol.amount)} SOL has been transferred`,
      });
      setSendSol({ toPublicKey: "", amount: "" });
      fetchBalance(wallet, connection).then((balance) => {
        setSolBalance(balance);
      });
    }
  }

  return (
    <div className="mt-4 w-[50%] border rounded-xl border-gray-200 py-4 px-4">
      <h2 className="text-xl font-semibold">Send SOL</h2>
      <label
        htmlFor="SendTO"
        className="block text-sm font-medium text-gray-700 mt-4 "
      >
        Send SOL
      </label>
      <input
        id="sendTo"
        name="sendTo"
        type="text"
        className="border border-gray-300 p-2 rounded w-[60%] mt-1"
        value={sendSol.toPublicKey}
        onChange={(e) =>
          setSendSol({ ...sendSol, toPublicKey: e.target.value })
        }
        disabled={loading}
      />
      <label
        htmlFor="amountToSend"
        className="block text-sm font-medium text-gray-700"
      >
        Amount
      </label>
      <input
        id="amountToSend"
        name="amountToSend"
        type="number"
        className="border border-gray-300 p-2 rounded w-[60%] mt-1"
        value={sendSol.amount}
        onChange={(e) => setSendSol({ ...sendSol, amount: e.target.value })}
        disabled={loading}
      />
      <br />
      <button
        onClick={sendSolana}
        className="mt-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
        disabled={loading}
      >
        {loading ? <LoadingSpinner message="Sending..." /> : "Send"}
      </button>
    </div>
  );
};

export default SendSol;

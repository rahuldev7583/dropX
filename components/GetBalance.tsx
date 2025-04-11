import { solBalanceState } from "@/app/RecoilProvider";
import React, { useEffect, useState, useRef } from "react";
import { useRecoilState } from "recoil";
import {
  useConnection,
  useWallet,
  WalletContextState,
} from "@solana/wallet-adapter-react";
import { Connection, LAMPORTS_PER_SOL } from "@solana/web3.js";

export async function fetchBalance(
  wallet: WalletContextState,
  connection: Connection
) {
  if (!wallet.publicKey) {
    return "";
  }
  try {
    const solBal =
      (await connection.getBalance(wallet.publicKey)) / LAMPORTS_PER_SOL;
    const balance = solBal.toFixed(4).toString();
    return balance;
  } catch (error) {
    console.error("Failed to fetch balance:", error);
    return "";
  }
}

const GetBalance = () => {
  const wallet = useWallet();
  const { connection } = useConnection();
  const [solBalance, setSolBalance] = useRecoilState(solBalanceState);
  const [lastPublicKey, setLastPublicKey] = useState<string | null>(null);
  const isFetching = useRef(false);

  useEffect(() => {
    const updateBalance = async () => {
      if (wallet.connected && wallet.publicKey) {
        const currentPublicKey = wallet.publicKey.toBase58();

        if (currentPublicKey !== lastPublicKey && !isFetching.current) {
          isFetching.current = true;
          const balance = await fetchBalance(wallet, connection);
          setSolBalance(balance);
          setLastPublicKey(currentPublicKey);
          isFetching.current = false;
        }
      } else {
        setSolBalance("");
        setLastPublicKey(null);
      }
    };

    updateBalance();
  }, [wallet.connected, wallet.publicKey, connection, ]);

  return (
    <div className="ml-10">
      <h2 className="font-semibold text-xl">
        Available Balance: {parseFloat(solBalance) ? `${solBalance} SOL` : "0"}
      </h2>
    </div>
  );
};

export default GetBalance;

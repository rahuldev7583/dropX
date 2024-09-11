import { solBalanceState } from "@/app/RecoilProvider";
import React, { useEffect } from "react";
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
    const balance = solBal.toFixed(2).toString();
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

  useEffect(() => {
    if (wallet.connected) {
      fetchBalance(wallet, connection).then((balance) =>
        setSolBalance(balance)
      );
    } else {
      setSolBalance("");
    }
  }, [wallet.publicKey, connection]);

  return (
    <div className="ml-10 mt-8">
      <h2 className="mt-2 font-semibold text-xl">
        Available Balance: {parseFloat(solBalance) ? `${solBalance} SOL` : "0"}
      </h2>
    </div>
  );
};

export default GetBalance;

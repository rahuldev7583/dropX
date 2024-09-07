import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { TokenListProvider, TokenInfo } from "@solana/spl-token-registry";

import {
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import React, { useEffect, useState } from "react";
import LoadingSpinner from "./Loading";
import { getAccount, getMint } from "@solana/spl-token";

interface TokenDetail {
  mint: string;
  balance: string;
  symbol: string;
  name: string;
  logo: string;
}

const Airdrop = () => {
  const wallet = useWallet();
  const { connection } = useConnection();
  const [amount, setAmount] = useState("");
  const [balance, setBalance] = useState("");
  const [sendSol, setSendSol] = useState({ toPublicKey: "", amount: "" });
  const [loadingAirdrop, setLoadingAirdrop] = useState(false);
  const [loadingSendSol, setLoadingSendSol] = useState(false);
  const [tokens, setTokens] = useState<TokenDetail[]>([]);

  async function sendAirdrop() {
    if (!wallet.publicKey) return;
    setLoadingAirdrop(true);
    try {
      const amt = parseFloat(amount);
      await connection.requestAirdrop(wallet.publicKey, amt * LAMPORTS_PER_SOL);
      alert("Airdropped SOL");
      setAmount("");
    } catch (error) {
      console.error("Airdrop failed:", error);
      alert("Airdrop failed");
    } finally {
      setLoadingAirdrop(false);
      setAmount("");
      fetchBalance();
    }
  }

  async function fetchBalance() {
    if (!wallet.publicKey) return;
    try {
      const balance =
        (await connection.getBalance(wallet.publicKey)) / LAMPORTS_PER_SOL;
      setBalance(balance.toFixed(3).toString());
    } catch (error) {
      console.error("Failed to fetch balance:", error);
    }
  }

  async function sendSolana() {
    if (!wallet || !wallet.connected || !wallet.publicKey) {
      alert("Please connect your wallet");
      return;
    }

    setLoadingSendSol(true);

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
      alert("Sent " + sendSol.amount + " SOL to " + sendSol.toPublicKey);

      setSendSol({ toPublicKey: "", amount: "" });
      setLoadingSendSol(false);
      await fetchBalance();
    } catch (error) {
      console.error("Failed to send SOL:", error);
      alert(`Failed to send SOL`);
    }
  }

  async function getTokens() {
    if (!wallet.publicKey) return;

    try {
      const tokenList = await new TokenListProvider().resolve();
      const tokenMap = tokenList.getList().reduce((map, item) => {
        map.set(item.address, item);
        return map;
      }, new Map<string, TokenInfo>());

      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
        wallet.publicKey,
        {
          programId: new PublicKey(
            "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
          ),
        }
      );

      const tokenDetails = await Promise.all(
        tokenAccounts.value.map(async ({ pubkey, account }) => {
          const mint = new PublicKey(account.data.parsed.info.mint);
          const tokenAccount = await getAccount(connection, pubkey);
          const mintInfo = await getMint(connection, mint);

          const balance = Number(tokenAccount.amount) / 10 ** mintInfo.decimals;
          const formattedBalance = balance.toFixed(2);

          const tokenMetadata = tokenMap.get(mint.toBase58());
          const symbol = tokenMetadata
            ? tokenMetadata.symbol
            : `${mint.toBase58().slice(0, 4)} ...`;
          const name = tokenMetadata ? tokenMetadata.name : "Unknown Token";
          const logo = tokenMetadata?.logoURI || "";
          // console.log(tokenMetadata);

          return {
            mint: mint.toBase58(),
            balance: formattedBalance,
            name,
            logo,
            symbol,
          };
        })
      );
      console.log(tokenDetails);

      setTokens(tokenDetails);
    } catch (error) {
      console.error("Error fetching token balances:", error);
    }
  }

  useEffect(() => {
    if (wallet.connected) {
      fetchBalance();
      getTokens();
    } else {
      setAmount("");
      setBalance("");
      setSendSol({ toPublicKey: "", amount: "" });
      setTokens([]);
      setLoadingAirdrop(false);
      setLoadingSendSol(false);
    }
  }, [wallet.publicKey, connection]);

  return (
    <div className="p-4  ml-[30%]">
      {/* <h1 className="text-lg font-semibold">
        Your Public Address: {wallet.publicKey?.toString()}
      </h1> */}
      <p className="mt-2 font-semibold text-2xl">
        SOL Balance: {parseFloat(balance) ? `${balance} SOL` : "0"}
      </p>
      <h2 className="text-xl font-semibold mt-2">Token Balances</h2>
      <ul>
        {tokens.map((token, index) => (
          <li key={index}>
            <div className="flex">
              {token.logo.length != 0 ? (
                <img className="w-8" src={token.logo} alt="token-log" />
              ) : (
                "$"
              )}
              <p className="font-semibold text-2xl">
                {token.balance}
                {token.symbol}
              </p>
            </div>
          </li>
        ))}
      </ul>
      {/* Airdrop Section */}
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
          disabled={loadingAirdrop}
        />
        <br />
        <button
          onClick={sendAirdrop}
          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          disabled={loadingAirdrop}
        >
          {loadingAirdrop ? (
            <LoadingSpinner message="Airdropping..." />
          ) : (
            "Request Airdrop"
          )}
        </button>
      </div>

      {/* Send SOL Section */}
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
          disabled={loadingSendSol}
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
          disabled={loadingSendSol}
        />
        <br />
        <button
          onClick={sendSolana}
          className="mt-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          disabled={loadingSendSol}
        >
          {loadingSendSol ? <LoadingSpinner message="Sending..." /> : "Send"}
        </button>
      </div>
    </div>
  );
};

export default Airdrop;

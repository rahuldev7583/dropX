import { transactionHistoryState } from "@/app/RecoilProvider";
import { TokenInfo, TokenListProvider } from "@solana/spl-token-registry";
import {
  useConnection,
  useWallet,
  WalletContextState,
} from "@solana/wallet-adapter-react";
import { Connection, LAMPORTS_PER_SOL } from "@solana/web3.js";
import React, { useEffect, useRef, useState } from "react";
import { useRecoilState } from "recoil";

export const fetchSignatures = async (
  wallet: WalletContextState,
  connection: Connection,
  limit: number
) => {
  if (!wallet.publicKey) {
    return "";
  }
  try {
    const signatures = [];
    const signatureArray = await connection.getSignaturesForAddress(
      wallet.publicKey,
      {
        limit: limit,
      }
    );
    console.log(signatureArray);

    for (let i = 0; i < signatureArray.length; i++) {
      signatures.push({
        blockTime: signatureArray[i].blockTime,
        signature: signatureArray[i].signature,
        err: signatureArray[i].err,
      });
    }
    return signatures;
  } catch (err) {
    console.log("Failed to fetch signatues", err);
    return "";
  }
};

export const fetchTransactions = async (
  wallet: WalletContextState,
  connection: Connection,
  limit: number
) => {
  const signatures = await fetchSignatures(wallet, connection, limit);
  console.log(signatures);
  if (signatures === "") {
    return [];
  }
  const filteredSigns = signatures.map((sign) => sign.signature);
  const transactions = await connection.getParsedTransactions(filteredSigns);
  console.log(transactions);
  const validTransactions = transactions.filter(
    (txn) => txn?.meta?.err === null
  );
  console.log(validTransactions);
  const tokenList = await new TokenListProvider().resolve();
  const tokenMap = tokenList.getList().reduce((map, item) => {
    map.set(item.address, item);
    return map;
  }, new Map<string, TokenInfo>());

  const newTxn = await Promise.all(
    validTransactions.map(async (txn) => {
      const result = {
        type: "",
        walletKey: "",
        solAmount: "",
        tokenAmount: "",
        mint: "",
        signature: txn?.transaction.signatures[0]
          ? txn?.transaction.signatures[0]
          : "",
        tokenMetadata: {
          name: "",
          image: "",
          symbol: "",
        },
        formattedDate: txn?.blockTime
          ? new Date(txn.blockTime * 1000).toLocaleString()
          : "",
      };

      const preTokenBalances = txn?.meta?.preTokenBalances;
      const postTokenBalances = txn?.meta?.postTokenBalances;

      if (
        txn?.transaction.message.accountKeys[0].signer &&
        txn?.transaction.message.accountKeys[0].pubkey.toString() ===
          wallet.publicKey?.toString()
      ) {
        result.type = "Send";
        result.walletKey =
          txn.transaction.message.accountKeys[1].pubkey.toString();
        if (
          preTokenBalances &&
          postTokenBalances &&
          preTokenBalances.length > 0 &&
          postTokenBalances.length > 0
        ) {
          const mint = preTokenBalances[1]?.mint?.toString();

          result.tokenAmount =
            preTokenBalances[1].uiTokenAmount.uiAmount &&
            postTokenBalances[1].uiTokenAmount.uiAmount
              ? (
                  postTokenBalances[1].uiTokenAmount.uiAmount -
                  preTokenBalances[1].uiTokenAmount.uiAmount
                )
                  .toFixed(2)
                  .toString()
              : "";
          result.mint = mint;

          const tokenMetadata = tokenMap.get(mint);
          if (tokenMetadata) {
            result.tokenMetadata = {
              name: tokenMetadata.name,
              symbol: tokenMetadata.symbol,
              image: tokenMetadata.logoURI || "",
            };
          }
        } else {
          result.solAmount = txn.meta?.preBalances[0]
            ? (
                (txn.meta?.preBalances[0] - txn.meta?.postBalances[0]) /
                LAMPORTS_PER_SOL
              )
                .toFixed(3)
                .toString()
            : "";
        }
      } else if (
        txn?.transaction.message.accountKeys[0].signer &&
        txn?.transaction.message.accountKeys[0].pubkey.toString() !==
          wallet.publicKey?.toString()
      ) {
        result.type = "Received";
        result.walletKey =
          txn.transaction.message.accountKeys[0].pubkey.toString();
        result.solAmount = txn.meta?.preBalances[1]
          ? (
              (txn.meta?.postBalances[1] - txn.meta?.preBalances[1]) /
              LAMPORTS_PER_SOL
            )
              .toFixed(3)
              .toString()
          : "";
      }

      return result;
    })
  );

  return newTxn;
};

interface HistoryProps {
  onClose: () => void;
}

export const GetTransaction = ({ onClose }: HistoryProps) => {
  const wallet = useWallet();
  const { connection } = useConnection();
  const [lastPublicKey, setLastPublicKey] = useState<string | null>(null);
  const isFetching = useRef(false);
  const [transactionHistory, setTransactionHistory] = useRecoilState(
    transactionHistoryState
  );

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const updateTransaction = async () => {
      if (wallet.connected && wallet.publicKey) {
        const currentPublicKey = wallet.publicKey.toBase58();

        if (currentPublicKey !== lastPublicKey && !isFetching.current) {
          isFetching.current = true;

          const txn = await fetchTransactions(wallet, connection, 10);
          console.log(txn);
          setTransactionHistory(() => [...txn]);
          console.log(transactionHistory);
          setLoading(false);
          setLastPublicKey(currentPublicKey);
          isFetching.current = false;
        }
      } else {
        setLastPublicKey(null);
        setLoading(false);
      }
    };

    updateTransaction();
  }, [wallet.connected, wallet.publicKey, connection]);

  return !loading ? (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
      <div className="relative bg-slate-800 text-gray-100 px-8 py-6 pb-20 rounded-xl w-[75%] shadow-lg top-6 max-h-[80vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 bg-transparent text-gray-100 text-2xl"
        >
          ✖
        </button>
        <h1 className="text-xl font-semibold mb-8 text-center">
          Transaction History
        </h1>
        <div className="grid grid-cols-2 gap-4">
          {transactionHistory.map((txn, idx) => (
            <div
              key={idx}
              className="border-2 border-white p-4 rounded-md w-full "
            >
              <h2 className="font-semibold">{txn.type}</h2>
              <p>
                {txn.type === "Send" ? "To" : "From"}: {txn.walletKey}
              </p>
              {txn.solAmount && <p>{txn.solAmount} SOL</p>}
              {txn.tokenAmount && (
                <p>
                  {txn.tokenAmount} {txn.tokenMetadata.symbol}
                </p>
              )}
              <p>Date: {txn.formattedDate}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  ) : (
    <div className="ml-[48%] mt-10 z-10 w-16 h-16 border-4 border-slate-400 border-t-transparent border-solid rounded-full animate-spin"></div>
  );
};

export default GetTransaction;

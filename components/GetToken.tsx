"use client";
import { tokenState } from "@/app/RecoilProvider";
import {
  useConnection,
  useWallet,
  WalletContextState,
} from "@solana/wallet-adapter-react";
import React, { useEffect, useRef, useState } from "react";
import { useRecoilState } from "recoil";
import { TokenListProvider, TokenInfo } from "@solana/spl-token-registry";
import { Connection, PublicKey } from "@solana/web3.js";
import { getAccount, getMint } from "@solana/spl-token";
import { HiCurrencyDollar } from "react-icons/hi";

export async function getTokens(
  wallet: WalletContextState,
  connection: Connection
) {
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
        programId: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
      }
    );

    let idCounter = 0;

    const tokenDetails = await Promise.all(
      tokenAccounts.value.map(async ({ pubkey, account }) => {
        const mint = new PublicKey(account.data.parsed.info.mint);
        const tokenAccount = await getAccount(connection, pubkey);
        const mintInfo = await getMint(connection, mint);

        const balance = Number(tokenAccount.amount) / 10 ** mintInfo.decimals;
        const formattedBalance = balance.toFixed(2);

        const tokenMetadata = tokenMap.get(mint.toBase58());
        const symbol = tokenMetadata ? tokenMetadata.symbol : "Unknown";
        const name = tokenMetadata ? tokenMetadata.name : "Unknown";
        const logo = tokenMetadata?.logoURI || "";

        return {
          id: idCounter++,
          mint: mint.toBase58(),
          balance: formattedBalance,
          name,
          logo,
          symbol,
        };
      })
    );
    return tokenDetails;
  } catch (error) {
    console.error("Error fetching token balances:", error);
  }
}

const GetToken = () => {
  const wallet = useWallet();
  const { connection } = useConnection();
  const [tokens, setTokens] = useRecoilState(tokenState);
  const [tokenStatus, setTokenStatus] = useState(false);
  const [lastPublicKey, setLastPublicKey] = useState<string | null>(null);
  const isFetching = useRef(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const updateTokens = async () => {
      if (wallet.connected && wallet.publicKey) {
        const currentPublicKey = wallet.publicKey.toBase58();
        if (currentPublicKey !== lastPublicKey && !isFetching.current) {
          isFetching.current = true;
          const tokens = await getTokens(wallet, connection);
          setTokens(tokens || []);
          setLastPublicKey(currentPublicKey);
          setTokenStatus(true);
          isFetching.current = false;
          setLoading(false);
          // console.log(tokens);
        }
      } else {
        setTokenStatus(false);
        setTokens([]);
        setLastPublicKey(null);
        setLoading(false);
      }
    };

    updateTokens();
  }, [wallet.connected, wallet.publicKey, connection]);

  return !loading ? (
    <div className="ml-[32%] mt-2 z-10 ">
      {tokenStatus && (
        <div className=" rounded-xl pb-8 pr-4 pl-8 w-[70%] ">
          <h2 className="font-semibold text-xl  ml-[25%]">Available Tokens</h2>

          {tokens.length === 0 && (
            <p className="text-2xl font-semibold ml-40 mt-4">
              {`You don't have any tokens`}
            </p>
          )}
          <ul className="mt-6 grid grid-cols-2">
            {tokens.map((token) => {
              if (parseFloat(token.balance) != 0) {
                return (
                  <li key={token.id} className="mt-4">
                    <div className="flex">
                      {token.logo !== "" ? (
                        <img
                          className="w-8 ml-2"
                          src={token.logo}
                          alt="token-logo"
                        />
                      ) : (
                        <HiCurrencyDollar className="" size={36} />
                      )}
                      <p className="font-semibold text-xl ml-2 mt-1">
                        {token.balance}
                      </p>
                      <p className="font-semibold text-lg ml-2 mt-1">
                        {" "}
                        {token.symbol}
                      </p>
                    </div>
                  </li>
                );
              }
            })}
          </ul>
        </div>
      )}
    </div>
  ) : (
    <div className="ml-[48%] mt-10 z-10 w-16 h-16 border-4 border-slate-400 border-t-transparent border-solid rounded-full animate-spin"></div>
  );
};

export default GetToken;

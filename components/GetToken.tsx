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
  const isFetching = useRef(false); // Use useRef to track fetch status

  useEffect(() => {
    const updateTokens = async () => {
      if (wallet.connected && wallet.publicKey) {
        const currentPublicKey = wallet.publicKey.toBase58();

        // Fetch tokens only if the wallet's public key has changed and no fetch is currently in progress
        if (currentPublicKey !== lastPublicKey && !isFetching.current) {
          isFetching.current = true;
          const tokens = await getTokens(wallet, connection);
          setTokens(tokens || []);
          setLastPublicKey(currentPublicKey);
          setTokenStatus(true);
          isFetching.current = false;
        }
      } else {
        setTokenStatus(false);
        setTokens([]);
        setLastPublicKey(null);
      }
    };

    updateTokens();
  }, [wallet.connected, wallet.publicKey, connection]);

  return (
    <div className="ml-[27%] mt-6">
      {tokenStatus && (
        <div className="border-4 border-gray-200 rounded-xl pt-4 pb-8 pr-4 pl-8 w-[70%]">
          <h2 className="font-semibold text-xl mt-2 ml-[35%]">
            Available Tokens
          </h2>

          {tokens.length === 0 && (
            <p className="text-2xl font-semibold ml-40 mt-4">
              {`You don't have any tokens`}
            </p>
          )}
          <ul className="mt-2 grid grid-cols-3">
            {tokens.map((token) => (
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
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default GetToken;

"use client";
import { tokenState } from "@/app/RecoilProvider";
import {
  useConnection,
  useWallet,
  WalletContextState,
} from "@solana/wallet-adapter-react";
import React, { useEffect, useState } from "react";
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

  useEffect(() => {
    if (wallet.connected) {
      getTokens(wallet, connection).then((tokens) => {
        setTokens(tokens || []);

        setTokenStatus(true);
      });
    } else {
      setTokenStatus(false);
      setTokens([]);
    }
  }, [wallet.publicKey, connection]);

  return (
    <div className="ml-[27%] mt-6">
      {tokenStatus && (
        <div className="border-4 border-gray-200 rounded-xl pt-4 pb-8 pr-4 pl-8 w-[70%] ">
          <h2 className=" font-semibold text-xl mt-2 ml-[35%]">
            Available Tokens
          </h2>
          <ul className="mt-2  grid grid-cols-3">
            {tokens.map((token) => (
              <li key={token.id} className="mt-4">
                <div className="flex">
                  {token.logo != "" ? (
                    <img
                      className="w-8 ml-2"
                      src={token.logo}
                      alt="token-log"
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

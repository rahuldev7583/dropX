import { tokenState } from "@/app/RecoilProvider";
import { useToast } from "@/hooks/use-toast";
import {
  createTransferInstruction,
  getAssociatedTokenAddress,
  getAccount,
  createAssociatedTokenAccountInstruction,
} from "@solana/spl-token";
import {
  PublicKey,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import React, { useState } from "react";
import { useRecoilState } from "recoil";
import LoadingSpinner from "./Loading";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { HiCurrencyDollar } from "react-icons/hi";
import { getTokens } from "./GetToken";

const SendToken = () => {
  const wallet = useWallet();
  const { connection } = useConnection();
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [sendToken, setSendToken] = useState({
    id: "",
    tokenMint: "",
    toPublicKey: "",
    amount: "",
  });
  const [tokens, setTokens] = useRecoilState(tokenState);

  const configureAndSendTransaction = async (
    transaction: Transaction,
    feePayer: PublicKey
  ) => {
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.feePayer = feePayer;
    transaction.recentBlockhash = blockhash;

    const signedTransaction = await wallet.signTransaction!(transaction);
    const signature = await connection.sendRawTransaction(
      signedTransaction.serialize(),
      { skipPreflight: false }
    );

    return signature;
  };

  async function sendSPLToken() {
    if (!wallet.publicKey || !wallet.signTransaction) {
      toast({
        variant: "destructive",
        title: "Wallet not connected",
        description: "Please connect your wallet",
      });
      return;
    }
    setLoading(true);

    try {
      const amt = parseFloat(sendToken.amount);
      if (isNaN(amt) || amt <= 0) {
        throw new Error("Invalid amount");
      }
      const sendTo = new PublicKey(sendToken.toPublicKey);
      const tokenMintAddress = new PublicKey(sendToken.tokenMint);

      const transactionInstructions: TransactionInstruction[] = [];
      const senderATA = await getAssociatedTokenAddress(
        tokenMintAddress,
        wallet.publicKey
      );

      const fromAccount = await getAccount(connection, senderATA);

      const receiverATA = await getAssociatedTokenAddress(
        tokenMintAddress,
        sendTo
      );

      if (!(await connection.getAccountInfo(receiverATA))) {
        transactionInstructions.push(
          createAssociatedTokenAccountInstruction(
            wallet.publicKey,
            receiverATA,
            sendTo,
            tokenMintAddress
          )
        );
      }

      transactionInstructions.push(
        createTransferInstruction(
          fromAccount.address,
          receiverATA,
          wallet.publicKey,
          BigInt(Math.round(amt * Math.pow(10, 6)))
        )
      );

      const transaction = new Transaction().add(...transactionInstructions);
      const signature = await configureAndSendTransaction(
        transaction,
        wallet.publicKey
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
      }

      setLoading(false);
    } catch (error) {
      console.error("Error sending SPL token:", error);
      toast({
        variant: "destructive",
        title: "Error sending token",
        description:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    } finally {
      toast({
        title: "Transfer successful",
        description: `Transferred ${parseFloat(
          sendToken.amount
        )} tokens to ${sendToken.toPublicKey.toString()}`,
      });
      getTokens(wallet, connection).then((tokens) => {
        setTokens(tokens || []);
      });
      setSendToken({ id: "", tokenMint: "", amount: "", toPublicKey: "" });
    }
  }

  return (
    <div className="mt-4 w-[50%] border rounded-xl border-gray-200 py-4 px-4">
      <h2 className="text-xl font-semibold">Send Tokens</h2>
      <Select
        onValueChange={(value) => {
          const selectedToken = tokens.find(
            (token) => token.id.toString() === value
          );
          if (selectedToken) {
            setSendToken({
              ...sendToken,
              id: selectedToken.id.toString(),
              tokenMint: selectedToken.mint,
            });
          }
        }}
      >
        <SelectTrigger className="w-[60%] text-lg  px-2 py-6  mt-4">
          <SelectValue placeholder="Select a token" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel className="">Select Token</SelectLabel>
            {tokens.map((token) => (
              <SelectItem value={token.id.toString()} key={token.id}>
                <div className="flex">
                  {token.logo != "" ? (
                    <img className="w-8" src={token.logo} alt="token-log" />
                  ) : (
                    <HiCurrencyDollar className="" size={36} />
                  )}
                  <p className="font-semibold text-lg ml-2 mt-1">
                    {" "}
                    {token.symbol}
                  </p>{" "}
                </div>
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      <label
        htmlFor="SendTO"
        className="block text-sm font-medium text-gray-700 mt-4 "
      >
        Send To
      </label>
      <input
        id="sendTo"
        name="sendTo"
        type="text"
        className="border border-gray-300 p-2 rounded w-[60%] mt-1"
        value={sendToken.toPublicKey}
        onChange={(e) =>
          setSendToken({ ...sendToken, toPublicKey: e.target.value })
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
        value={sendToken.amount}
        onChange={(e) => setSendToken({ ...sendToken, amount: e.target.value })}
        disabled={loading}
      />
      <br />
      <button
        onClick={sendSPLToken}
        className="mt-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
        disabled={loading}
      >
        {loading ? <LoadingSpinner message="Sending..." /> : "Send"}
      </button>
    </div>
  );
};

export default SendToken;

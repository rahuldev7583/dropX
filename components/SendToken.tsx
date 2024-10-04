import { sendTokenState, tokenState } from "@/app/RecoilProvider";
import { useToast } from "@/hooks/use-toast";
import {
  createTransferInstruction,
  getAssociatedTokenAddress,
  getAccount,
  createAssociatedTokenAccountInstruction,
  createTransferCheckedInstruction,
} from "@solana/spl-token";
import {
  PublicKey,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import React, { useState } from "react";
import { useRecoilState, useSetRecoilState } from "recoil";
import LoadingSpinner from "./Loading";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { HiCurrencyDollar } from "react-icons/hi";
import { getTokens } from "./GetToken";
interface SendTokenProps {
  onClose: () => void;
}

const SendToken = ({ onClose }: SendTokenProps) => {
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
  const setSendTokenStatus = useSetRecoilState(sendTokenState);

  async function sendSPLToken() {
    if (!wallet.publicKey || !wallet.signTransaction) return;
    const amt = parseFloat(sendToken.amount);
    const selectedToken = tokens.find(
      (token) => token.id.toString() === sendToken.id
    );

    if (!selectedToken) {
      toast({
        variant: "destructive",
        title: "Invalid Token",
        description: "The selected token is not available.",
      });
      return;
    }

    if (isNaN(amt) || amt <= 0) {
      toast({
        variant: "destructive",
        title: `Please enter a valid amount`,
      });
      setSendToken({ ...sendToken, amount: "" });
      return;
    }

    if (amt > parseFloat(selectedToken.balance)) {
      toast({
        variant: "destructive",
        title: `Insufficient balance`,
      });
      setSendToken({ ...sendToken, amount: "" });
      return;
    }

    let sendTo: PublicKey;

    try {
      sendTo = new PublicKey(sendToken.toPublicKey);
    } catch (error) {
      toast({
        variant: "destructive",
        title: `Invalid Recipient's address`,
      });
      setSendToken({ ...sendToken, toPublicKey: "" });
      return;
    }
    if (!PublicKey.isOnCurve(sendTo)) {
      toast({
        variant: "destructive",
        title: `Invalid Recipient's address on curve`,
      });
      return;
    }

    try {
      setLoading(true);

      const tokenMintAddress = new PublicKey(sendToken.tokenMint);
      const transactionInstructions: TransactionInstruction[] = [];

      const senderATA = await getAssociatedTokenAddress(
        tokenMintAddress,
        wallet.publicKey
      );
      const fromATA = await getAccount(connection, senderATA);
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
          fromATA.address,
          receiverATA,
          wallet.publicKey,
          BigInt(Math.round(amt * Math.pow(10, 6)))
        )
      );

      transactionInstructions.push(
        createTransferCheckedInstruction(
          fromATA.address,
          tokenMintAddress,
          receiverATA,
          wallet.publicKey,
          BigInt(Math.round(amt * Math.pow(10, 6))),
          6
        )
      );

      const transaction = new Transaction().add(...transactionInstructions);
      console.log(transaction);

      const latestBlockHash = await connection.getLatestBlockhash();
      transaction.feePayer = wallet.publicKey;
      transaction.recentBlockhash = latestBlockHash.blockhash;
      console.log(transaction);
      const signedTransaction = await wallet.signTransaction!(transaction);
      console.log(signedTransaction);
      const signature = await connection.sendRawTransaction(
        signedTransaction.serialize(),
        { skipPreflight: false }
      );
      console.log(signature);

      let confirmed = false;
      let attempts = 0;
      const maxAttempts = 10;
      const retryInterval = 2000;

      while (!confirmed && attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, retryInterval));
        const status = await connection.getSignatureStatus(signature);
        console.log(status);

        if (status?.value?.confirmationStatus === "confirmed") {
          confirmed = true;
          console.log("Transaction confirmed");
          if (status?.value?.err) {
            setLoading(false);

            throw new Error("Transaction failed");
          } else {
            toast({
              title: `Transfer Successful`,
            });
          }
        }

        attempts += 1;
      }

      if (!confirmed) {
        setLoading(false);
        toast({
          variant: "destructive",
          title: `Transfer failed`,
        });
        throw new Error("Transaction confirmation timeout");
      }

      setLoading(false);

      setSendToken({ id: "", tokenMint: "", amount: "", toPublicKey: "" });
      setSendTokenStatus(false);
    } catch (error) {
      console.error("Error sending SPL token:", error);
      toast({
        variant: "destructive",
        title: "Transfer failed",
      });
      setLoading(false);

      setSendToken({ id: "", tokenMint: "", amount: "", toPublicKey: "" });
    } finally {
      getTokens(wallet, connection).then((tokens) => {
        setTokens(tokens || []);
      });
    }
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
      <div className="absolute bg-slate-800 text-gray-100 px-8 py-10 rounded-xl w-[35%] shadow-lg top-44">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-100"
        >
          ✖
        </button>
        <h2 className="text-xl font-semibold mb-4">Send Tokens</h2>

        <label
          htmlFor="tokenSelect"
          className="block text-sm font-medium text-gray-300 mb-2"
        >
          Select Token
        </label>
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
          <SelectTrigger className="border border-gray-500 p-2 rounded w-full mb-4 bg-gray-700 text-white">
            <SelectValue placeholder="Select a token" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {tokens.map((token) => (
                <SelectItem value={token.id.toString()} key={token.id}>
                  <div className="flex items-center">
                    {token.logo !== "" ? (
                      <img className="w-8" src={token.logo} alt="token-logo" />
                    ) : (
                      <HiCurrencyDollar className="w-8 h-8" />
                    )}
                    {/* <p className="font-semibold text-lg ml-2">
                      Avaiable {token.balance}
                    </p> */}
                    <p className="font-semibold text-lg ml-2">{token.symbol}</p>
                  </div>
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>

        <label
          htmlFor="tokenSendTo"
          className="block text-sm font-medium text-gray-300 mb-2"
        >
          Recipient&apos;s Public Key
        </label>
        <input
          id="tokenSendTo"
          name="tokenSendTo"
          type="text"
          className="border border-gray-500 p-2 rounded w-full mb-4 bg-gray-700 text-white"
          placeholder="Public Key"
          value={sendToken.toPublicKey}
          onChange={(e) =>
            setSendToken({ ...sendToken, toPublicKey: e.target.value })
          }
          disabled={loading}
        />

        <label
          htmlFor="tokenAmountToSend"
          className="block text-sm font-medium text-gray-300 mb-2"
        >
          Amount
        </label>
        <input
          id="tokenAmountToSend"
          name="tokenAmountToSend"
          type="number"
          min={0}
          className="border border-gray-500 p-2 rounded w-full mb-4 bg-gray-700 text-white"
          placeholder="Amount"
          value={sendToken.amount}
          onChange={(e) =>
            setSendToken({ ...sendToken, amount: e.target.value })
          }
          disabled={loading}
        />

        <button
          onClick={sendSPLToken}
          className="w-full py-2 bg-[#4b0982] hover:bg-[#8b2fd6d5] text-white rounded  disabled:opacity-50"
          disabled={loading}
        >
          {loading ? <LoadingSpinner message="Sending..." /> : "Send Tokens"}
        </button>
      </div>
    </div>
  );
};

export default SendToken;

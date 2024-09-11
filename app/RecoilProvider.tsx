"use client";

import { RecoilRoot, atom } from "recoil";

export const solBalanceState = atom({
  key: "solBalance",
  default: "",
});

export const tokenState = atom({
  key: "tokenState",
  default: [
    {
      id: 0,
      mint: "",
      balance: "",
      symbol: "",
      name: "",
      logo: "",
    },
  ],
});

export const airDropState = atom({
  key: "airDropState",
  default: false,
});

export const sendSolState = atom({
  key: "sendSolState",
  default: false,
});

export const sendTokenState = atom({
  key: "sendTokenState",
  default: false,
});

export const solApi = atom({
  key: "solApi",
  default: {
    url: process.env.NEXT_PUBLIC_DEVNET_SOL_API || "",
    type: "Devnet",
  },
});

export default function RecoilContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RecoilRoot>{children}</RecoilRoot>;
}

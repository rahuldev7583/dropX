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

export default function RecoilContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RecoilRoot>{children}</RecoilRoot>;
}

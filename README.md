# DropX - Solana Wallet dApp

A decentralized application (dApp) built on the Solana blockchain that allows users to view their SOL balance, manage SPL tokens, and perform various transactions.

## Features

- Connect to wallet extensions
- Get SOL balance
- List all SPL tokens owned by the user with metadata
- Airdrop SOL on devnet
- Send SOL on devnet and mainnet
- Send SPL tokens on devnet and mainnet

## Tech Stack

- **Next.js** (v14.2.8): React framework for building the frontend
- **React** (v18.3.1): JavaScript library for building user interfaces
- **TypeScript** (v5): Typed superset of JavaScript
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: Re-usable components built with Radix UI and Tailwind CSS
- **Recoil** (v0.7.7): State management library for React
- **Solana Web3.js** (v1.95.3): Solana blockchain integration library
- **@solana/spl-token** (v0.4.8): Library for interacting with SPL tokens
- **@solana/spl-token-registry** (v0.2.4574): Registry for SPL tokens
- **@solana/wallet-adapter**: Set of libraries for wallet integration

## Prerequisites

- Node.js (v14.0.0 or later)
- pnpm (v6.0.0 or later)
- Solana CLI tools
- A Solana wallet (e.g., Phantom, Solflare)

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/rahuldev7583/dropX.git
   cd dropX
   ```

2. Install Dependencies:

   ```bash
   pnpm install
   ```

3. Set up environment variables:
   Create a \`.env.local\` file in the root directory and add:

   ```env
   NEXT_PUBLIC_MAINNET_SOL_API="your_mainnet_api_url"
   NEXT_PUBLIC_DEVNET_SOL_API="your_devnet_api_url"
   ```

## Switching Networks

- Toggle Switch Button to switch between devnet and mainnet

## Usage

1. Start the development server:

   ```bash
   pnpm run dev
   ```

2. Open your browser and navigate to [http://localhost:3000](http://localhost:3000)
3. Connect your Solana wallet
4. Use the dApp to perform various operations:
   - Request an airdrop (devnet only)
   - Send SOL
   - Send SPL tokens

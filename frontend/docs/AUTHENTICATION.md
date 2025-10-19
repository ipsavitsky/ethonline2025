# Web3 Authentication Implementation

This document describes the SIWE (Sign-In With Ethereum) authentication flow implemented in the frontend using wagmi and ConnectKit.

## Overview

The authentication system uses the SIWE (EIP-4361) standard for secure Web3 wallet-based authentication. It follows a challenge-response pattern with cryptographic signatures to verify wallet ownership.

**Tech Stack:**
- **wagmi**: React hooks for Ethereum wallet interactions
- **ConnectKit**: Beautiful, customizable wallet connection UI
- **WalletConnect**: Support for mobile wallets and dApps
- **SIWE**: Standard for Ethereum-based authentication

## Key Security Features

- **No client-side address trust**: The backend never trusts addresses sent from the frontend
- **Challenge-response authentication**: Uses nonces to prevent replay attacks
- **EIP-191 signatures**: Messages are signed with `personal_sign`
- **HttpOnly cookies**: Session tokens are stored in secure, HttpOnly cookies (not localStorage)
- **ERC-1271 support**: Backend should support smart contract wallets

## Architecture

### Files Created

1. **`lib/wagmi.ts`**: Wagmi configuration
   - Configures wagmi with multiple connectors (injected, WalletConnect, Coinbase)
   - Supports Ethereum mainnet and Sepolia testnet
   - WalletConnect project configuration

2. **`lib/auth.ts`**: Core authentication utilities
   - `getNonce()`: Request nonce from backend
   - `signInWithEthereum()`: Complete SIWE authentication flow with wagmi
   - `checkAuth()`: Verify current authentication status
   - `signOut()`: Logout and clear session

3. **`contexts/WalletContext.tsx`**: React context for wallet state management
   - Uses wagmi hooks (`useAccount`, `useSignMessage`, `useDisconnect`)
   - Manages authentication state (wallet connected ≠ authenticated)
   - Handles wallet account changes automatically
   - Provides `useWallet()` hook for components
   - Separates wallet connection from backend authentication

4. **`app/layout.tsx`**: Root layout with providers
   - WagmiProvider for wallet functionality
   - QueryClientProvider for data fetching
   - ConnectKitProvider for wallet UI
   - WalletProvider for authentication state
   - Toaster for notifications

5. **`app/login/page.tsx`**: Login page with ConnectKit integration
   - ConnectKit modal for wallet selection
   - Supports 300+ wallets via WalletConnect
   - Auto-authentication after wallet connection
   - Beautiful, responsive UI

6. **`app/dashboard/page.tsx`**: Protected dashboard
   - Displays connected wallet address
   - Logout functionality (disconnects wallet + clears session)
   - Auto-redirects to login if not authenticated

## Authentication Flow

### 1. Login Process

```
User clicks "Connect Wallet"
    ↓
Frontend: ConnectKit modal opens with wallet options
    ↓
User selects wallet (MetaMask, WalletConnect, Coinbase, etc.)
    ↓
Frontend: wagmi connects to selected wallet
    ↓
Frontend: WalletContext detects connection, triggers authenticate()
    ↓
Frontend: POST /auth/nonce → Backend returns unique nonce
    ↓
Frontend: Create SIWE message with nonce
    ↓
Frontend: wagmi.signMessage() - User signs message (EIP-191)
    ↓
Frontend: POST /auth/verify with message + signature
    ↓
Backend: Verify signature, recover address, set HttpOnly cookie
    ↓
Frontend: Update isAuthenticated state, redirect to dashboard
```

### Key Distinction: Connected vs Authenticated

- **Connected**: Wallet is connected via wagmi (user can see their address)
- **Authenticated**: Backend session exists (user can access protected routes)

A user can be connected but not authenticated. This happens when:
- They just connected their wallet (haven't signed SIWE message yet)
- They switched accounts (need to re-authenticate)
- Their backend session expired (need to re-authenticate)

### 2. Session Management

- **Session storage**: HttpOnly, Secure, SameSite=Strict cookies
- **Session validation**: Every API call includes `credentials: 'include'`
- **Session check**: `GET /auth/me` returns current user address
- **Automatic logout**: If session expires, user is redirected to login

### 3. Wallet Account Changes

The `WalletContext` uses wagmi's `useAccount` hook to watch for changes:
- If user disconnects wallet → auto-logout from backend
- If user switches accounts → requires re-authentication
- If wallet address doesn't match backend session → clear session

## Required Backend Endpoints

The Go backend must implement these endpoints:

### POST /auth/nonce
Generate and return a unique nonce for SIWE authentication.

**Request**: Empty body
**Response**:
```json
{
  "nonce": "random-unique-string"
}
```

### POST /auth/verify
Verify the SIWE signature and create a session.

**Request**:
```json
{
  "message": "example.com wants you to sign in...",
  "signature": "0x..."
}
```

**Response**:
- Sets HttpOnly cookie with session ID
- Returns success status

```json
{
  "success": true
}
```

### GET /auth/me
Return the currently authenticated user's address.

**Request**: Cookies included
**Response**:
```json
{
  "address": "0x..."
}
```

### POST /auth/logout
Invalidate the current session.

**Request**: Cookies included
**Response**: Success status

## Environment Variables

Create a `.env.local` file:

```bash
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:8080

# WalletConnect Project ID
# Get yours at: https://cloud.walletconnect.com
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=YOUR_PROJECT_ID_HERE
```

### Getting a WalletConnect Project ID

1. Go to https://cloud.walletconnect.com
2. Sign up or log in
3. Create a new project
4. Copy your Project ID
5. Add it to your `.env.local` file

For production deployment on Vercel:
```bash
NEXT_PUBLIC_API_URL=https://your-backend-api.com
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_actual_project_id
```

## Usage in Components

### Using the Wallet Context

```tsx
import { useWallet } from '@/contexts/WalletContext'

function MyComponent() {
  const { address, isConnected, isAuthenticated, authenticate, logout } = useWallet()

  if (!isConnected) {
    return <p>Please connect your wallet</p>
  }

  if (!isAuthenticated) {
    return (
      <div>
        <p>Wallet connected: {address}</p>
        <button onClick={authenticate}>Sign In</button>
      </div>
    )
  }

  return (
    <div>
      <p>Authenticated: {address}</p>
      <button onClick={logout}>Logout</button>
    </div>
  )
}
```

### Using ConnectKit Button

```tsx
import { ConnectKitButton } from 'connectkit'

function Header() {
  return (
    <header>
      <ConnectKitButton />
    </header>
  )
}
```

### Custom ConnectKit Button

```tsx
import { ConnectKitButton } from 'connectkit'
import { Button } from '@/components/ui/button'

function CustomConnect() {
  return (
    <ConnectKitButton.Custom>
      {({ isConnected, show, truncatedAddress, ensName }) => (
        <Button onClick={show}>
          {isConnected ? ensName ?? truncatedAddress : 'Connect Wallet'}
        </Button>
      )}
    </ConnectKitButton.Custom>
  )
}
```

### Protecting Routes

```tsx
'use client'

import { useWallet } from '@/contexts/WalletContext'
import { useRouter } from 'next/navigation'

export default function ProtectedPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading } = useWallet()

  // Important: Check isAuthenticated, not just isConnected
  if (!isAuthenticated && !isLoading) {
    router.push('/login')
    return null
  }

  return <div>Protected content</div>
}
```

### Using wagmi Hooks Directly

You can also use wagmi hooks directly alongside the WalletContext:

```tsx
import { useAccount, useBalance, useEnsName } from 'wagmi'
import { useWallet } from '@/contexts/WalletContext'

function UserProfile() {
  const { address } = useAccount()
  const { data: ensName } = useEnsName({ address })
  const { data: balance } = useBalance({ address })
  const { isAuthenticated } = useWallet()

  if (!isAuthenticated) {
    return <p>Not authenticated</p>
  }

  return (
    <div>
      <p>Name: {ensName ?? address}</p>
      <p>Balance: {balance?.formatted} {balance?.symbol}</p>
    </div>
  )
}
```

## Making Authenticated API Calls

Always include `credentials: 'include'` to send cookies:

```typescript
const response = await fetch(`${API_URL}/api/my-endpoint`, {
  method: 'POST',
  credentials: 'include', // Important!
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(data),
})
```

## Dependencies

- **wagmi**: React hooks for Ethereum (wallet connection, signing, etc.)
- **@tanstack/react-query**: Data fetching library (required by wagmi)
- **connectkit**: Beautiful wallet connection UI
- **@rainbow-me/rainbowkit**: Alternative wallet UI (installed for compatibility)
- **viem**: Low-level Ethereum library (used by wagmi)
- **siwe**: SIWE message creation and parsing
- **sonner**: Toast notifications

## Security Considerations

1. **Never store addresses in localStorage**: Trust only addresses recovered from signatures
2. **HttpOnly cookies only**: Session tokens must be HttpOnly to prevent XSS attacks
3. **CORS configuration**: Backend must allow credentials from frontend domain
4. **Nonce expiration**: Nonces should expire after 5-10 minutes
5. **Session expiration**: Sessions should expire after reasonable time (e.g., 24 hours)
6. **HTTPS in production**: Always use HTTPS in production for cookie security

## Testing

To test the authentication flow:

1. Get a WalletConnect Project ID from https://cloud.walletconnect.com
2. Add it to `.env.local`
3. Install MetaMask or another Web3 wallet (or use mobile via WalletConnect)
4. Start the frontend: `bun run dev`
5. Navigate to `/login`
6. Click "Connect Wallet"
7. Choose your wallet from the ConnectKit modal
8. Approve the connection in your wallet
9. Sign the SIWE authentication message
10. You should be redirected to the dashboard

### Testing WalletConnect (Mobile Wallets)

1. Make sure you have a valid WalletConnect Project ID
2. Click "Connect Wallet" and select "WalletConnect"
3. Scan the QR code with your mobile wallet app
4. Approve the connection on your phone
5. Sign the SIWE message on your phone
6. You should be authenticated on the web app

## Troubleshooting

### "No wallet detected" / Can't connect
- Install MetaMask or another Web3 wallet extension
- Make sure the wallet extension is enabled
- Try using WalletConnect for mobile wallets
- Check browser console for errors

### WalletConnect QR code not working
- Verify `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` is set correctly
- Make sure you're using a valid Project ID from cloud.walletconnect.com
- Try a different mobile wallet app
- Check that your mobile device is on the same network

### "Failed to get nonce from server"
- Check that the backend is running
- Verify `NEXT_PUBLIC_API_URL` is correct
- Check CORS configuration on backend
- Backend must allow credentials from your frontend domain

### "Authentication failed"
- The signature verification failed on the backend
- Check that the nonce hasn't expired
- Ensure the message format matches SIWE standard
- Verify the chainId matches between frontend and backend

### Session not persisting
- Verify cookies are being set by the backend
- Check that `credentials: 'include'` is used in all API calls
- Verify SameSite and Secure cookie attributes
- Check that backend domain matches or CORS is properly configured

### Wallet connected but not authenticated
- This is expected! Connection and authentication are separate steps
- The app should automatically trigger authentication after connection
- If it doesn't, check the browser console for errors
- Manually call `authenticate()` if needed

### Account switching issues
- The app should automatically detect account changes
- You'll need to re-authenticate with the new account
- If state gets stuck, try logging out and connecting again

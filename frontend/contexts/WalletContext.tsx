'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAccount, useSignMessage, useDisconnect } from 'wagmi';
import { checkAuth, signInWithEthereum, signOut } from '@/lib/auth';

interface WalletContextType {
  address: string | null;
  isConnected: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  authenticate: () => Promise<void>;
  logout: () => Promise<void>;
  devModeLogin: () => void; // For dev mode only
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

// Dev mode flag - when true, skip wallet connection and backend authentication entirely
const DEV_MODE = process.env.NEXT_PUBLIC_DEV_MODE === 'true';

// Dev mode wallet provider (no wagmi)
function DevModeWalletProvider({ children }: { children: React.ReactNode }) {
  const [devModeAddress, setDevModeAddress] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const devModeLogin = () => {
    console.log('[DEV MODE] Mock wallet connection');
    const mockAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
    setDevModeAddress(mockAddress);
    setIsAuthenticated(true);
  };

  const logout = () => {
    setDevModeAddress(null);
    setIsAuthenticated(false);
  };

  return (
    <WalletContext.Provider
      value={{
        address: devModeAddress,
        isConnected: !!devModeAddress,
        isAuthenticated,
        isLoading,
        error: null,
        authenticate: async () => {},
        logout: async () => logout(),
        devModeLogin,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

// Production wallet provider (with wagmi)
function ProductionWalletProvider({ children }: { children: React.ReactNode }) {
  const { address: wagmiAddress, isConnected: wagmiConnected, chainId } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { disconnect: wagmiDisconnect } = useDisconnect();
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const address = wagmiAddress || null;
  const isConnected = wagmiConnected;

  // Check backend authentication status on mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const { authenticated, address: backendAddress } = await checkAuth();
        
        // User is authenticated on backend
        if (authenticated && backendAddress) {
          // If wagmi wallet is connected and addresses match, we're good
          if (wagmiConnected && wagmiAddress?.toLowerCase() === backendAddress.toLowerCase()) {
            setIsAuthenticated(true);
          } else {
            // Backend session exists but wallet doesn't match - clear backend session
            await signOut();
            setIsAuthenticated(false);
          }
        } else {
          setIsAuthenticated(false);
        }
      } catch (err) {
        console.error('Failed to check auth status:', err);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, [wagmiAddress, wagmiConnected]);

  // Watch for wallet account changes
  useEffect(() => {
    if (!wagmiConnected) {
      // Wallet disconnected - clear authentication
      if (isAuthenticated) {
        signOut().then(() => setIsAuthenticated(false));
      }
    } else if (wagmiAddress) {
      // Wallet connected or changed - need to verify authentication
      checkAuth().then(({ authenticated, address: backendAddress }) => {
        if (authenticated && backendAddress?.toLowerCase() === wagmiAddress.toLowerCase()) {
          setIsAuthenticated(true);
        } else {
          // Address mismatch or not authenticated - require re-auth
          setIsAuthenticated(false);
        }
      });
    }
  }, [wagmiAddress, wagmiConnected, isAuthenticated]);

  const authenticate = async () => {
    if (!wagmiConnected || !wagmiAddress || !chainId) {
      throw new Error('Please connect your wallet first');
    }

    setIsLoading(true);
    setError(null);

    try {
      // Sign SIWE message and authenticate with backend
      await signInWithEthereum(wagmiAddress, chainId, signMessageAsync);
      setIsAuthenticated(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Authentication failed';
      setError(errorMessage);
      setIsAuthenticated(false);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      // Clear backend session
      await signOut();
      // Disconnect wallet
      wagmiDisconnect();
      setIsAuthenticated(false);
      setError(null);
    } catch (err) {
      console.error('Failed to logout:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <WalletContext.Provider
      value={{
        address,
        isConnected,
        isAuthenticated,
        isLoading,
        error,
        authenticate,
        logout,
        devModeLogin: () => {}, // Not used in production
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

// Export the appropriate provider based on mode
export function WalletProvider({ children }: { children: React.ReactNode }) {
  if (DEV_MODE) {
    return <DevModeWalletProvider>{children}</DevModeWalletProvider>;
  }
  return <ProductionWalletProvider>{children}</ProductionWalletProvider>;
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}

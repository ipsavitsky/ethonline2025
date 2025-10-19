import { SiweMessage } from 'siwe';
import type { Address } from 'viem';
import type { Config } from 'wagmi';

// API base URL - should be set in environment variables
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

/**
 * Get a nonce from the backend for SIWE authentication
 */
async function getNonce(): Promise<string> {
  const response = await fetch(`${API_URL}/auth/nonce`, {
    method: 'POST',
    credentials: 'include', // Important for cookies
  });

  if (!response.ok) {
    throw new Error('Failed to get nonce from server');
  }

  const data = await response.json();
  return data.nonce;
}

/**
 * Sign in with Ethereum using SIWE standard
 * Works with wagmi's signMessage function
 */
export async function signInWithEthereum(
  address: Address,
  chainId: number,
  signMessageAsync: (args: { message: string }) => Promise<`0x${string}`>
): Promise<boolean> {
  try {
    // Step 1: Get nonce from backend
    const nonce = await getNonce();

    // Step 2: Create SIWE message
    const message = new SiweMessage({
      domain: window.location.host,
      address,
      statement: 'Sign in to AuditChain',
      uri: window.location.origin,
      version: '1',
      chainId,
      nonce,
    });

    const messageText = message.prepareMessage();

    // Step 3: Sign the message using wagmi's signMessage (EIP-191)
    const signature = await signMessageAsync({ message: messageText });

    // Step 4: Send signature to backend for verification
    const response = await fetch(`${API_URL}/auth/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Important for receiving the session cookie
      body: JSON.stringify({
        message: messageText,
        signature,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Authentication failed');
    }

    // Backend sets HttpOnly cookie with session ID
    return true;
  } catch (error) {
    console.error('SIWE authentication error:', error);
    throw error;
  }
}

/**
 * Check if user is authenticated by calling /auth/me
 */
export async function checkAuth(): Promise<{ authenticated: boolean; address?: string }> {
  try {
    const response = await fetch(`${API_URL}/auth/me`, {
      credentials: 'include', // Send cookies
    });

    if (!response.ok) {
      return { authenticated: false };
    }

    const data = await response.json();
    return {
      authenticated: true,
      address: data.address,
    };
  } catch (error) {
    console.error('Auth check error:', error);
    return { authenticated: false };
  }
}

/**
 * Sign out the user
 */
export async function signOut(): Promise<void> {
  try {
    await fetch(`${API_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });
  } catch (error) {
    console.error('Logout error:', error);
  }
}



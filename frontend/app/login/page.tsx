'use client';

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, Wallet, CheckCircle, Zap } from "lucide-react"
import { ConnectKitButton } from "connectkit"
import { useWallet } from "@/contexts/WalletContext"

const DEV_MODE = process.env.NEXT_PUBLIC_DEV_MODE === 'true';

export default function LoginPage() {
  const router = useRouter()
  const { isAuthenticated, devModeLogin } = useWallet()

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard')
    }
  }, [isAuthenticated, router])

  const handleDevModeLogin = () => {
    devModeLogin()
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <Shield className="h-10 w-10 text-primary" />
            <span className="text-2xl font-bold text-foreground">Watson</span>
          </Link>
          <p className="text-muted-foreground">Sign in with your Web3 wallet</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Welcome Back</CardTitle>
            <CardDescription>
              Connect your wallet to access the platform
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              {/* Dev Mode: Simple Mock Login */}
              {DEV_MODE ? (
                <>
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleDevModeLogin}
                  >
                    <Zap className="mr-2 h-5 w-5" />
                    Login (Dev Mode)
                  </Button>

                  <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <p className="text-sm text-yellow-600 dark:text-yellow-400 text-center font-medium">
                      🔧 Development Mode
                    </p>
                    <p className="text-xs text-yellow-600/80 dark:text-yellow-400/80 text-center mt-1">
                      Wallet connection and backend auth are disabled. Click to login with a mock address.
                    </p>
                  </div>
                </>
              ) : (
                /* Production: Real Wallet Connection */
                <ConnectKitButton.Custom>
                  {({ isConnected, show, truncatedAddress, ensName }) => {
                    return (
                      <Button
                        className="w-full"
                        size="lg"
                        onClick={show}
                      >
                        {isConnected ? (
                          <>
                            <CheckCircle className="mr-2 h-5 w-5" />
                            {ensName ?? truncatedAddress}
                          </>
                        ) : (
                          <>
                            <Wallet className="mr-2 h-5 w-5" />
                            Connect Wallet
                          </>
                        )}
                      </Button>
                    )
                  }}
                </ConnectKitButton.Custom>
              )}

              {!DEV_MODE && (
                <div className="text-sm text-muted-foreground space-y-2">
                  <p className="font-medium">Supported wallets:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>MetaMask</li>
                    <li>Coinbase Wallet</li>
                    <li>WalletConnect (mobile wallets)</li>
                    <li>Rainbow, Trust Wallet, and more</li>
                  </ul>
                </div>
              )}
            </div>

            {!DEV_MODE && (
              <div className="pt-4 border-t">
                <p className="text-xs text-muted-foreground text-center">
                  By connecting your wallet, you agree to sign a message to verify ownership.
                  We use SIWE (Sign-In With Ethereum) for secure authentication.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {!DEV_MODE && (
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Don&apos;t have a wallet?{" "}
              <a
                href="https://metamask.io/download/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Get MetaMask
              </a>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

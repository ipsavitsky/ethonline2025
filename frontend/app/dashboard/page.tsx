"use client"

import { Label } from "@/components/ui/label"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Shield, Plus, Play, FileText, Award, Search, Filter, Code, TrendingUp, LogOut, Wallet } from "lucide-react"
import { useWallet } from "@/contexts/WalletContext"
import { toast } from "sonner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type Mode = "audit" | "builder" | "leaderboard"

export default function UnifiedDashboard() {
  const [mode, setMode] = useState<Mode>("audit")
  const [auditTab, setAuditTab] = useState<"audits" | "new">("audits")
  // Removed builderTab state as it's no longer needed
  const router = useRouter()
  const { address, isAuthenticated, logout } = useWallet()

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    router.push('/login')
    return null
  }

  const handleLogout = async () => {
    try {
      await logout()
      toast.success('Successfully logged out')
      router.push('/login')
    } catch (error) {
      toast.error('Failed to log out')
      console.error('Logout error:', error)
    }
  }

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <Link href="/" className="flex items-center gap-2">
                <Shield className="h-8 w-8 text-primary" />
                <span className="text-xl font-bold text-foreground">Watson</span>
              </Link>
              <div className="hidden md:flex items-center gap-2 px-1 py-1 bg-muted rounded-lg">
                <Button
                  variant={mode === "audit" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setMode("audit")}
                  className="text-sm"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Audit Mode
                </Button>
                <Button
                  variant={mode === "builder" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setMode("builder")}
                  className="text-sm"
                >
                  <Code className="h-4 w-4 mr-2" />
                  Agent Builder
                </Button>
                <Button
                  variant={mode === "leaderboard" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setMode("leaderboard")}
                  className="text-sm"
                >
                  <Award className="h-4 w-4 mr-2" />
                  Leaderboard
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Wallet className="h-4 w-4 mr-2" />
                    {address ? formatAddress(address) : 'Wallet'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">
                    {address}
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-8">
        {/* Audit Mode */}
        {mode === "audit" && (
          <>
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-foreground mb-2">Audit Mode</h1>
              <p className="text-muted-foreground">Manage your smart contract audits and review findings</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              {[
                { label: "Active Audits", value: "3", icon: Play },
                { label: "Completed", value: "12", icon: FileText },
                { label: "Vulnerabilities Found", value: "47", icon: Shield },
                { label: "Certificates Issued", value: "8", icon: Award },
              ].map((stat) => (
                <Card key={stat.label}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                        <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                      </div>
                      <stat.icon className="h-8 w-8 text-primary/50" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-2 mb-6">
              <Button variant={auditTab === "audits" ? "default" : "ghost"} onClick={() => setAuditTab("audits")}>
                My Audits
              </Button>
              <Button variant={auditTab === "new" ? "default" : "ghost"} onClick={() => setAuditTab("new")}>
                <Plus className="h-4 w-4 mr-2" />
                New Audit
              </Button>
            </div>

            {/* Content */}
            {auditTab === "audits" ? (
              <div>
                {/* Filters */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search audits..." className="pl-9" />
                  </div>
                  <Button variant="outline" size="icon">
                    <Filter className="h-4 w-4" />
                  </Button>
                </div>

                {/* Audits List */}
                <div className="space-y-4">
                  {[
                    {
                      id: "AUD-001",
                      contract: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
                      status: "running",
                      agents: 5,
                      findings: 12,
                      progress: 65,
                    },
                    {
                      id: "AUD-002",
                      contract: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
                      status: "running",
                      agents: 3,
                      findings: 8,
                      progress: 45,
                    },
                    {
                      id: "AUD-003",
                      contract: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
                      status: "completed",
                      agents: 4,
                      findings: 15,
                      progress: 100,
                    },
                  ].map((audit) => (
                    <Card key={audit.id} className="hover:border-primary/50 transition-colors cursor-pointer">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-bold text-foreground">{audit.id}</h3>
                              <Badge variant={audit.status === "running" ? "default" : "secondary"}>
                                {audit.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground font-mono mb-3">{audit.contract}</p>
                            <div className="flex items-center gap-4 text-sm">
                              <span className="text-muted-foreground">{audit.agents} agents deployed</span>
                              <span className="text-muted-foreground">•</span>
                              <span className="text-muted-foreground">{audit.findings} findings</span>
                            </div>
                          </div>
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/dashboard/audit/${audit.id}`}>View Details</Link>
                          </Button>
                        </div>
                        {audit.status === "running" && (
                          <div>
                            <div className="flex items-center justify-between text-sm mb-2">
                              <span className="text-muted-foreground">Progress</span>
                              <span className="text-foreground font-medium">{audit.progress}%</span>
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary transition-all duration-500"
                                style={{ width: `${audit.progress}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ) : (
              // This is the "New Audit" form section, which remains largely unchanged
              <Card>
                <CardHeader>
                  <CardTitle>Create New Audit</CardTitle>
                  <CardDescription>
                    Select AI agents and provide the smart contract address to begin your audit
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Contract Address */}
                  <div className="space-y-2">
                    <Label htmlFor="contract">Smart Contract Address</Label>
                    <Input id="contract" placeholder="0x..." className="font-mono" />
                    <p className="text-sm text-muted-foreground">
                      Enter the Ethereum contract address you want to audit
                    </p>
                  </div>

                  {/* Agent Selection */}
                  <div className="space-y-3">
                    <Label>Select AI Agents</Label>
                    <p className="text-sm text-muted-foreground mb-4">
                      Choose multiple agents to run simultaneously for comprehensive coverage
                    </p>

                    <div className="grid gap-3">
                      {[
                        { name: "SecurityScanner Pro", developer: "auditsec", score: 95, speciality: "Reentrancy" },
                        {
                          name: "VulnHunter AI",
                          developer: "chaindefender",
                          score: 92,
                          speciality: "Access Control",
                        },
                        {
                          name: "SmartAudit Elite",
                          developer: "devsecure",
                          score: 89,
                          speciality: "Integer Overflow",
                        },
                        {
                          name: "ContractGuard",
                          developer: "ethsecurity",
                          score: 87,
                          speciality: "Gas Optimization",
                        },
                        { name: "DeepScan Agent", developer: "blockaudit", score: 85, speciality: "Logic Errors" },
                      ].map((agent) => (
                        <label
                          key={agent.name}
                          className="flex items-center gap-4 p-4 border border-border rounded-lg hover:border-primary/50 cursor-pointer transition-colors"
                        >
                          <input type="checkbox" className="h-4 w-4" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-foreground">{agent.name}</span>
                              <Badge variant="outline" className="text-xs">
                                Score: {agent.score}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span>by {agent.developer}</span>
                              <span>•</span>
                              <span>{agent.speciality}</span>
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 pt-4">
                    <Button size="lg" className="flex-1">
                      <Play className="h-4 w-4 mr-2" />
                      Start Audit
                    </Button>
                    <Button size="lg" variant="outline" onClick={() => setAuditTab("audits")}>
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Agent Builder Mode */}
        {mode === "builder" && (
          <>
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-foreground mb-2">Agent Builder Mode</h1>
              <p className="text-muted-foreground">Create and manage your AI audit agents</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              {[
                { label: "Active Agents", value: "5", icon: Code },
                { label: "Total Audits", value: "234", icon: Shield },
                { label: "Avg Score", value: "89", icon: TrendingUp },
                { label: "Vulnerabilities Found", value: "1.2K", icon: Shield },
              ].map((stat) => (
                <Card key={stat.label}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                        <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                      </div>
                      <stat.icon className="h-8 w-8 text-accent/50" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-foreground">My Agents</h2>
              <Button asChild>
                <Link href="/dashboard/agent/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Agent
                </Link>
              </Button>
            </div>

            {/* Agents List */}
            <div className="space-y-4">
              {[
                {
                  id: "agent-001",
                  name: "SecurityScanner Pro",
                  status: "active",
                  model: "gpt-4-turbo",
                  audits: 89,
                  score: 95,
                  findings: 342,
                },
                {
                  id: "agent-002",
                  name: "ReentrancyDetector",
                  status: "active",
                  model: "claude-3-opus",
                  audits: 67,
                  score: 92,
                  findings: 278,
                },
                {
                  id: "agent-003",
                  name: "GasOptimizer AI",
                  status: "draft",
                  model: "gpt-4",
                  audits: 0,
                  score: 0,
                  findings: 0,
                },
              ].map((agent) => (
                <Card key={agent.name} className="hover:border-accent/50 transition-colors">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-bold text-foreground">{agent.name}</h3>
                          <Badge variant={agent.status === "active" ? "default" : "secondary"}>{agent.status}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          Model: <span className="font-mono">{agent.model}</span>
                        </p>
                        <div className="flex items-center gap-6 text-sm">
                          <div>
                            <span className="text-muted-foreground">Audits: </span>
                            <span className="text-foreground font-medium">{agent.audits}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Score: </span>
                            <span className="text-foreground font-medium">{agent.score}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Findings: </span>
                            <span className="text-foreground font-medium">{agent.findings}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/dashboard/agent/${agent.id}`}>Edit</Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}

        {mode === "leaderboard" && (
          <>
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-foreground mb-2">Agent Leaderboard</h1>
              <p className="text-muted-foreground">Top performing agents ranked by score and performance metrics</p>
            </div>

            {/* Leaderboard */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  {[
                    {
                      rank: 1,
                      name: "SecurityScanner Pro",
                      developer: "auditsec",
                      score: 95,
                      audits: 234,
                      findings: 892,
                      accuracy: 98,
                      speciality: "Reentrancy",
                    },
                    {
                      rank: 2,
                      name: "VulnHunter AI",
                      developer: "chaindefender",
                      score: 92,
                      audits: 198,
                      findings: 756,
                      accuracy: 96,
                      speciality: "Access Control",
                    },
                    {
                      rank: 3,
                      name: "SmartAudit Elite",
                      developer: "devsecure",
                      score: 89,
                      audits: 176,
                      findings: 634,
                      accuracy: 94,
                      speciality: "Integer Overflow",
                    },
                    {
                      rank: 4,
                      name: "ContractGuard",
                      developer: "ethsecurity",
                      score: 87,
                      audits: 145,
                      findings: 521,
                      accuracy: 93,
                      speciality: "Gas Optimization",
                    },
                    {
                      rank: 5,
                      name: "DeepScan Agent",
                      developer: "blockaudit",
                      score: 85,
                      audits: 132,
                      findings: 478,
                      accuracy: 91,
                      speciality: "Logic Errors",
                    },
                    {
                      rank: 6,
                      name: "ReentrancyDetector",
                      developer: "you",
                      score: 92,
                      audits: 67,
                      findings: 278,
                      accuracy: 97,
                      speciality: "Reentrancy",
                    },
                    {
                      rank: 7,
                      name: "CodeAnalyzer Pro",
                      developer: "smartsec",
                      score: 84,
                      audits: 118,
                      findings: 445,
                      accuracy: 90,
                      speciality: "Code Quality",
                    },
                    {
                      rank: 8,
                      name: "AuditMaster",
                      developer: "securechain",
                      score: 82,
                      audits: 103,
                      findings: 398,
                      accuracy: 89,
                      speciality: "General",
                    },
                  ].map((agent) => (
                    <div
                      key={agent.rank}
                      className={`flex items-center gap-4 p-4 border rounded-lg transition-colors ${
                        agent.developer === "you" ? "border-accent bg-accent/5" : "border-border hover:border-accent/50"
                      }`}
                    >
                      {/* Rank Badge */}
                      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-muted">
                        {agent.rank <= 3 ? (
                          <Award
                            className={`h-6 w-6 ${
                              agent.rank === 1
                                ? "text-yellow-500"
                                : agent.rank === 2
                                  ? "text-gray-400"
                                  : "text-orange-600"
                            }`}
                          />
                        ) : (
                          <span className="text-lg font-bold text-muted-foreground">#{agent.rank}</span>
                        )}
                      </div>

                      {/* Agent Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-foreground">{agent.name}</h3>
                          {agent.developer === "you" && (
                            <Badge variant="outline" className="text-xs">
                              Your Agent
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span>by {agent.developer}</span>
                          <span>•</span>
                          <span>{agent.speciality}</span>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="hidden md:flex items-center gap-6 text-sm">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-foreground">{agent.score}</p>
                          <p className="text-xs text-muted-foreground">Score</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-semibold text-foreground">{agent.audits}</p>
                          <p className="text-xs text-muted-foreground">Audits</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-semibold text-foreground">{agent.findings}</p>
                          <p className="text-xs text-muted-foreground">Findings</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-semibold text-foreground">{agent.accuracy}%</p>
                          <p className="text-xs text-muted-foreground">Accuracy</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}

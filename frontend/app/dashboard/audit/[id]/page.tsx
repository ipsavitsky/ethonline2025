"use client"

import { useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Shield,
  ArrowLeft,
  Download,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle,
  FileText,
  Clock,
  Code,
} from "lucide-react"

type Severity = "critical" | "high" | "medium" | "low" | "info"

interface Finding {
  id: string
  agent: string
  severity: Severity
  title: string
  description: string
  location: string
  recommendation: string
  selected: boolean
}

export default function AuditDetailsPage() {
  const params = useParams()
  const auditId = params.id as string

  // Mock audit data
  const audit = {
    id: auditId,
    contract: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    status: auditId === "AUD-003" ? "completed" : "running",
    progress: auditId === "AUD-001" ? 65 : auditId === "AUD-002" ? 45 : 100,
    startedAt: "2025-01-15 14:30 UTC",
    completedAt: auditId === "AUD-003" ? "2025-01-15 16:45 UTC" : null,
    agents: [
      { name: "SecurityScanner Pro", status: "completed" },
      { name: "VulnHunter AI", status: "completed" },
      { name: "SmartAudit Elite", status: "running" },
      { name: "ContractGuard", status: "pending" },
      { name: "DeepScan Agent", status: "pending" },
    ],
  }

  const [findings, setFindings] = useState<Finding[]>([
    {
      id: "F-001",
      agent: "SecurityScanner Pro",
      severity: "critical",
      title: "Reentrancy Vulnerability in withdraw() Function",
      description:
        "The withdraw() function makes an external call before updating the user's balance, allowing an attacker to recursively call the function and drain the contract.",
      location: "Line 45-52 in TokenContract.sol",
      recommendation:
        "Implement the checks-effects-interactions pattern. Update the user's balance before making the external call, or use a reentrancy guard.",
      selected: false,
    },
    {
      id: "F-002",
      agent: "VulnHunter AI",
      severity: "high",
      title: "Missing Access Control on setOwner() Function",
      description:
        "The setOwner() function lacks proper access control modifiers, allowing any address to change the contract owner.",
      location: "Line 78 in TokenContract.sol",
      recommendation: "Add the onlyOwner modifier to restrict access to the current owner only.",
      selected: false,
    },
    {
      id: "F-003",
      agent: "SecurityScanner Pro",
      severity: "high",
      title: "Integer Overflow in transfer() Function",
      description:
        "The transfer function performs arithmetic operations without checking for overflow, potentially allowing balance manipulation.",
      location: "Line 102-108 in TokenContract.sol",
      recommendation: "Use SafeMath library or Solidity 0.8+ built-in overflow checks.",
      selected: false,
    },
    {
      id: "F-004",
      agent: "SmartAudit Elite",
      severity: "medium",
      title: "Uninitialized Storage Pointer",
      description: "A storage pointer is declared but not initialized, which could lead to unexpected behavior.",
      location: "Line 134 in TokenContract.sol",
      recommendation: "Initialize the storage pointer or use memory instead of storage.",
      selected: false,
    },
    {
      id: "F-005",
      agent: "VulnHunter AI",
      severity: "medium",
      title: "Timestamp Dependence in Random Number Generation",
      description: "The contract uses block.timestamp for randomness, which can be manipulated by miners.",
      location: "Line 167 in TokenContract.sol",
      recommendation: "Use a verifiable random function (VRF) like Chainlink VRF for secure randomness.",
      selected: false,
    },
    {
      id: "F-006",
      agent: "SecurityScanner Pro",
      severity: "low",
      title: "Missing Event Emission",
      description: "State-changing functions do not emit events, making it difficult to track contract activity.",
      location: "Multiple locations",
      recommendation: "Add event emissions for all state-changing functions.",
      selected: false,
    },
    {
      id: "F-007",
      agent: "ContractGuard",
      severity: "low",
      title: "Gas Optimization: Loop Can Be Optimized",
      description: "The loop in the distribute() function can be optimized to reduce gas costs.",
      location: "Line 189-195 in TokenContract.sol",
      recommendation: "Cache array length and use unchecked blocks where safe.",
      selected: false,
    },
    {
      id: "F-008",
      agent: "SmartAudit Elite",
      severity: "info",
      title: "Outdated Solidity Version",
      description: "The contract uses Solidity 0.6.12, which is outdated and missing security improvements.",
      location: "Line 1 in TokenContract.sol",
      recommendation: "Upgrade to Solidity 0.8.x to benefit from built-in overflow checks and other improvements.",
      selected: false,
    },
  ])

  const toggleFinding = (id: string) => {
    setFindings(findings.map((f) => (f.id === id ? { ...f, selected: !f.selected } : f)))
  }

  const toggleAll = () => {
    const allSelected = findings.every((f) => f.selected)
    setFindings(findings.map((f) => ({ ...f, selected: !allSelected })))
  }

  const selectedCount = findings.filter((f) => f.selected).length

  const getSeverityIcon = (severity: Severity) => {
    switch (severity) {
      case "critical":
        return <AlertTriangle className="h-4 w-4" />
      case "high":
        return <AlertCircle className="h-4 w-4" />
      case "medium":
        return <Info className="h-4 w-4" />
      case "low":
        return <Info className="h-4 w-4" />
      case "info":
        return <Info className="h-4 w-4" />
    }
  }

  const getSeverityColor = (severity: Severity) => {
    switch (severity) {
      case "critical":
        return "text-red-500 bg-red-500/10 border-red-500/20"
      case "high":
        return "text-orange-500 bg-orange-500/10 border-orange-500/20"
      case "medium":
        return "text-yellow-500 bg-yellow-500/10 border-yellow-500/20"
      case "low":
        return "text-blue-500 bg-blue-500/10 border-blue-500/20"
      case "info":
        return "text-muted-foreground bg-muted border-border"
    }
  }

  const severityCounts = findings.reduce(
    (acc, f) => {
      acc[f.severity]++
      return acc
    },
    { critical: 0, high: 0, medium: 0, low: 0, info: 0 } as Record<Severity, number>,
  )

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
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl font-bold text-foreground">{audit.id}</h1>
                <Badge variant={audit.status === "running" ? "default" : "secondary"} className="text-sm">
                  {audit.status}
                </Badge>
              </div>
              <p className="text-muted-foreground font-mono text-lg">{audit.contract}</p>
            </div>
            <Button size="lg" disabled={selectedCount === 0}>
              <Download className="h-4 w-4 mr-2" />
              Export Report ({selectedCount})
            </Button>
          </div>

          {/* Progress */}
          {audit.status === "running" && (
            <div className="mb-6">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-muted-foreground">Audit Progress</span>
                <span className="text-foreground font-medium">{audit.progress}%</span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-500"
                  style={{ width: `${audit.progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Started: {audit.startedAt}</span>
            </div>
            {audit.completedAt && (
              <>
                <span className="text-muted-foreground">•</span>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Completed: {audit.completedAt}</span>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Severity Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Findings Summary</CardTitle>
                <CardDescription>Vulnerabilities discovered by severity level</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 gap-3">
                  {(["critical", "high", "medium", "low", "info"] as Severity[]).map((severity) => (
                    <div key={severity} className="text-center">
                      <div
                        className={`inline-flex items-center justify-center w-12 h-12 rounded-lg mb-2 ${getSeverityColor(
                          severity,
                        )}`}
                      >
                        <span className="text-xl font-bold">{severityCounts[severity]}</span>
                      </div>
                      <p className="text-xs text-muted-foreground capitalize">{severity}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Findings List */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Areas of Attention</CardTitle>
                    <CardDescription>Select findings to include in your report</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={toggleAll}>
                    {findings.every((f) => f.selected) ? "Deselect All" : "Select All"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {findings.map((finding) => (
                  <div
                    key={finding.id}
                    className={`border rounded-lg p-4 transition-colors ${
                      finding.selected ? "border-primary bg-primary/5" : "border-border"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={finding.selected}
                        onCheckedChange={() => toggleFinding(finding.id)}
                        className="mt-1"
                      />
                      <div className="flex-1 space-y-3">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className={`${getSeverityColor(finding.severity)} capitalize`}>
                                {getSeverityIcon(finding.severity)}
                                <span className="ml-1">{finding.severity}</span>
                              </Badge>
                              <span className="text-xs text-muted-foreground">{finding.id}</span>
                            </div>
                            <h3 className="font-semibold text-foreground text-balance">{finding.title}</h3>
                          </div>
                        </div>

                        {/* Details */}
                        <div className="space-y-2 text-sm">
                          <div>
                            <p className="text-muted-foreground mb-1">
                              <span className="font-medium text-foreground">Description:</span>
                            </p>
                            <p className="text-muted-foreground text-pretty">{finding.description}</p>
                          </div>

                          <div>
                            <p className="text-muted-foreground">
                              <span className="font-medium text-foreground">Location:</span>{" "}
                              <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{finding.location}</code>
                            </p>
                          </div>

                          <div>
                            <p className="text-muted-foreground mb-1">
                              <span className="font-medium text-foreground">Recommendation:</span>
                            </p>
                            <p className="text-muted-foreground text-pretty">{finding.recommendation}</p>
                          </div>

                          <div className="pt-2 border-t border-border">
                            <p className="text-xs text-muted-foreground">
                              Detected by <span className="font-medium text-foreground">{finding.agent}</span>
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Agent Status */}
            <Card>
              <CardHeader>
                <CardTitle>Agent Status</CardTitle>
                <CardDescription>{audit.agents.length} agents deployed</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {audit.agents.map((agent) => (
                  <div key={agent.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Code className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-foreground">{agent.name}</span>
                    </div>
                    <Badge
                      variant={
                        agent.status === "completed" ? "secondary" : agent.status === "running" ? "default" : "outline"
                      }
                      className="text-xs"
                    >
                      {agent.status}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start bg-transparent"
                  disabled={selectedCount === 0}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Generate PDF Report
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start bg-transparent"
                  disabled={selectedCount === 0}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export as JSON
                </Button>
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <Code className="h-4 w-4 mr-2" />
                  View Contract Code
                </Button>
              </CardContent>
            </Card>

            {/* Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Audit Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total Findings</span>
                  <span className="font-semibold text-foreground">{findings.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Selected for Report</span>
                  <span className="font-semibold text-foreground">{selectedCount}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Agents Completed</span>
                  <span className="font-semibold text-foreground">
                    {audit.agents.filter((a) => a.status === "completed").length} / {audit.agents.length}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

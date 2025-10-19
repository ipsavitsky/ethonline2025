"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Shield, ArrowLeft, Save, Play, Trash2, Plus } from "lucide-react"

export default function AgentFormPage() {
  const params = useParams()
  const router = useRouter()
  const agentId = params.id as string
  const isNewAgent = agentId === "new"

  const [formData, setFormData] = useState({
    id: agentId,
    name: "",
    status: "draft",
    model: "gpt-4-turbo",
    prompt: "",
    mcpServers: {
      hosted: [] as string[],
      custom: [] as string[],
    },
  })

  useEffect(() => {
    if (!isNewAgent) {
      // Mock agent data - in real app, fetch based on agentId
      const mockAgentData = {
        id: agentId,
        name: "SecurityScanner Pro",
        status: "active",
        model: "gpt-4-turbo",
        prompt: `You are an expert smart contract auditor specializing in security vulnerabilities.

Your primary focus is on identifying:
- Reentrancy attacks
- Access control issues
- Integer overflow/underflow
- Unchecked external calls
- Gas optimization opportunities

Analyze the provided smart contract code thoroughly and report all findings with severity levels.`,
        mcpServers: {
          hosted: ["ethereum-rpc", "etherscan-api", "vulnerability-db"],
          custom: ["https://custom-mcp.example.com/api"],
        },
      }
      setFormData(mockAgentData)
    }
  }, [agentId, isNewAgent])

  const handleSave = () => {
    console.log("[v0] Saving agent:", formData)
    router.push("/dashboard")
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-2">
              <Shield className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold text-foreground">AuditChain</span>
            </Link>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-4xl font-bold text-foreground">{isNewAgent ? "Create New Agent" : "Edit Agent"}</h1>
            {!isNewAgent && (
              <Badge variant={formData.status === "active" ? "default" : "secondary"}>{formData.status}</Badge>
            )}
          </div>
          <p className="text-muted-foreground">
            {isNewAgent
              ? "Configure your AI agent with a custom model, prompt, and MCP servers"
              : "Update your agent configuration and settings"}
          </p>
        </div>

        {/* Form */}
        <div className="max-w-3xl">
          <Card>
            <CardHeader>
              <CardTitle>Agent Configuration</CardTitle>
              <CardDescription>
                {isNewAgent ? "Set up" : "Modify"} your AI agent's model, prompt, and MCP servers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Agent Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Agent Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., SecurityScanner Pro"
                />
              </div>

              {/* Model Selection */}
              <div className="space-y-2">
                <Label htmlFor="model">AI Model</Label>
                <select
                  id="model"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">Select a model from OpenRouter</option>
                  <option value="gpt-4-turbo">GPT-4 Turbo</option>
                  <option value="gpt-4">GPT-4</option>
                  <option value="claude-3-opus">Claude 3 Opus</option>
                  <option value="claude-3-sonnet">Claude 3 Sonnet</option>
                  <option value="gemini-pro">Gemini Pro</option>
                  <option value="mixtral-8x7b">Mixtral 8x7B</option>
                </select>
                <p className="text-sm text-muted-foreground">Choose from available models on OpenRouter</p>
              </div>

              {/* System Prompt */}
              <div className="space-y-2">
                <Label htmlFor="prompt">System Prompt</Label>
                <Textarea
                  id="prompt"
                  value={formData.prompt}
                  onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
                  placeholder="You are an expert smart contract auditor specializing in..."
                  rows={isNewAgent ? 8 : 12}
                  className="font-mono text-sm"
                />
                <p className="text-sm text-muted-foreground">Define the agent's behavior and expertise</p>
              </div>

              {/* MCP Servers */}
              <div className="space-y-3">
                <Label>MCP Servers</Label>
                <p className="text-sm text-muted-foreground">
                  Select hosted MCP servers or add your own custom endpoints
                </p>

                {/* Hosted MCPs */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">Hosted by AuditChain</p>
                  <div className="space-y-2">
                    {[
                      {
                        id: "ethereum-rpc",
                        name: "Ethereum RPC",
                        description: "Query blockchain data and contract state",
                      },
                      {
                        id: "etherscan-api",
                        name: "Etherscan API",
                        description: "Access verified contract source code",
                      },
                      {
                        id: "vulnerability-db",
                        name: "Vulnerability Database",
                        description: "Known vulnerability patterns",
                      },
                    ].map((mcp) => (
                      <label
                        key={mcp.id}
                        className="flex items-start gap-3 p-3 border border-border rounded-lg hover:border-accent/50 cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          className="h-4 w-4 mt-1"
                          checked={formData.mcpServers.hosted.includes(mcp.id)}
                          onChange={(e) => {
                            const newHosted = e.target.checked
                              ? [...formData.mcpServers.hosted, mcp.id]
                              : formData.mcpServers.hosted.filter((id) => id !== mcp.id)
                            setFormData({
                              ...formData,
                              mcpServers: { ...formData.mcpServers, hosted: newHosted },
                            })
                          }}
                        />
                        <div>
                          <p className="font-medium text-foreground text-sm">{mcp.name}</p>
                          <p className="text-xs text-muted-foreground">{mcp.description}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Custom MCPs */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">Custom MCP Servers</p>
                  <div className="space-y-2">
                    {formData.mcpServers.custom.map((url, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input value={url} readOnly className="font-mono text-sm" />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            const newCustom = formData.mcpServers.custom.filter((_, i) => i !== index)
                            setFormData({
                              ...formData,
                              mcpServers: { ...formData.mcpServers, custom: newCustom },
                            })
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Input placeholder="https://your-mcp-server.com/endpoint" id="new-mcp" />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const input = document.getElementById("new-mcp") as HTMLInputElement
                        if (input.value) {
                          setFormData({
                            ...formData,
                            mcpServers: {
                              ...formData.mcpServers,
                              custom: [...formData.mcpServers.custom, input.value],
                            },
                          })
                          input.value = ""
                        }
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Custom MCP
                    </Button>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-4">
                <Button size="lg" onClick={handleSave}>
                  <Save className="h-4 w-4 mr-2" />
                  {isNewAgent ? "Save Agent" : "Save Changes"}
                </Button>
                <Button size="lg" variant="outline">
                  <Play className="h-4 w-4 mr-2" />
                  Test Agent
                </Button>
                <Button size="lg" variant="ghost" onClick={() => router.push("/dashboard")}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

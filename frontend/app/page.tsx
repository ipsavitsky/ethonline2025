import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Shield, Zap, ArrowRight, CheckCircle2 } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <Link href="/" className="flex items-center gap-2">
                <Shield className="h-8 w-8 text-primary" />
                <span className="text-xl font-bold text-foreground">AuditChain</span>
              </Link>
              <div className="hidden md:flex items-center gap-6">
                <Link
                  href="#features"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Features
                </Link>
                <Link
                  href="#how-it-works"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  How it Works
                </Link>
                <Link href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Pricing
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" asChild>
                <Link href="/login">Sign In</Link>
              </Button>
              <Button asChild>
                <Link href="/dashboard">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-24 md:py-32">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            AI-Powered Smart Contract Security
          </div>

          <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-6 text-balance">
            Audit Ethereum Smart Contracts with AI Agents
          </h1>

          <p className="text-xl text-muted-foreground mb-8 text-pretty max-w-2xl mx-auto leading-relaxed">
            Deploy multiple AI agents to identify vulnerabilities, then build and customize your own agents. All in one
            platform.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" asChild className="text-base">
              <Link href="/dashboard">
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y border-border">
        <div className="container mx-auto px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { label: "Audits Completed", value: "2,500+" },
              { label: "Active Agents", value: "150+" },
              { label: "Vulnerabilities Found", value: "10K+" },
              { label: "Agent Developers", value: "300+" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-foreground mb-2">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4 text-balance">
            Two Powerful Modes of Operation
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
            Switch seamlessly between auditing contracts and building custom AI agents
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Auditor Card */}
          <div className="bg-card border border-border rounded-lg p-8 hover:border-primary/50 transition-colors">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-4">Audit Mode</h3>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              Run comprehensive audits using multiple AI agents simultaneously. Review findings, generate reports, and
              issue audit certificates as NFTs.
            </p>
            <ul className="space-y-3 mb-6">
              {[
                "Deploy multiple agents per audit",
                "Real-time vulnerability detection",
                "Collaborative report generation",
                "NFT audit certificates",
                "Agent performance leaderboard",
              ].map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Developer Card */}
          <div className="bg-card border border-border rounded-lg p-8 hover:border-accent/50 transition-colors">
            <div className="h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center mb-6">
              <Zap className="h-6 w-6 text-accent" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-4">Agent Builder Mode</h3>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              Create custom AI agents with your own prompts and MCP servers. Earn reputation as your agents find
              vulnerabilities in audits.
            </p>
            <ul className="space-y-3 mb-6">
              {[
                "Choose from OpenRouter models",
                "Custom prompt engineering",
                "MCP server integration",
                "Performance tracking",
                "Community leaderboard",
              ].map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="bg-muted/30 py-24">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4 text-balance">How It Works</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
              Simple, powerful workflow for comprehensive smart contract audits
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                step: "01",
                title: "Select Agents",
                description:
                  "Choose from community-built AI agents or create your own with custom prompts and MCP servers",
              },
              {
                step: "02",
                title: "Run Audit",
                description:
                  "Paste your contract address and let multiple agents analyze it simultaneously for vulnerabilities",
              },
              {
                step: "03",
                title: "Generate Report",
                description:
                  "Review findings, select key vulnerabilities, and export a comprehensive audit report with NFT certificate",
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="text-5xl font-bold text-primary/20 mb-4">{item.step}</div>
                <h3 className="text-xl font-bold text-foreground mb-3">{item.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-6 py-24">
        <div className="max-w-4xl mx-auto text-center bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl p-12 border border-primary/20">
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4 text-balance">
            Ready to Secure Your Smart Contracts?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 text-pretty max-w-2xl mx-auto">
            Join hundreds of developers and auditors using AI-powered agents to identify vulnerabilities
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/dashboard">Get Started</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="container mx-auto px-6 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              <span className="font-bold text-foreground">AuditChain</span>
            </div>
            <div className="text-sm text-muted-foreground">
              © 2025 AuditChain. Securing Ethereum, one contract at a time.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export function ArchitecturePage() {
  return (
    <div className="space-y-6" style={{ maxWidth: '900px', paddingBottom: '40px' }}>
      <div className="market-summary">
        <div className="market-summary-title">TradeDesk System Architecture Overview</div>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
          TradeDesk is designed as a high-concurrency, real-time stock broker simulator. The application maps decoupled user state models over WebSocket channels to provide low-latency updates with robust persistence fallbacks.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
        
        {/* Frontend Tech Stack Card */}
        <div className="market-summary" style={{ margin: 0 }}>
          <div className="market-summary-title">Frontend Architecture</div>
          <ul style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.8', paddingLeft: '20px' }}>
            <li><strong>Core Framework</strong>: React 19 + TypeScript + Vite for hot-module reloading and compiled type safety.</li>
            <li><strong>State Management</strong>: Zustand global state stores, decoupling API/WebSocket cache from local component rendering.</li>
            <li><strong>Routing</strong>: React Router DOM path-routing, with Route Guards intercepting unauthenticated routes.</li>
            <li><strong>Styling Layer</strong>: Vanilla CSS custom dark styling with responsive design sheets + Tailwind utility tokens.</li>
            <li><strong>Visualization</strong>: Interactive technical charts using Recharts, plus custom lightweight SVG sparkline graphs.</li>
          </ul>
        </div>

        {/* Backend Tech Stack Card */}
        <div className="market-summary" style={{ margin: 0 }}>
          <div className="market-summary-title">Backend Architecture</div>
          <ul style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.8', paddingLeft: '20px' }}>
            <li><strong>Server Engine</strong>: Node.js with Express framework, providing REST endpoints for user authentication, billing, and stats.</li>
            <li><strong>WS Communications</strong>: Socket.IO Server pushing real-time random-walk price updates to clients every 1s.</li>
            <li><strong>Database layer</strong>: MongoDB ODM via Mongoose schemas, backing up all user profiles and transaction histories.</li>
            <li><strong>Graceful Fallback</strong>: Automatic runtime detection falling back to fast in-memory array caches if MongoDB goes offline.</li>
            <li><strong>Logging & Auditing</strong>: Winston level-based structured logging (info, warn, error) routing to stdout and rotating log files.</li>
          </ul>
        </div>

        {/* Security Design Card */}
        <div className="market-summary" style={{ margin: 0 }}>
          <div className="market-summary-title">Security Features</div>
          <ul style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.8', paddingLeft: '20px' }}>
            <li><strong>Session Authentication</strong>: JSON Web Tokens (JWT) issued during login, validating all API routes and WebSocket handshakes.</li>
            <li><strong>Payload Checking</strong>: Schema validation of Express payloads using Zod schemas, securing input parameters.</li>
            <li><strong>HTTP Headers</strong>: Helmet middleware integrations, applying security response policies.</li>
            <li><strong>Rate Limiter</strong>: Rate limiting controls on REST calls (`100 req / 15 min`), defending against bot attacks.</li>
            <li><strong>CORS policies</strong>: Cross-Origin Resource Sharing (CORS) rule restrictions protecting cross-site data access.</li>
          </ul>
        </div>

        {/* Deployment Topology Card */}
        <div className="market-summary" style={{ margin: 0 }}>
          <div className="market-summary-title">Deployment & Devops</div>
          <ul style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.8', paddingLeft: '20px' }}>
            <li><strong>Gateway Routing</strong>: Nginx server acting as a unified reverse-proxy mapping API calls, static assets, and WebSocket streams on port 80.</li>
            <li><strong>Containerization</strong>: Complete Docker configurations for client, server, proxy, and database engines.</li>
            <li><strong>Orchestration</strong>: Multi-container deployment using Docker Compose for simple local startup environments.</li>
            <li><strong>CI/CD pipeline</strong>: GitHub Actions continuous integration checking TypeScript compiler warnings, code quality, and builds.</li>
          </ul>
        </div>
      </div>

      <div className="market-summary" style={{ marginTop: '20px' }}>
        <div className="market-summary-title">Data Stream Flowchart</div>
        <div 
          style={{ 
            fontFamily: 'JetBrains Mono, monospace', 
            fontSize: '12px', 
            background: 'var(--bg-input)', 
            padding: '16px', 
            borderRadius: '10px', 
            border: '1px solid var(--border)',
            lineHeight: '1.5',
            color: 'var(--accent-cyan)'
          }}
        >
          {`[Client View] ──(Zustand Hooks)──> [useTradeStore] 
      ▲                                       │
      │ (WS updates)                          │ (API Request)
      │                                       ▼
[Socket.IO Client] <───(WebSocket)───> [Socket.IO Server] ───> [Express Router]
                                              │                       │
                                              ▼                       ▼
                                       [Random Walk Walk]      [Zod Validator]
                                              │                       │
                                              ▼                       ▼
                                       [Local Memory] <───(Fallback)── [Mongoose ODM]
                                                                              │
                                                                              ▼
                                                                        [MongoDB DB]`}
        </div>
      </div>
    </div>
  );
}

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useEffect, useRef } from 'react';
import mermaid from 'mermaid';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

export default function Slide() {
  const markdown = `- Gaming: per-player grains for presence/matchmaking; low-latency updates without global locks; streams for events
- IoT: per-device grains as digital twins; reminders for health checks; fan-out telemetry via streams
- Retail: carts, inventory, and orders as grains; sagas for orchestration; idempotent, at-least-once updates
- What’s new: .NET 8 AOT/trimming + source-generated serializers; native OpenTelemetry metrics/traces; Kubernetes-first hosting, graceful draining, autoscale
\`\`\`csharp
// .NET 8 + OTEL + Kubernetes-ready Orleans host (minimal sketch)
var builder = Host.CreateApplicationBuilder(args);
builder.Services.AddOpenTelemetry()
    .WithTracing(t => t.AddSource("Orleans").AddOtlpExporter())
    .WithMetrics(m => m.AddMeter("Microsoft.Orleans").AddOtlpExporter());
builder.Host.UseOrleans(silo =>
{
    silo.UseKubernetesHosting();        // K8s-aware endpoints & networking
    silo.UseDashboard();                // Quick visibility (optional)
    silo.AddMemoryGrainStorage("Default");
});
await builder.Build().RunAsync();
\`\`\`
\`\`\`mermaid
flowchart LR
A[Clients: Game/Device/Web] --> B[Gateway]
B --> G((Grain Directory)) --> C[Grains: Player/Device/Cart]
C --> D[(Storage)]
C --> E[[Streams]]
C -.metrics/traces.-> F[OpenTelemetry]
subgraph Kubernetes
H[Silo Pods]
end
B --> H
H -.drain/scale.-> C
F --> I[(Grafana/Jaeger)]
\`\`\``;
  const mermaidRef = useRef(0);
  
  useEffect(() => {
    mermaid.initialize({ 
      startOnLoad: true,
      theme: 'dark',
      themeVariables: {
        primaryColor: '#667eea',
        primaryTextColor: '#fff',
        primaryBorderColor: '#7c3aed',
        lineColor: '#5a67d8',
        secondaryColor: '#764ba2',
        tertiaryColor: '#667eea',
        background: '#1a202c',
        mainBkg: '#2d3748',
        secondBkg: '#4a5568',
        tertiaryBkg: '#718096',
        textColor: '#fff',
        nodeTextColor: '#fff',
      }
    });
    
    // Find and render mermaid diagrams
    const renderDiagrams = async () => {
      const diagrams = document.querySelectorAll('.language-mermaid');
      for (let i = 0; i < diagrams.length; i++) {
        const element = diagrams[i];
        const graphDefinition = element.textContent;
        const id = `mermaid-${mermaidRef.current++}`;
        
        try {
          const { svg } = await mermaid.render(id, graphDefinition);
          element.innerHTML = svg;
          element.classList.remove('language-mermaid');
          element.classList.add('mermaid-rendered');
        } catch (error) {
          console.error('Mermaid rendering error:', error);
        }
      }
    };
    
    renderDiagrams();
  }, [markdown]);
  
  return (
    <div className="slide markdown-slide">
      <h1>Real-World Wins + What’s New: Gaming, IoT, Retail; .NET 8, OpenTelemetry, Kubernetes</h1>
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]}
        components={{
          code({node, inline, className, children, ...props}: any) {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : '';
            
            // Handle inline code
            if (inline) {
              return (
                <code className={className} {...props}>
                  {children}
                </code>
              );
            }
            
            // Handle mermaid diagrams
            if (language === 'mermaid') {
              return (
                <pre className="language-mermaid">
                  <code>{String(children).replace(/\n$/, '')}</code>
                </pre>
              );
            }
            
            // Handle code blocks with syntax highlighting
            if (language) {
              return (
                <SyntaxHighlighter
                  language={language}
                  style={atomDark}
                  showLineNumbers={true}
                  PreTag="div"
                  {...props}
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              );
            }
            
            // Default code block without highlighting
            return (
              <pre>
                <code className={className} {...props}>
                  {children}
                </code>
              </pre>
            );
          }
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
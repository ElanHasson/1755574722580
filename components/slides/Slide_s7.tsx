import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useEffect, useRef } from 'react';
import mermaid from 'mermaid';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

export default function Slide() {
  const markdown = `- Actionable next steps: clone the sample, run a local silo/client, call a grain; aim for a 10‑minute first win
- Build one tiny feature: persist a grain, add a reliable reminder, publish an event via streams; keep handlers idempotent
- Production checklist: pick storage with ETag/versioning, set IdleDeactivationTimeout, wire OpenTelemetry, plan rolling upgrades/draining
- Learn more and connect: read the Orleans docs, browse samples, and follow Sergey Bykov and Reuben Bond for design insights
\`\`\`csharp
// Minimal grain + reminder and a one-line client call
public interface IHelloGrain : IGrainWithStringKey { Task<string> SayHello(); }
public class HelloGrain : Grain, IHelloGrain
{
    public Task<string> SayHello() => Task.FromResult($"Hello from {this.GetPrimaryKeyString()}");
    public override async Task OnActivateAsync()
    {
        await RegisterOrUpdateReminder("pulse", TimeSpan.FromSeconds(5), TimeSpan.FromMinutes(1));
    }
}

// Client (e.g., in a console app)
var client = new ClientBuilder().UseLocalhostClustering().Build();
await client.Connect();
var g = client.GetGrain<IHelloGrain>("demo");
Console.WriteLine(await g.SayHello());
\`\`\`
\`\`\`mermaid
flowchart TD
    A[Clone sample repo] --> B[Run local Orleans cluster]
    B --> C[Add a grain + persistent state]
    C --> D[Add a reminder or stream]
    D --> E[Observe with OpenTelemetry]
    E --> F[Deploy to Kubernetes]
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
      <h1>Wrap-Up: Actionable Next Steps and a Shout‑Out to Sergey and Reuben</h1>
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
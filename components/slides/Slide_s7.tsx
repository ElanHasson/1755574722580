import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import Mermaid from '../../components/Mermaid';

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
                <Mermaid chart={String(children).replace(/\n$/, '')} />
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
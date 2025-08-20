import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import Mermaid from '../../components/Mermaid';

export default function Slide() {
  const markdown = `- Distributed state is hard: race conditions, partial failures, timeouts, hotspots, and elastic scale without breaking correctness
- Actor model insight: isolate state+behavior per identity; communicate via async messages, not shared memory
- Orleans’ twist: virtual actors (grains) with stable IDs, on-demand activations, location transparency, and automatic lifecycle
- Turn-based concurrency: one request at a time per activation; no locks by default; opt-in reentrancy when needed
- Result: code reads like single-threaded logic, yet scales out across a cluster with built-in routing and persistence

\`\`\`csharp
public interface ICounterGrain : IGrainWithStringKey
{
    Task<long> Increment();
    Task<long> Get();
}

public class CounterGrain : Grain, ICounterGrain
{
    [PersistentState("counter")] private readonly IPersistentState<long> _state;
    public CounterGrain([PersistentState("counter")] IPersistentState<long> state) => _state = state;

    public async Task<long> Increment()
    {
        _state.State++;
        await _state.WriteStateAsync(); // persisted; no locks needed due to turn-based concurrency
        return _state.State;
    }

    public Task<long> Get() => Task.FromResult(_state.State);
}

// Client code
var counter = client.GetGrain<ICounterGrain>("account:42");
var value = await counter.Increment();
\`\`\`

\`\`\`mermaid
  flowchart LR
    Client[Client] --> Gateway[Gateway]
    Gateway --> Directory[Grain Directory]
    Directory -- lookup/activate --> Silo

    subgraph "Silo Host"
      Silo[Silo]
      G["CounterGrain activation<br/>(identity: account:42)"]
    end

    G --> Storage[(Storage Provider)]

    %% Notes as nodes
    noteG["Turn-based<br/>concurrency"]:::note
    G --- noteG

    noteDir["Location transparency"]:::note
    Directory --- noteDir

    classDef note fill:#fff3cd,stroke:#f0ad4e,color:#333,font-size:12px;
\`\`\``;
  
  return (
    <div className="slide markdown-slide">
      <h1>From First Principles: Why Distributed State Is Hard and How Virtual Actors Help</h1>
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
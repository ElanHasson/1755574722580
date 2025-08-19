import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useEffect, useRef } from 'react';
import mermaid from 'mermaid';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

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
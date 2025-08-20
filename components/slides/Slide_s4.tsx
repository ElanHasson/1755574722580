import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import Mermaid from '../../components/Mermaid';

export default function Slide() {
  const markdown = `- **From first principles**: one grain per identity; runtime activates on demand, routes by ID, and processes one request at a time (no locks)
- **What we’ll build**: a Cart grain with persisted state, a durable reminder, and a stream subscription (all at-least-once safe)
- **Why it scales**: location transparency + turn-based concurrency + storage/streams providers = cloud-native state without custom plumbing
- **Reliability tips**: reminders and streams are at-least-once—make handlers idempotent (dedupe by EventId or Version)
\`\`\`csharp
using Orleans;
using Orleans.Runtime;
using Orleans.Streams;

public interface ICartGrain : IGrainWithStringKey
{
    Task AddItem(Item item);
    Task<Cart> Get();
}

[GenerateSerializer]
public sealed class Item { [Id(0)] public string Id { get; init; } = Guid.NewGuid().ToString(); [Id(1)] public string Sku { get; init; } = ""; [Id(2)] public int Qty { get; init; } }
[GenerateSerializer]
public sealed class Cart { [Id(0)] public List<Item> Items { get; set; } = new(); [Id(1)] public HashSet<string> SeenEvents { get; set; } = new(); }
[GenerateSerializer]
public sealed class CartEvent { [Id(0)] public string Id { get; init; } = Guid.NewGuid().ToString(); [Id(1)] public Item Item { get; init; } = new(); }

public sealed class CartGrain : Grain, ICartGrain, IRemindable
{
    private readonly IPersistentState<Cart> _state;
    private StreamSubscriptionHandle<CartEvent>? _sub;

    public CartGrain([PersistentState("cart","cartStore")] IPersistentState<Cart> state) => _state = state;

    public override async Task OnActivateAsync(CancellationToken ct)
    {
        await RegisterOrUpdateReminder("reconcile", TimeSpan.FromSeconds(10), TimeSpan.FromMinutes(1)); // durable
        var provider = GetStreamProvider("Default");
        var stream = provider.GetStream<CartEvent>(StreamId.Create("cart-events", this.GetPrimaryKeyString()));
        _sub = await stream.SubscribeAsync(async (e, _) => { // at-least-once
            if (_state.State.SeenEvents.Add(e.Id)) { _state.State.Items.Add(e.Item); await _state.WriteStateAsync(); }
        });
    }

    public Task<Cart> Get() => Task.FromResult(_state.State);

    public async Task AddItem(Item item)
    {
        _state.State.Items.Add(item);
        await _state.WriteStateAsync(); // persisted
    }

    public Task ReceiveReminder(string name, TickStatus _) // idempotent
        => Task.CompletedTask; // e.g., reconcile with inventory, emit metrics
}
\`\`\`
\`\`\`mermaid
flowchart TD
    A[Client] --> B[Gateway]
    B --> C["CartGrain (activation)"]
    C --> D["(Storage: cartStore)"]
    E[Reminder Service] --> C
    F[Stream Provider: Default] --> C
    C -- On demand --> D
\`\`\`
`;
  
  return (
    <div className="slide markdown-slide">
      <h1>Mini Demo: Build a Cart Grain with Persisted State, a Reliable Reminder, and a Stream Subscription</h1>
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
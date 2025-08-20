import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import Mermaid from '../../components/Mermaid';

export default function Slide() {
  const markdown = `- **Grains & Silos**: Virtual actors with stable identity and on-demand activations; silos host activations; clients call by identity via gateways
- **Placement & Directory**: Placement strategies choose a silo; directory maps identity → activation; location transparency hides where code runs
- **Persistence**: \`IPersistentState<T>\` with storage providers; write asynchronously; design for versioning and idempotency
- **Timers vs Reminders**: Timers are in-memory per activation; reminders are durable, cluster-managed, at-least-once
- **Streams & Concurrency**: Streams decouple producers/consumers with at-least-once; grains are single-threaded per activation; reentrancy is opt-in; use StatelessWorker for parallelism
\`\`\`csharp
public interface ICartGrain : IGrainWithStringKey
{
    Task AddItem(string sku, int qty);
    Task<Cart> Get();
}

public class CartGrain : Grain, ICartGrain, IRemindable
{
    [PersistentState("cart")] private readonly IPersistentState<Cart> _state;
    private IAsyncStream<CartEvent> _stream;

    public CartGrain([PersistentState("cart")] IPersistentState<Cart> state) => _state = state;

    public override async Task OnActivateAsync(CancellationToken ct)
    {
        _stream = GetStreamProvider("Default").GetStream<CartEvent>(this.GetPrimaryKeyString(), "cart");
        await RegisterOrUpdateReminder("reconcile", TimeSpan.FromMinutes(1), TimeSpan.FromMinutes(5));
    }

    public async Task AddItem(string sku, int qty)
    {
        _state.State.Items.Add(new LineItem(sku, qty));
        await _state.WriteStateAsync(); // persistence
        await _stream.OnNextAsync(new CartEvent.ItemAdded(sku, qty)); // stream publish
    }

    public Task<Cart> Get() => Task.FromResult(_state.State);

    public Task ReceiveReminder(string name, TickStatus status)
    {
        // idempotent, at-least-once handler
        return Task.CompletedTask;
    }
}
\`\`\`
\`\`\`mermaid
flowchart LR
    Client-->Gateway-->Directory
    Directory--route/activate-->Silo
    Silo--runs-->Grain[Grain activation]
    Grain--persist-->Storage[(Storage provider)]
    Grain--publish/consume-->Streams[(Stream provider)]
    Grain--in-memory-->Timer[Timer]
    Silo--durable schedule-->ReminderService[Reminder service]
    ReminderService--callback-->Grain
\`\`\``;
  
  return (
    <div className="slide markdown-slide">
      <h1>Orleans Fundamentals: Grains, Silos, Placement, Persistence, Timers/Reminders, Streams, Concurrency</h1>
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
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import Mermaid from '../../components/Mermaid';

export default function Slide() {
  const markdown = `- **Modeling**: 1 grain per natural key (UserId, CartId). Keep state minimal, async-only, and cohesive; avoid blocking and cross-grain chatty calls
- **Hotspot sharding**: For skewed keys, shard identity (e.g., Room#shard-7), fan-out via streams/stateless workers, and consider custom placement for locality
- **Idempotency & delivery**: Streams/reminders are at-least-once—dedupe with stable IDs and use optimistic concurrency; grain-to-grain calls are best-effort—retry where safe
- **Observability**: OpenTelemetry for logs/metrics/traces; track activation counts, queue depth, storage latency, stream lag; add health checks and circuit breakers
- **Upgrades & versioning**: Backward-compatible interfaces, rolling upgrades with stop-placement and drain, side-by-side versions, feature flags, on-activation state migration
\`\`\`csharp
// Idempotent reminder handler with optimistic concurrency (Orleans)
public interface IPayoutGrain : IGrainWithStringKey { Task ReconcileAsync(Guid batchId); }

public class PayoutGrain : Grain, IPayoutGrain, IRemindable
{
    [PersistentState("payout")] private readonly IPersistentState<PayoutState> _state;
    public PayoutGrain([PersistentState("payout")] IPersistentState<PayoutState> state) => _state = state;

    public override async Task OnActivateAsync(CancellationToken ct)
        => await RegisterOrUpdateReminder("reconcile", TimeSpan.FromMinutes(1), TimeSpan.FromMinutes(5));

    public async Task ReceiveReminder(string name, TickStatus status)
    {
        var id = status.FirstTickTime.UtcDateTime.Ticks; // stable per tick window
        if (_state.State.ProcessedIds.Contains(id)) return; // idempotent
        try
        {
            await DoWorkAsync();
            _state.State.ProcessedIds.Add(id);
            await _state.WriteStateAsync(); // provider enforces ETag/version
        }
        catch (InconsistentStateException)
        {
            await _state.ReadStateAsync(); // lost race; reload and rely on idempotency
        }
    }

    public Task ReconcileAsync(Guid batchId) => Task.CompletedTask;
}

public record PayoutState(HashSet<long> ProcessedIds);

// Hotspot sharding helper
var shardCount = 32;
int shard = Math.Abs(HashCode.Combine("BTC-USD", userId)) % shardCount;
var grain = GrainFactory.GetGrain<IOrderBookShard>($"BTC-USD#shard-{shard}");
\`\`\`
\`\`\`mermaid
flowchart LR
    A[Client] --> B[Gateway]
    B --> C[GrainRef: OrderBook]
    C --> D[Shard key calc]
    D --> E[Silo: shard-7 activation]
    E --> F[(Storage with ETag)]
    E --> G[Streams/Reminders]
    E --> H[(OpenTelemetry)]
\`\`\`
`;
  
  return (
    <div className="slide markdown-slide">
      <h1>Production Best Practices: Modeling, Hotspot Sharding, Idempotency, Observability, Upgrades</h1>
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
import { ApiError, type BlogApi } from './client';
import type { Photo, PostDetail, PostSummary } from './types';

const thumbnails = [
	'https://images.unsplash.com/photo-1639322537228-f710d846310a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080',
	'https://images.unsplash.com/photo-1762163516269-3c143e04175c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080'
];

// Mixed landscape/street fixtures with varied aspect ratios to exercise the masonry grid.
const photos: Photo[] = [
	{
		src: 'https://picsum.photos/seed/alpine-dawn/900/560',
		alt: 'Alpine ridgeline at dawn',
		width: 900,
		height: 560
	},
	{
		src: 'https://picsum.photos/seed/rainy-crosswalk/560/840',
		alt: 'Rainy crosswalk under neon',
		width: 560,
		height: 840
	},
	{
		src: 'https://picsum.photos/seed/coast-fog/800/800',
		alt: 'Fog rolling over a coastline',
		width: 800,
		height: 800
	},
	{
		src: 'https://picsum.photos/seed/desert-panorama/1200/500',
		alt: 'Desert highway panorama',
		width: 1200,
		height: 500
	},
	{
		src: 'https://picsum.photos/seed/metro-platform/520/780',
		alt: 'Empty metro platform at night',
		width: 520,
		height: 780
	},
	{
		src: 'https://picsum.photos/seed/lakeside-dusk/840/580',
		alt: 'Lakeside at dusk',
		width: 840,
		height: 580
	},
	{
		src: 'https://picsum.photos/seed/old-town-alley/600/900',
		alt: 'Narrow old-town alley',
		width: 600,
		height: 900
	},
	{
		src: 'https://picsum.photos/seed/forest-stream/820/620',
		alt: 'Stream cutting through forest',
		width: 820,
		height: 620
	}
];

const posts: PostDetail[] = [
	{
		slug: 'observability-is-a-contract',
		title: 'Observability is a contract, not a dashboard',
		subtitle: 'Schemas, sampling budgets, and the questions your pager will actually ask',
		preview:
			'A long-form field guide to logs, traces, and metrics as promises between teams: what every service owes its operators, how to structure a logging schema that survives contact with reality, why sampling is a product decision, and how to keep cardinality inside a budget instead of a warning. Includes worked examples in Go, YAML, and shell.',
		date: '2024-06-02',
		readTime: 16,
		thumbnail: thumbnails[1],
		tags: ['observability', 'logging', 'tracing', 'metrics'],
		content: `Dashboards are what observability looks like after it has already failed. The interesting part happens earlier, as a contract: every service promising, in writing, that it can answer certain questions about itself when things go wrong at 3am.

This is a long one. Grab coffee.

## Why "observability" is a contract

A system is observable when an operator can ask arbitrary questions of it without shipping new code. That definition sounds academic until you watch someone try to answer "which tenant drove the p99 spike between 02:10 and 02:20?" on a system that logs free-text strings.

### The questions you must be able to ask cold

Before a service touches production, its owner should be able to answer these without opening a laptop:

- What is it doing right now, and where is it stuck?
- Which upstream dependency is slowing it down?
- Which tenant, feature flag, or queue is responsible for the pain?
- What changed in the last deploy window?

If any of those require archaeology, the contract is incomplete.

\`\`\`mermaid
pie title what a noisy pager actually contains
  "duplicate alerts" : 48
  "flapping thresholds" : 27
  "low-severity spam" : 15
  "genuine pages" : 10
\`\`\`

### What the pager actually needs

The page itself is the last mile of observability. A page that does not name a ~~vague symptom~~ specific failed contract is noise wearing a trench coat.

## Structured logs with a schema you can defend

Free-text logs are a compounding tax: every query pays it, forever. A schema is the down payment.

### Fields worth standardizing

Every log line in the system should carry a common spine:

\`\`\`go
type LogFields struct {
	Timestamp  time.Time \x60json:"ts"\x60
	Level      string    \x60json:"level"\x60
	Service    string    \x60json:"svc"\x60
	RequestID  string    \x60json:"rid"\x60
	TenantID   string    \x60json:"tenant,omitempty"\x60
	DurationMs float64   \x60json:"dur_ms,omitempty"\x60
}
\`\`\`

The boring names matter more than the coverage. Two services disagreeing on \`rid\` versus \`request_id\` costs more over a year than any missing field.

### The cost of free-text everything

The tax shows up exactly when you cannot afford it: mid-incident, when every second of grep is a second of user pain.

## Traces: promises between services

A trace is a document signed by every service a request touched. It is only trustworthy if all the signers use the same pen.

### Sampling is a product decision

Head-based sampling at 1% feels economical until the one story you need is in the 99% you dropped. Tail-based sampling keeps the interesting stories:

\`\`\`bash
# keep anything slower than 1s, and 1% of everything else
tail-sample --latency-p99 1s --keep-slow --baseline 0.01
\`\`\`

The teams that treat sampling as configuration eventually treat it as roadmap.

![Trace waterfall of a slow checkout request](https://picsum.photos/seed/trace-waterfall/1200/700)

A well-sampled trace turns "something is slow" into "the payments span held a connection for 900ms" — the difference between an afternoon of guessing and an afternoon of fixing.

::: grid
![Alpine ridgeline at dawn](https://picsum.photos/seed/alpine-dawn/800/520)

![Rainy crosswalk under neon](https://picsum.photos/seed/rainy-crosswalk/520/760)

![Fog rolling over a coastline](https://picsum.photos/seed/coast-fog/720/720)

![Desert highway panorama](https://picsum.photos/seed/desert-panorama/1100/460)

![Empty metro platform at night](https://picsum.photos/seed/metro-platform/540/800)

![Lakeside at dusk](https://picsum.photos/seed/lakeside-dusk/820/560)

![Narrow old-town alley](https://picsum.photos/seed/old-town-alley/560/880)

![Stream cutting through forest](https://picsum.photos/seed/forest-stream/780/600)

![Harbor terraces from above](https://picsum.photos/seed/harbor-terrace/640/860)
:::

## Metrics and the cardinality budget

Every label on a metric is a multiplier on storage, query cost, and the chance you ship a panic.

| Signal   | Good labels                        | Terrible labels        |
| -------- | ---------------------------------- | ---------------------- |
| Requests | route, status, tenant              | user_id, full URL path |
| Latency  | route, dependency                  | pod name (churns)      |
| Errors   | error class                          | raw error string     |

## Making it all survive a bad Monday

The contract only exists if it is checked:

- [x] every service emits the log spine above
- [x] dashboards link to saved queries, not screenshots
- [ ] a quarterly "delete your dashboard" review
- [ ] one game day per quarter with the tracing backend on fire

> Observability is not a tool you buy. It is a promise your services make to whoever gets paged — usually future you.

## Further reading

- [A lesson in sending structured logs](https://example.com/structured-logs)
- [The cardinality problem in practice](https://example.com/cardinality)
- [Designing pages people answer](https://example.com/paging)
`
	},
	{
		slug: 'shape-of-a-useful-queue',
		title: 'The shape of a useful queue',
		subtitle: 'Backpressure, fairness, and the promises hidden between producers and consumers',
		preview:
			'A practical look at backpressure, fairness, and the costs hidden between producers and consumers. A queue is less a data structure than a set of promises about what happens when systems disagree about speed — and every new producer quietly renegotiates those promises before the first message is ever enqueued.',
		date: '2024-05-14',
		readTime: 8,
		thumbnail: thumbnails[0],
		tags: ['distributed-systems', 'queues', 'backpressure'],
		content: `Queues are not storage with a nicer API. They are a contract between speed, pressure, and time.

## The queue is a promise

A queue absorbs a burst by giving producers and consumers different speeds without pretending that the difference has disappeared. It holds work long enough for a system to make progress at its sustainable rate, turning a sharp arrival pattern into something a worker can handle.

That pause is a contract. When consumers cannot keep up, the queue defines what happens next: work waits, work is dropped, or the producer is asked to slow down. A useful queue makes that decision visible instead of hiding it behind an apparently limitless buffer.

\`\`\`mermaid
flowchart LR
  P[Producer] --> Q{{bounded queue}}
  Q --> C[Consumer]
  Q -- full --> BP[backpressure]
  BP -- refuses --> P
\`\`\`

\`\`\`mermaid
erDiagram
    subgraph title1
        CUSTOMER
        CUSTOMER {
            string name
            string custNumber
            string sector
        }
    end
    subgraph title2
        CAR ||--o{ NAMED-DRIVER : allows
        subgraph title3
            PERSON
            PERSON {
                string firstName
                string lastName
                int age
            }
        end
    end
\`\`\`

## Backpressure is the feature

\`\`\`mermaid
swimlane-beta LR
  subgraph Customer
    Browse[Browse catalogue]
    Pay[Pay]
  end
  subgraph Warehouse
    Pick[Pick items]
    Ship[Ship order]
  end
  subgraph Finance
    Invoice[Raise invoice]
  end
  Browse --> Pay
  Pay --> Pick
  Pick --> Ship
  Pay --> Invoice
\`\`\`

\`\`\`mermaid
sequenceDiagram
  autonumber
  actor Customer
  participant Web as Web app
  participant API as API gateway
  participant Bank
  Customer->>Web: Place order
  Web->>API: POST /orders
  activate API
  API->>Bank: Authorise payment
  Bank-->>API: Approved
  API-->>Web: 201 Created
  deactivate API
  Web-->>Customer: Order confirmed
  Note over Customer,Bank: One order, one transaction
\`\`\`

Bounded buffers are uncomfortable because they expose the finite nature of the system. Once the buffer fills, the producer has to choose between waiting, retrying, rejecting work, or finding another path. That choice is not an implementation detail; it is the system's response to pressure.

Explicit rejection protects downstream systems from a quiet collapse. It keeps memory use predictable, gives operators a signal they can measure, and lets callers decide whether a request is worth trying again. A queue that never says no is often only postponing the failure.

\`\`\`go
func (q *Queue) Push(job Job) error {
	if q.full() {
		return ErrBackpressure
	}
	q.items = append(q.items, job)
	return nil
}
\`\`\`

## Fairness has a cost

FIFO ordering is a clear promise, but it is not always the most useful one. Priority work may need to pass routine work, and once priorities exist, starvation becomes a risk that must be measured and managed. Fairness is a policy with a cost, not a property that appears for free.

> A queue buys time. It does not create capacity.

## A practical checklist

Choose a bound, define the rejection behavior, and make the pressure visible. Decide whether ordering matters more than throughput, then test the queue at the point where consumers fall behind.

\`\`\`bash
curl -s localhost:8080/metrics | grep queue_depth
\`\`\`

## Further reading

- [Patterns for distributed systems](https://example.com/distributed-systems)
- [Notes on reliability and failure](https://example.com/reliability)
- [Load shedding in practice](https://example.com/load-shedding)
`
	},
	{
		slug: 'when-latency-becomes-a-product-decision',
		title: 'When latency becomes a product decision',
		subtitle: 'Why the p99 is where user trust is actually won or lost',
		preview:
			'How tail latency changes architecture, budgets, and what users actually feel. Median response times are a vanity metric; the p99 is where trust is won or lost, and it hides in plain sight until a busy Friday makes it impossible to ignore.',
		date: '2024-04-02',
		readTime: 11,
		thumbnail: thumbnails[1],
		tags: ['latency', 'performance', 'product'],
		content: `Average latency is a number; tail latency is an experience. Once a request leaves the analyst's chart and reaches a person, its cost stops being measured in milliseconds and starts being measured in trust.

## The user never sees the mean

A service that answers in 40ms most of the time and in four seconds on its worst day will be remembered for the worst day. Percentiles are not a reporting convenience; they are how the product actually behaves.

## Deciding where the budget goes

Pushing the tail down usually means spending somewhere else: redundancy, caching, prefetching, or simply doing less per request. The interesting question is not how to be fast but which slowness users can live with.

> Latency budgets are product decisions that engineers execute on.

## Consequences for architecture

Once the tail is the contract, fan-out gets cheaper than round trips, timeouts become design material, and a request that can say "not now" is more honest than one that promises to be on time.

\`\`\`mermaid
sequenceDiagram
  participant U as visitor
  participant E as edge
  participant A as api
  U->>E: request
  E->>A: fan out
  A-->>E: slowest hop decides
  E-->>U: answer at p99
\`\`\`

\`\`\`yaml
apiVersion: monitoring.googleapis.com/v1
kind: UptimeCheck
spec:
  period: 60s
  timeout: 2s
\`\`\`
`
	},
	{
		slug: 'designing-for-the-failure-you-can-see',
		title: 'Designing for the failure you can see',
		subtitle: 'Operational habits for systems that fail in familiar ways',
		preview:
			'Operational habits for distributed systems that fail in familiar ways. Most outages are not exotic — they are the same three failures rehearsed under different lighting, and teams that survive them treat predictability as a feature you build, not luck you wait for.',
		date: '2024-02-18',
		readTime: 7,
		thumbnail: null,
		tags: ['operations', 'observability', 'incident-response'],
		content: `Systems rarely fail in the abstract. They fail at a component you named, at an hour you can find in a log, in a way that left a trace the week before. Designing for failure mostly means making those traces easy to find.

## Fail in familiar ways

A small set of boring, well-understood failure modes beats a large set of surprising ones. Bounded retries, explicit timeouts, and loud rejections shrink the space an investigator has to search.

## Instruments before dashboards

A metric nobody queried during the last incident is decoration. Prefer the humble signal that answers the question the runbook actually asks.

\`\`\`bash
journalctl -u orders-api --since "-30min" | grep -c 'context deadline exceeded'
\`\`\`

## Rehearse the boring failure

Chaos drills earn their keep not by finding new bugs but by checking that the old, known ones still behave the way the runbook claims.
`
	},
	{
		slug: 'a-small-field-guide-to-idempotency',
		title: 'A small field guide to idempotency',
		subtitle: 'Retries are easy; making them safe is the real interface',
		preview:
			'Retries are easy. Making them safe is the real interface. An at-least-once world without idempotency keys is just a distributed double-charge machine, patiently waiting for the network to have a bad afternoon.',
		date: '2024-01-09',
		readTime: 6,
		thumbnail: null,
		tags: ['api-design', 'idempotency', 'retries'],
		content: `A client that retries is making a promise: "this request should happen exactly once, even though I sent it twice." The server is the one that has to keep that promise.

## Keys, not intentions

Idempotency lives in the data, not in the naming. An idempotency key the server stores and compares gives a retry something to match against; a header called X-Retry does not.

\`\`\`go
if existing, ok := store.Get(req.IdempotencyKey); ok {
	return existing, nil // the retry gets the original answer
}
\`\`\`

## The response must be replayable too

Storing the key without the result is half a contract. Safe retries need the same answer, not merely the absence of a second side effect.

> Idempotency is not a property of a single handler; it is a property of the protocol between client and server.

## Start with the read models

GETs are already idempotent, and most teams underestimate how much traffic can move to a fresh read replica instead of a retried write.
`
	},
	{
		slug: 'the-day-the-clock-jumped',
		title: 'The day the clock jumped backward',
		subtitle: 'What NTP taught me about monotonic time',
		preview:
			'A one-second negative adjustment turned a lease renewal into a two-second expiry, and the postmortem wrote itself. Wall clocks are stories we tell; monotonic clocks are the only ones services can trust.',
		date: '2023-12-19',
		readTime: 7,
		thumbnail: null,
		tags: ['time', 'linux', 'distributed-systems'],
		content: `Every lease, timeout, and retry backoff in your system is a bet that time moves forward. NTP is the house that quietly corrects the bets — and sometimes it corrects them backward.

## Two clocks, one process

A process runs on at least two timelines: wall-clock time, which can jump in either direction, and monotonic time, which can only ever advance. Lease tables that store wall-clock deadlines are storing them wrong.

\`\`\`go
deadline := monotonic.Now().Add(leaseTTL) // survives an NTP step
\`\`\`

## The postmortem wrote itself

The incident was tiny and total: a renewal that looked like an expiry, a lock handed to a second owner, and a burst of duplicate work. The fix was one clock change and a dashboard panel that shows clock adjustments as a first-class signal.
`
	},
	{
		slug: 'backups-are-fantasies-restores-are-real',
		title: 'Backups are fantasies; restores are real',
		subtitle: 'The only durability test that counts runs the restore path',
		preview:
			'Nobody has ever been saved by a backup they never restored. We rehearsed the restore on a Friday afternoon and found three of our four WAL archives were unreadable — the backup job had been green for months.',
		date: '2023-12-05',
		readTime: 5,
		thumbnail: thumbnails[0],
		tags: ['postgres', 'operations', 'durability'],
		content: `A backup is a promise about the future, and promises need witnesses. The restore is the rehearsal that either keeps the promise or exposes it.

## What the rehearsal found

The archive retention job was rotating files the recovery script still needed, and one replica had been stale since a migration nobody mentioned in the runbook. Both were invisible from the backup side and obvious from the restore side.

- Restore to a scratch cluster on a schedule, not only during incidents
- Diff the restored state against a live replica automatically
- Treat "backup succeeded" dashboards with deep suspicion until the restore proves them
`
	},
	{
		slug: 'your-index-is-a-budget',
		title: 'Your index is a budget, not a feature',
		subtitle: 'Every index spent write throughput to buy read latency',
		preview:
			'Indexes are a classic cost transfer: the reader gets speed, the writer pays, and the bill arrives silently in vacuum time and failover duration. The interesting question is never "can we add an index" but "what are we willing to make slower".',
		date: '2023-11-21',
		readTime: 8,
		thumbnail: null,
		tags: ['postgres', 'performance', 'storage'],
		content: `A table without indexes is a full scan waiting to happen; a table with twelve is a write path with a tail attached. Both extremes are configuration errors.

## Counting the quiet costs

Every additional index is more work per write, more WAL, more bloat, longer vacuum cycles, and a longer recovery to replay after a crash. None of that appears on the query plan of the read you optimized.

## A rule that held up

Index the access patterns you measured, delete the ones the query planner never mentions, and re-audit quarterly. The index list is a budget: spend it on the reads that actually hurt.
`
	},
	{
		slug: 'the-small-cap-table-of-failure-licenses',
		title: 'The small cap table of failure licenses',
		subtitle: 'Every system is sold shares in what it will tolerate',
		preview:
			'Durability, availability, consistency, latency, cost: an architecture is a portfolio of who gets to fail. Naming the licenses out loud is the difference between a design and a wish.',
		date: '2023-11-07',
		readTime: 6,
		thumbnail: null,
		tags: ['architecture', 'distributed-systems', 'reliability'],
		content: `Trade-off talks get stuck on CAP trilogies and forget the practical question: which failures is this system licensed to produce, and who signed off?

## Issuing the licenses

A synchronous replication policy licenses latency and forbids data loss. A cache with a long TTL licenses staleness and forbids read pressure. An eventual-consistency feed licenses confusion and forbids downtime.

## Reading your own fine print

The healthiest systems I have worked on had a page — a short, boring table: for each data flow, what can be late, what can be lost, what can be slow, what must never happen. When a new incident class appeared, we asked which line of the table allowed it, and either fixed the system or updated the table.
`
	},
	{
		slug: 'secrets-are-software',
		title: 'Secrets are software',
		subtitle: 'They rot, drift, and break builds like anything else',
		preview:
			'Treat credentials like code and the chores write themselves: versioning, rotation, provenance, blast-radius review. Treating them like magic scrollwork is how a single YAML file becomes an incident.',
		date: '2023-10-24',
		readTime: 9,
		thumbnail: null,
		tags: ['security', 'kubernetes', 'operations'],
		content: `The moment a secret is pasted into a dashboard, it becomes undebuggable software: no version, no owner, no expiry, no diff.

## Version everything

\`\`\`yaml
apiVersion: v1
kind: Secret
metadata:
  name: feed-writer
  annotations:
    rotation.deadline: "2023-12-01"
\`\`\`

A rotation deadline is an executable design decision; a rotation wiki page is a wish. The boring mechanics — sealed at deploy, consumed from the environment, logged with provenance — make the interesting questions (blast radius, ownership, expiry) tractable.

## Audit the shadows

Every secret that exists only in someone's terminal history is an outage in storage.
`
	},
	{
		slug: 'one-service-owns-the-clock',
		title: 'One service owns the clock',
		subtitle: 'Scheduling is a leadership problem wearing a timer costume',
		preview:
			'When two pods both believe it is their turn to run the cron job, the bug is not in the crontab — it is in the absence of a single owner. Fencing, leases, and boring leadership beat cleverness.',
		date: '2023-10-10',
		readTime: 7,
		thumbnail: thumbnails[1],
		tags: ['kubernetes', 'distributed-systems', 'scheduling'],
		content: `A scheduled job is a tiny distributed system with exactly the same problems: mutual exclusion, failure detection, and the clock.

## Leases, not locks

The durable pattern is a lease: a TTL-based promise renewed on a monotonic timer, with a fencing token that makes stale owners provably stale. A lock without a deadline is a deadlock with extra steps; a lease without fencing is a lock that forgot who it is.

## The ownership question

Before reaching for a scheduler framework, answer the design question: which single component owns "when does this run, and did it already?" If nobody can name it, the cron job is a distributed system by accident — and it will behave like one.
`
	},
	{
		slug: 'the-panic-you-do-not-log',
		title: "The panic you don't log",
		subtitle: 'Error-handling is story design for whoever gets paged',
		preview:
			'Half of an incident is the bug; the other half is whether the logs can tell the story backward from the page. We deleted noisy errors, promoted three quiet ones to structured events, and the MTTR halved without fixing anything.',
		date: '2023-09-26',
		readTime: 5,
		thumbnail: null,
		tags: ['observability', 'go', 'logging'],
		content: `Every error path is a small narrative decision: what will the next reader need, and how cheaply can they get it?

## Delete the shouty, promote the quiet

\`\`\`go
slog.Error("lease renewal failed",
	"attempt", n, "ttl", remaining, "leader", leaderID)
\`\`\`

Loud but vague logs are the opium of incident response: they feel like observability and deliver panic. The three structured events that survived our cull — lease handoff, queue-depth breach, dependency timeout — answer almost every page we get, because each one names its contract.

## Log the promises, not the plumbing

Log when a system breaks a promise the pager cares about; the plumbing already has a name in the trace.
`
	}
];

function summarize(post: PostDetail): PostSummary {
	return {
		slug: post.slug,
		title: post.title,
		subtitle: post.subtitle,
		preview: post.preview,
		date: post.date,
		readTime: post.readTime,
		thumbnail: post.thumbnail
	};
}

export const mockApi: BlogApi = {
	async getPosts({ offset = 0, limit = posts.length, tag } = {}) {
		const source = tag ? posts.filter((p) => p.tags.includes(tag)) : posts;
		return { total: source.length, items: source.slice(offset, offset + limit).map(summarize) };
	},

	async getPost(slug) {
		const post = posts.find((p) => p.slug === slug);
		if (!post) throw new ApiError(404, `post not found: ${slug}`);
		return post;
	},

	async suggestPosts(q, limit = 5) {
		const needle = q.toLowerCase();
		const results = posts
			.filter((p) => `${p.title} ${p.preview}`.toLowerCase().includes(needle))
			.slice(0, limit)
			.map(summarize);
		return { results };
	},

	async searchPosts(q, { offset = 0, limit = 10 } = {}) {
		const needle = q.toLowerCase().trim();
		if (!needle) return { total: 0, items: [] };
		const scored = posts
			.map((p) => ({
				post: p,
				score:
					`${p.title} ${p.subtitle} ${p.preview} ${p.tags.join(' ')}`.toLowerCase().split(needle)
						.length - 1
			}))
			.filter((s) => s.score > 0)
			.sort((a, b) => b.score - a.score);
		return {
			total: scored.length,
			items: scored.slice(offset, offset + limit).map((s) => summarize(s.post))
		};
	},

	async getPhotos({ limit = photos.length } = {}) {
		return { total: photos.length, items: photos.slice(0, limit) };
	},

	async getFeaturedPhoto() {
		return {
			src: 'https://picsum.photos/seed/hero-ridgeline/900/1150',
			alt: 'Ridgeline climbing above the clouds at dawn',
			width: 900,
			height: 1150
		} satisfies Photo;
	}
};

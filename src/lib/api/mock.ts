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

## Backpressure is the feature

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

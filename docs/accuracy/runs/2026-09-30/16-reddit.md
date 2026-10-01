# 16-reddit — https://www.reddit.com

*SPA, bot defences.* Client-heavy app that may block automated access.

Scan: 29.3s · scoreMethod **measured** · scores {"overall":65,"technical":92,"content":71,"aeoGeo":15,"performance":78} · simulated: false · AI used: true

## Measurements vs independent ground truth

| Fact | Scanner | Ground truth | |
|---|---|---|---|
| title | "Reddit - The heart of the internet" | "Reddit - The heart of the internet" | ok |
| meta description present | true | true | ok |
| canonical | https://www.reddit.com/ | https://www.reddit.com/ | ok |
| viewport present | true | true | ok |
| html lang | en-US | en-US | ok |
| H1 count | 0 | 0 | ok |
| H2 count | 1 | 1 | ok |
| images (with src) | 125 | 26 <br><sub>DOM has 26 <img>, 26 with a source</sub> | **MISMATCH** |
| images missing/empty alt | 59 | 22 <br><sub>no alt attr 1, empty alt 21</sub> | **MISMATCH** |
| links (scanner total vs real+hash anchors) | 199 | 95+1 hash | **MISMATCH** |
| JSON-LD types | 0 | 0 | ok |
| visible words (rendered) | 2296 | 474 <br><sub>innerText vs markup count differ for hidden text; tolerance 30%</sub> | **MISMATCH** |
| hreflang present | false | false | ok |
| raw words (no JS) | 1 | 11 <br><sub>ground truth = real load with JavaScript disabled</sub> | ok |
| raw links (no JS) | 0 | 18 | **MISMATCH** |
| rendered words (facts) | 2303 | 474 | **MISMATCH** |
| robots.txt blocks all | false | true | **MISMATCH** |
| sitemap found | false | true <br><sub>sitemap.xml HTTP 200, robots directive no</sub> | **MISMATCH** |
| llms.txt found | false | false <br><sub>llms.txt HTTP 200 (HTML, not a real llms.txt)</sub> | ok |
| header hsts | true | true | ok |
| header csp | true | true | ok |
| header xFrameOptions | true | true | ok |
| header xContentTypeOptions | true | true | ok |
| header referrerPolicy | false | false | ok |
| bot GPTBot | 403 blocked | 403 blocked | ok |
| bot ClaudeBot | 429 blocked | 429 blocked | ok |
| bot CCBot | 429 blocked | 429 blocked | ok |
| bot Bytespider | 429 blocked | 429 blocked | ok |
| bot OAI-SearchBot | 200 | 200 | ok |
| bot Claude-SearchBot | 200 | 200 | ok |
| bot PerplexityBot | 200 | 200 | ok |
| bot Googlebot | 403 blocked | 403 blocked | ok |
| bot Bingbot | 403 blocked | 403 blocked | ok |
| bot Applebot | 200 | 200 | ok |
| bot ChatGPT-User | 403 blocked | 403 blocked | ok |
| bot Claude-User | 200 | 200 | ok |
| bot Perplexity-User | 200 | 200 | ok |

## Findings (as shown to the user)

1. **critical** Without JavaScript the page contains only 1 words (2303 once scripts run).
2. **critical** Search or assistant crawlers are refused by the site: Googlebot, Bingbot, ChatGPT-User.
3. **critical** Googlebot and Bingbot both returned HTTP 403 on direct request to https://www.reddit.com/ — if this reflects production behaviour for these user agents, search indexing of the page is at risk. This is the single highest-severity finding in the payload.
4. **critical** GPTBot (403) and ChatGPT-User (403) are blocked, while OAI-SearchBot returns 200. This means OpenAI's search crawler can reach the page but its training and user-triggered fetch agents cannot — an inconsistent access posture that limits ChatGPT's ability to quote or ground answers on Reddit content.
   - ⚠ says OAI-SearchBot is blocked but it got HTTP 200
5. **critical** The plain (non-JS) response is effectively empty: rawBytes 8,397, rawWords 1, rawLinks 0, versus 2,303 rendered words and 199 rendered links. It is commonly reported that many AI retrieval crawlers do not execute JavaScript, so the content these agents can retrieve is close to nil.
6. **critical** No JSON-LD structured data of any type is present (structuredData.hasJsonLd false, structuredData.types empty, structuredDataEntities empty). There is no machine-readable statement of what the page is, who publishes it, or what its discussion entities are.
7. **critical** The page has zero H1 elements (headings.h1 is an empty array) while carrying 2,296 words of content. There is no top-level semantic anchor for the page topic.
8. **critical** 59 of 125 images are missing alt text (47% of images on the page), an accessibility and content-comprehension gap for both assistive technology and image-understanding agents.
   - ⚠ quotes 125 images; page has 26 (22 without useful alt)
9. **critical** The crawl entry point was redirected through a js_challenge URL (redirectChain contains a single challenge hop with jsc_token), confirming that the site gates plain HTTP clients behind a JavaScript challenge — the root cause of the empty raw HTML.
10. **fix [high/aeo-geo]** Let search and assistant crawlers through your CDN or firewall. These crawlers were refused when requesting the home page with their published user agents: Googlebot (HTTP 403), Bingbot (HTTP 403), ChatGPT-User (HTTP 403). Pages they cannot fetch cannot be indexed or cited by the engines and assistants behind them. robots.txt allows them, so the site is saying "welcome" and then refusing. In your CDN, WAF or bot-prot…
11. **fix [medium/aeo-geo]** Decide, and state, whether AI-training crawlers are welcome. GPTBot (HTTP 403), ClaudeBot (HTTP 429), CCBot (HTTP 429), Bytespider (HTTP 429) were refused even though robots.txt does not disallow them. Search and assistant crawlers (OAI-SearchBot, Claude-SearchBot, PerplexityBot, Applebot, Claude-User, Perplexity-User) were let through, so answer-engine citation is not affected by this. Whether to block AI-training c…
   - ⚠ says OAI-SearchBot is blocked but it got HTTP 200
   - ⚠ says Claude-SearchBot is blocked but it got HTTP 200
   - ⚠ says PerplexityBot is blocked but it got HTTP 200
   - ⚠ says Applebot is blocked but it got HTTP 200
   - ⚠ says Claude-User is blocked but it got HTTP 200
   - ⚠ says Perplexity-User is blocked but it got HTTP 200
12. **fix [high/aeo-geo]** Put the main content in the HTML the server sends. A plain request with no JavaScript returns 1 words and 0 links; after a real browser runs the page it is 2303 words and 199 links. It is commonly reported that many AI retrieval crawlers do not execute JavaScript (this scan did not test each crawler), so they may see only the smaller version. Server-render or pre-render the headline, main sections, FAQ and navigation…
13. **fix [high/content]** Add a single descriptive H1 to the homepage. The page renders 2,296 words with an H2 of 'Popular Communities' but no H1 at all. The page has no top-level semantic statement of its subject. Add exactly one H1 to the homepage template that names the page's purpose in plain language (for example a heading built from the existing meta title concept, 'Reddit - The heart of the internet'). Keep the existing 'Popular Commun…
14. **fix [high/aeo-geo]** Add Organization and WebSite structured data. No JSON-LD is present on the page (hasJsonLd false, types empty). There is no machine-readable entity declaration for the publisher or the site, which weakens entity grounding for AI answer engines and removes eligibility for sitelinks search box and knowledge-panel style enhancements. Add a JSON-LD block to the homepage containing an Organization entity (name, url, logo,…
15. **fix [medium/content]** Add alt text to the 59 images missing it. 59 of 125 images on the page have no alt attribute. Decorative images legitimately carry empty alt text, so this should be triaged rather than blanket-filled. Audit the 59 images and split them into decorative and informative. Give decorative images alt="" so assistive technology skips them. Give informative images (community icons, avatars, thumbnails that convey the topic o…
   - ⚠ quotes 59 images; page has 26 (22 without useful alt)
   - ⚠ quotes 125 images; page has 26 (22 without useful alt)
   - ⚠ quotes 59 images; page has 26 (22 without useful alt)
16. **fix [medium/technical]** Add a meta robots directive and review indexability signals. The meta robots tag is empty on the homepage. Combined with the 403 responses to Googlebot and Bingbot, there is no positive indexability signal on the page. Add an explicit meta robots tag of 'index, follow' (or the intended policy) to the homepage template, and confirm it matches the X-Robots-Tag header behaviour at the edge. If any part of the page is in…
17. **fix [low/technical]** Add a Referrer-Policy security header. HSTS, CSP, X-Frame-Options and X-Content-Type-Options are all present, but referrerPolicy is false. This is a hardening gap, not a ranking factor. Add a Referrer-Policy header at the edge. 'strict-origin-when-cross-origin' is a safe default that preserves analytics referrer data while limiting leakage to third parties.
18. **fix [medium/content]** Strengthen social sharing metadata. ogTitle is 'reddit' (lowercase, not the page title), ogDescription is empty, and ogImage points at a 192x192 favicon rather than a share card. twitterCard is 'summary' rather than a large-image card. Shared links will render as a bare, low-context card. Set ogTitle to the full page title, populate ogDescription with the existing meta description copy, replace ogImage with a 1200x63…
19. **fix [medium/performance]** Reduce the 924 KB homepage payload. The homepage transfers 924.1 KB. The lab LCP of 1,144 ms and CLS of 0.002 are healthy, so this is not an emergency, but payload size is the main lever left on this page. Audit the largest transferred assets on the homepage and defer or lazy-load below-the-fold media and non-critical scripts. Serve modern image formats and set explicit width/height on images to protect the current C…
20. **fix [low/aeo-geo]** Publish an llms.txt file. llmsTxtFound is false. There is no machine-readable map of the site's most useful content for AI agents. Publish /llms.txt at the domain root listing the canonical URL, a one-line description, and curated links to the highest-value public sections and content types. Keep it short and factual; it is a discovery aid, not a ranking mechanism.

Removed by the checker (2): "Resolve the 403 responses to Googlebot and Bingbot" (replaced by a measured finding on the same topic); "Serve meaningful HTML without requiring JavaScript" (replaced by a measured finding on the same topic)
Added by the checker: search/assistant crawlers blocked; AI-training crawler block; JavaScript-dependent content

## Reviewer verdict

_to be completed by a human reviewer_

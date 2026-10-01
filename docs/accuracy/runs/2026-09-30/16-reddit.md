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

Counts: ACCURATE 9, INACCURATE 3, MISLEADING 7, UNSUPPORTED 0, SUBJECTIVE 1.

**Mismatches explained (checked live: three Chromium variants, curl).** The scanner is right, the ground-truth run is wrong. Both runs were served the same page (both pass Reddit's JS challenge: the scanner's `redirectChain` and the ground `finalUrl` both carry `?js_challenge=1&jsc_token=...`; no variant difference, no block). Re-measuring with the scanner's UA/viewport, the ground tool's UA/viewport and a plain Chrome UA gives 125 / 141 / 142 images, 2,080 / 2,795 / 2,390 innerText words, 189 / 201 / 201 links, H1 0, H2 1. A real visitor therefore gets ~140 images, ~2,000-2,800 words, ~200 links. The ground run's 26 images / 474 words / 95 links is a snapshot taken before the feed hydrated (its `bodySample` shows only the first posts) = ground tool defect (R3-02). Scanner 125 vs 141 images and 199 vs 201 links is the 800px default viewport (R3-01); 2,296 words is within normal overcount (A-09). Alt: 59 is 1 no-attribute + 58 `alt=""` (A-08). Raw 1 word / 0 links (scanner) vs 11 / 18 (ground) is the same JS-challenge page seen twice: curl returns 8,397 bytes, exactly the scanner's `rawBytes`, `<title>Reddit</title>` and a script-submitted form (R3-07). robots.txt: scanner got a 403 at scan time (A-01); the file is `User-agent: * / Disallow: /` (curl, Chrome UA and `node` UA all 200 now), so ground "blocks all = true" is right, scanner "false" is wrong. Sitemap: `/sitemap.xml` is a 200 HTML page (challenge), robots has no Sitemap line, so "no sitemap" is correct and ground "found" is a ground-tool false positive (A-12).

Biggest defect: robots.txt disallows the whole site and the report says the opposite ("robots.txt allows them", "does not disallow them", "welcomes crawlers"). The missing critical finding is "robots.txt disallows every crawler".

1. ACCURATE: 1 word without JS is measured (curl: 8,397-byte challenge page); the cause is the challenge, see 9.
2. MISLEADING: the 403s are for spoofed UAs from a non-Google/Bing/OpenAI IP (A-02); Googlebot/Bingbot are IP-verified, and robots.txt itself disallows everyone, which is not mentioned.
3. MISLEADING: "single highest-severity finding" rests on spoofed-UA 403s; the real blocker is `Disallow: /` in robots.txt (unread, A-01). "search indexing at risk" is unsupported by these probes.
4. MISLEADING: statuses are right, but the "OpenAI's search crawler can reach it but training/user agents cannot" posture is not what robots.txt says (Disallow: / for all, OAI-SearchBot included); inference unsupported. (The sheet's flag on OAI-SearchBot is a false alarm.)
5. ACCURATE: rawBytes 8,397 / rawWords 1 / rawLinks 0 / 2,303 and 199 verified; "close to nil for non-JS crawlers" is hedged and true of the challenge page.
6. ACCURATE: no JSON-LD in rendered or raw DOM; "critical" is inflated (A-13).
7. ACCURATE: zero `<h1>` confirmed in all three variants; word count is the A-09 overcount (innerText ~2,000+).
8. MISLEADING: only 1 of 125 images lacks the alt attribute, 58 have `alt=""` (many community icons next to text, valid decorative); "47%" and "accessibility gap" overstated (A-08).
9. ACCURATE: the first navigation lands on a js_challenge URL; curl shows the challenge page to non-JS clients. This is the real cause of findings 1/5/12.
10. INACCURATE: "robots.txt allows them" is false (Disallow: / for `*`); it came from an unreadable robots.txt (A-01). Googlebot/Bingbot 403 are spoofed-UA probes (A-02). Remediation (let crawlers through) cannot be derived from this evidence.
11. INACCURATE: "even though robots.txt does not disallow them" is false, and "answer-engine citation is not affected" is unsupported given the site-wide Disallow. The 403/429 statuses themselves are accurate.
12. MISLEADING: the raw HTML is a bot-challenge page, not an unrendered app; "server-render" is not supported (R3-07, A-03).
13. ACCURATE: no H1, H2 "Popular Communities" (1 H2) confirmed; advice reasonable.
14. SUBJECTIVE: reasonable advice, no JSON-LD is true; marking it high priority for a feed homepage is debatable.
15. INACCURATE: "59 of 125 have no alt attribute" is wrong, 1 lacks the attribute; the advice to triage decorative vs informative in the same text is right (A-08).
16. MISLEADING: empty robots meta means indexable by default, so "no positive indexability signal" is wrong framing and "index, follow" is a no-op; the real indexability signal (robots.txt Disallow: /) is missed.
17. ACCURATE: Referrer-Policy absent on GET (curl -D); other four headers present.
18. ACCURATE: og:title "reddit", og:description empty, og:image the 192x192 favicon, twitter:card summary (ground and scan event agree).
19. MISLEADING: 924.1 KB is the serialized DOM (`page.content()`), not "transferred" bytes (R3-08); LCP 1,144 ms / CLS 0.002 are as measured at 800px.
20. ACCURATE: `/llms.txt` is not a real file (returns the challenge HTML with 200); low-value advice, labelled low.

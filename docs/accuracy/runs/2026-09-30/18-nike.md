# 18-nike — https://www.nike.com

*e-commerce, JS heavy.* Large product imagery, lazy loading.

Scan: 41.5s · scoreMethod **measured** · scores {"overall":74,"technical":96,"content":90,"aeoGeo":53,"performance":49} · simulated: false · AI used: true

## Measurements vs independent ground truth

| Fact | Scanner | Ground truth | |
|---|---|---|---|
| title | "Nike. Just Do It. Nike.com" | "Nike. Just Do It. Nike.com" | ok |
| meta description present | true | true | ok |
| canonical | https://www.nike.com/ | https://www.nike.com/ | ok |
| viewport present | true | true | ok |
| html lang | en-US | en-US | ok |
| H1 count | 1 | 1 | ok |
| H2 count | 8 | 13 | **MISMATCH** |
| images (with src) | 88 | 88 <br><sub>DOM has 127 <img>, 88 with a source</sub> | ok |
| images missing/empty alt | 42 | 42 <br><sub>no alt attr 0, empty alt 42</sub> | ok |
| links (scanner total vs real+hash anchors) | 603 | 598+4 hash | ok |
| JSON-LD types | 5 | 5 | ok |
| visible words (rendered) | 2076 | 463 <br><sub>innerText vs markup count differ for hidden text; tolerance 30%</sub> | **MISMATCH** |
| hreflang present | false | false | ok |
| raw words (no JS) | 1226 | 318 <br><sub>ground truth = real load with JavaScript disabled</sub> | **MISMATCH** |
| raw links (no JS) | 499 | 499 | ok |
| rendered words (facts) | 2081 | 463 | **MISMATCH** |
| robots.txt blocks all | false | true | **MISMATCH** |
| sitemap found | true | true <br><sub>sitemap.xml HTTP 404, robots directive yes</sub> | ok |
| llms.txt found | false | false <br><sub>llms.txt HTTP 404 (HTML, not a real llms.txt)</sub> | ok |
| header hsts | true | true | ok |
| header csp | true | true | ok |
| header xFrameOptions | true | true | ok |
| header xContentTypeOptions | false | false | ok |
| header referrerPolicy | false | false | ok |
| bot GPTBot | 403 blocked | 403 blocked | ok |
| bot ClaudeBot | 403 blocked | 403 blocked | ok |
| bot CCBot | 403 blocked | 403 blocked | ok |
| bot Bytespider | 403 blocked | 403 blocked | ok |
| bot OAI-SearchBot | 403 blocked | 403 blocked | ok |
| bot Claude-SearchBot | 403 blocked | 403 blocked | ok |
| bot PerplexityBot | 403 blocked | 403 blocked | ok |
| bot Googlebot | 403 blocked | 403 blocked | ok |
| bot Bingbot | 403 blocked | 403 blocked | ok |
| bot Applebot | 403 blocked | 403 blocked | ok |
| bot ChatGPT-User | 403 blocked | 403 blocked | ok |
| bot Claude-User | 403 blocked | 403 blocked | ok |
| bot Perplexity-User | 403 blocked | 403 blocked | ok |

## Findings (as shown to the user)

1. **critical** Search or assistant crawlers are refused by the site: OAI-SearchBot, Claude-SearchBot, PerplexityBot, Googlebot, Bingbot, Applebot, ChatGPT-User, Claude-User, Perplexity-User.
2. **critical** All 13 tested crawlers received HTTP 403 despite robotsTxtAllows being true for each: GPTBot, ClaudeBot, CCBot, Bytespider, OAI-SearchBot, Claude-SearchBot, PerplexityBot, Googlebot, Bingbot, Applebot, ChatGPT-User, Claude-User, Perplexity-User. A robots.txt allow combined with an edge 403 means the block lives in WAF/bot-management rules, not robots.txt.
3. **critical** Blocking Googlebot, Bingbot and Applebot (search role) and OAI-SearchBot, Claude-SearchBot and PerplexityBot (search role) removes the homepage from AI answer surfaces and threatens traditional indexation for the tested user agents.
4. **critical** Blocking ChatGPT-User, Claude-User and Perplexity-User (assistant role) means live user-initiated fetches on behalf of a person are refused, so the page cannot be cited when a user asks an assistant about Nike.
5. **critical** 42 of 88 images on the homepage have no alt attribute — an accessibility and content-comprehension gap on a page whose product imagery carries most of its meaning.
6. **critical** The page is JavaScript-dependent: raw HTML yields 1,226 words and 499 links, rendered yields 2,081 words and 603 links, and 14 navigation controls are buttons rather than anchors. It is commonly reported (not tested per crawler here) that many AI retrieval crawlers do not execute JavaScript, so a large share of the page is invisible to them.
7. **critical** The single H1 is 'EVERYTHINGLED HERE' — a concatenated, non-descriptive string that does not state what the page is or who it serves.
8. **critical** JSON-LD contains no Product, ItemList, BreadcrumbList or FAQPage entities, so the homepage offers machines no product, category or navigation structure.
9. **critical** Lab CLS of 0.192 exceeds the 0.1 'good' threshold in this measurement.
10. **fix [high/aeo-geo]** Let search and assistant crawlers through your CDN or firewall. These crawlers were refused when requesting the home page with their published user agents: OAI-SearchBot (HTTP 403), Claude-SearchBot (HTTP 403), PerplexityBot (HTTP 403), Googlebot (HTTP 403), Bingbot (HTTP 403), Applebot (HTTP 403), ChatGPT-User (HTTP 403), Claude-User (HTTP 403), Perplexity-User (HTTP 403). Pages they cannot fetch cannot be indexed o…
11. **fix [medium/aeo-geo]** Decide, and state, whether AI-training crawlers are welcome. GPTBot (HTTP 403), ClaudeBot (HTTP 403), CCBot (HTTP 403), Bytespider (HTTP 403) were refused even though robots.txt does not disallow them. Whether to block AI-training crawlers is the site owner's choice; the problem is only a mismatch between policy and behaviour. If the block is intentional, add matching "User-agent: … / Disallow: /" rules to robots.txt…
12. **fix [high/content]** Add descriptive alt text to the 42 unlabelled images. 42 of 88 images on the homepage have no alt attribute. Product and campaign imagery is the primary content carrier on this page, so unlabelled images reduce accessibility and remove text signal that both search engines and AI systems can read. Audit all 88 images. For meaningful images (product shots, campaign hero art, athlete imagery) write concise alt text that…
13. **fix [medium/content]** Rewrite the H1 and de-duplicate H2 headings. The page's only H1 is 'EVERYTHINGLED HERE', a concatenated string that does not describe the page. Several H2s repeat verbatim ('SAM KERRMERCURIAL SUPERFLY', 'Rep Your Team', 'NOTHING SPECIAL TOSEE HERE*', 'TRENDING' each appear twice), which weakens the document outline. Replace the H1 with a descriptive, human-readable statement of what the homepage is — for example a li…
14. **fix [medium/aeo-geo]** Extend JSON-LD beyond WebPage/Organization to product and navigation entities. The page carries JSON-LD for WebPage, Organization, ContactPoint, WebSite and SearchAction, but no Product, ItemList, BreadcrumbList or FAQPage entities. Machines therefore receive no structured signal about the products or categories featured on the homepage. Add ItemList markup for the featured product or category carousels, with each it…
15. **fix [medium/aeo-geo]** Publish an llms.txt file. llmsTxtFound is false. An llms.txt gives AI systems a curated, plain-text map of the site's most important URLs and what they contain. Create /llms.txt at the domain root. List the homepage and the highest-value category and product hub URLs with a one-line description of each. Keep it plain text, human-readable, and free of marketing filler. Link it from robots.txt as a comment for discover…
16. **fix [medium/performance]** Investigate the lab CLS of 0.192. Lab CLS measured 0.192, above the 0.1 'good' threshold. This is a lab measurement from the auditing host, not real-user field data, so it should be confirmed before large remediation. Reproduce the measurement in a controlled lab environment and, if available, compare against real-user field data. Identify the shifting elements — commonly late-loading hero imagery, web fonts, or inje…
17. **fix [low/technical]** Add X-Content-Type-Options and Referrer-Policy headers. securityHeaders shows xContentTypeOptions: false and referrerPolicy: false. HTTPS, HSTS, CSP and X-Frame-Options are all present, so this is a hardening gap rather than a vulnerability. Add 'X-Content-Type-Options: nosniff' and a Referrer-Policy value such as 'strict-origin-when-cross-origin' at the edge or origin. Verify both appear on the homepage response.
18. **fix [low/content]** Clarify the meta description. The meta description is 'Inspiring the world' — accurate to the brand but too short to communicate what the page offers to a searcher or an AI summariser. The Open Graph description is substantially better ('Nike delivers innovative products, experiences and services to inspire athletes'). Rewrite the meta description to a descriptive sentence in the 120–155 character range that states w…

Removed by the checker (2): "Resolve the edge-layer 403s for search and assista" (replaced by a measured finding on the same topic); "Server-render or pre-render primary homepage conte" (replaced by a measured finding on the same topic)
Added by the checker: search/assistant crawlers blocked; AI-training crawler block

## Reviewer verdict

Counts: ACCURATE 4, INACCURATE 3, MISLEADING 7, UNSUPPORTED 1, SUBJECTIVE 3.

**Mismatches explained (live: puppeteer at 800x600 and 1366x900, curl).** No challenge, same page for both runs. H2 8 vs 13: viewport-dependent; at the scanner's default 800px the DOM has 8 H2, at the ground tool's 1366px it has 13 (R3-01). Visible words 2,076 vs 463: live innerText is 414-463, so ground is right and the scanner overcounts hidden text about 4.5x (A-09); raw 1,226 vs JS-off 318 likewise (A-10). Robots "blocks all": the live file's `*` group has only path rules; `Disallow: /` belongs to Baiduspider/HaoSouSpider/Sogou etc., so scanner `false` is right and ground `true` is a ground-tool regex defect (A-12). Meta description: the real text is "Inspiring the world's athletes, Nike delivers innovative products, experiences and services." (93 chars); the scanner stored "Inspiring the world" (apostrophe truncation, A-14), not flagged by the sheet because only presence is compared. Crawler probes: ground and scanner agree (403 for all 13 spoofed UAs); curl with a Chrome UA and with `curl/8` gets 200, GPTBot-style and Googlebot-style UAs get 403 (Akamai UA rule); this says nothing about the real, IP-verified bots (A-02). Lab CLS: 0.185 at 800px (scanner 0.192) vs 0.054 at 1366px; LCP 13 s vs 3.1 s (R3-01). Security headers: X-Content-Type-Options and Referrer-Policy absent on GET (curl -D).

1. MISLEADING: 403s are spoofed-UA probes at the edge (A-02); reading them as "Googlebot is blocked" is unsupported; Nike is plainly indexed.
2. ACCURATE: all 13 got 403, robots allows them, and the plain Chrome UA gets 200, so the rule is in the WAF/bot manager.
3. MISLEADING: "removes the homepage from AI answer surfaces and threatens indexation" generalises from spoofed requests (A-02); the "for the tested user agents" hedge is not enough for a "critical".
4. UNSUPPORTED: nothing shows a real ChatGPT-User/Claude-User/Perplexity-User fetch (from the vendors' IPs) is refused, so "cannot be cited when a user asks" cannot be concluded.
5. INACCURATE: 0 of 88 images lack the alt attribute; all 42 are `alt=""` (valid decorative, e.g. carousel/duplicate imagery) (A-08). "Primary content carrier" is a guess.
6. MISLEADING: the raw HTML already has 499 of 603 links, all 5 JSON-LD types, and 318 of ~463 visible words; the "1,226 vs 2,081 words" is hidden-text overcount (A-09/A-10); the 14 "navigation buttons" are not the navigation (420 anchors, R3-04). "A large share of the page is invisible" is overstated.
7. SUBJECTIVE: the markup is `EVERYTHING<br>LED HERE`; this client renders it without a break ("EVERYTHINGLED HERE"), so the quoted string is real for this layout, but "non-descriptive" is a design judgement on a campaign headline, not a defect, and "critical" is not reasonable.
8. SUBJECTIVE: true that Product/ItemList/BreadcrumbList are absent; critical for a brand homepage is not reasonable (A-13).
9. MISLEADING: 0.192 is real only at the scanner's 800px viewport; at 1366px the same page measures 0.054 ("good"). Not shown as viewport-specific (R3-01).
10. MISLEADING: same as 1/3; the fix asks the owner to change a policy the evidence cannot show is wrong.
11. ACCURATE: robots.txt has no rules for GPTBot/ClaudeBot/CCBot/Bytespider (grep: none) and the edge returns 403; the statement of mismatch is right and left as the owner's choice.
12. INACCURATE: "42 of 88 have no alt attribute" is wrong (0 lack it; 42 are `alt=""`); "Audit all 88" mixes decorative with informative (A-08).
13. MISLEADING: the H1 text is the site's own `<br>` markup; the "repeating H2s" are the desktop and mobile copies of the same hero (e.g. "SAM KERR/MERCURIAL SUPERFLY" and its concatenated twin), only one visible at a time, so the "weakens the outline" point is not a real defect; the scanner also misses 5 of the 13 H2 at desktop width (R3-01).
14. SUBJECTIVE: the five types are correct; adding ItemList for carousels is a reasonable but optional enhancement.
15. ACCURATE: `/llms.txt` 404; advice is generic but true.
16. MISLEADING: lab CLS numbers are viewport-dependent (R3-01); the hedge "lab, not field" is good but the number is for a tablet-width layout.
17. ACCURATE: neither header is present on the GET response; HSTS, CSP and X-Frame-Options are.
18. INACCURATE: the quoted description is a truncation; the real one is a full sentence (A-14). The suggestion to lengthen it to 120-155 characters is fair, but the "too short" premise is wrong by a factor of 4.

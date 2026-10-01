# 13-nasa — https://www.nasa.gov

*government site.* CMS-driven, large images, many links.

Scan: 23.1s · scoreMethod **measured** · scores {"overall":87,"technical":93,"content":80,"aeoGeo":92,"performance":80} · simulated: false · AI used: true

## Measurements vs independent ground truth

| Fact | Scanner | Ground truth | |
|---|---|---|---|
| title | "NASA" | "NASA" | ok |
| meta description present | true | true | ok |
| canonical | https://www.nasa.gov/ | https://www.nasa.gov/ | ok |
| viewport present | true | true | ok |
| html lang | en-US | en-US | ok |
| H1 count | 0 | 0 | ok |
| H2 count | 12 | 12 | ok |
| images (with src) | 74 | 74 <br><sub>DOM has 74 <img>, 74 with a source</sub> | ok |
| images missing/empty alt | 0 | 33 <br><sub>no alt attr 0, empty alt 33</sub> | **MISMATCH** |
| links (scanner total vs real+hash anchors) | 283 | 283+2 hash | ok |
| JSON-LD types | 7 | 7 | ok |
| visible words (rendered) | 663 | 671 <br><sub>innerText vs markup count differ for hidden text; tolerance 30%</sub> | ok |
| hreflang present | false | false | ok |
| raw words (no JS) | 650 | 643 <br><sub>ground truth = real load with JavaScript disabled</sub> | ok |
| raw links (no JS) | 283 | 283 | ok |
| rendered words (facts) | 663 | 671 | ok |
| robots.txt blocks all | false | false | ok |
| sitemap found | true | true <br><sub>sitemap.xml HTTP 200, robots directive no</sub> | ok |
| llms.txt found | false | false <br><sub>llms.txt HTTP 404 (HTML, not a real llms.txt)</sub> | ok |
| header hsts | true | true | ok |
| header csp | false | false | ok |
| header xFrameOptions | true | true | ok |
| header xContentTypeOptions | false | false | ok |
| header referrerPolicy | false | false | ok |
| bot GPTBot | 200 | 200 | ok |
| bot ClaudeBot | 200 | 429 blocked <br><sub>bot rules can vary run to run; re-check</sub> | **MISMATCH** |
| bot CCBot | 200 | 200 | ok |
| bot Bytespider | 200 | 200 | ok |
| bot OAI-SearchBot | 200 | 200 | ok |
| bot Claude-SearchBot | 200 | 200 | ok |
| bot PerplexityBot | 200 | 200 | ok |
| bot Googlebot | 200 | 200 | ok |
| bot Bingbot | 200 | 200 | ok |
| bot Applebot | 200 | 200 | ok |
| bot ChatGPT-User | 200 | 200 | ok |
| bot Claude-User | 200 | 200 | ok |
| bot Perplexity-User | 200 | 200 | ok |

## Findings (as shown to the user)

1. **critical** The homepage has no H1 heading. The heading outline begins at H2 ('Suggested Searches', 'Featured News', 'Planetary Defenders', etc.), so the page's primary topic is never stated in the strongest on-page semantic signal. This is the single most consequential on-page defect for both Google ranking and AI answer extraction.
2. **fix [high/content]** Add a single descriptive H1 to the homepage. The crawled homepage contains zero H1 elements. Its heading structure starts at H2 and runs through a large number of H3s. Search engines and generative answer engines use the H1 to establish the page's primary entity and topic; without it, the page relies entirely on the title tag and schema for topical anchoring. Insert exactly one H1 into the main content region of the …
3. **fix [medium/technical]** Publish a Content-Security-Policy header. The security header check shows no Content-Security-Policy and no report-only policy on the response. CSP is a defence-in-depth control that limits the impact of injected scripts and is increasingly part of enterprise security baselines and third-party risk reviews. Define a Content-Security-Policy that whitelists the site's own origins plus the third-party domains actually u…
4. **fix [medium/technical]** Add X-Content-Type-Options and Referrer-Policy headers. The response sets HSTS and X-Frame-Options but omits X-Content-Type-Options and Referrer-Policy. The first prevents MIME-type sniffing attacks; the second controls how much URL information is leaked to third parties on outbound navigation. Add 'X-Content-Type-Options: nosniff' to all responses at the edge or origin. Add 'Referrer-Policy: strict-origin-when-cross…
5. **fix [medium/performance]** Reduce homepage transfer weight and request count. The homepage transfers approximately 27.6 MB across 81 requests. TTFB is only 193 ms, so the site's server is fast; the weight is in the assets. Large payloads raise cost for mobile users and slow the fetch for AI retrieval crawlers that do not wait for every asset. Audit the 81 requests and identify the largest images and scripts. Serve hero and gallery imagery in A…
6. **fix [medium/aeo-geo]** Strengthen the opening paragraph as a direct answer block. The first visible text on the page is a launch countdown and mission blurb. It is timely and specific, but it does not state in one sentence what NASA is or what the page offers, which is the form generative engines most readily quote. Directly beneath the H1, add a one-to-two sentence summary that names the entity and the page's purpose, for example: 'NASA i…
7. **fix [low/aeo-geo]** Add llms.txt as an optional machine-readable index. No llms.txt file was found at the site root. This file is an emerging convention for pointing AI agents at canonical, high-value content. It is optional and no major engine has confirmed it is read, so treat it as a low-cost experiment rather than a ranking lever. Note: llms.txt is optional and not yet confirmed to be read by the major search engines or assistants, …
8. **fix [low/aeo-geo]** Extend structured data with mission and event entities. The JSON-LD graph already covers Organization, WebSite, SearchAction, WebPage, Article, Person, and ImageObject. The homepage's dominant content is a live mission with a launch date and a countdown, which is not represented by any current entity type. Where a mission or launch is the page's focus, add an Event entity with name, startDate, location, and descripti…

Removed by the checker (0): none
Added by the checker: none

## Reviewer verdict

_to be completed by a human reviewer_

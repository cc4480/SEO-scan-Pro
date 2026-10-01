# 04-bbc-news — https://www.bbc.com/news

*news portal.* Hundreds of links and images, JSON-LD, hreflang-style editions.

Scan: 25.6s · scoreMethod **measured** · scores {"overall":91,"technical":97,"content":92,"aeoGeo":84,"performance":90} · simulated: false · AI used: true

## Measurements vs independent ground truth

| Fact | Scanner | Ground truth | |
|---|---|---|---|
| title | "BBC News - Breaking news, video and the latest to | "BBC News - Breaking news, video and the latest to | ok |
| meta description present | true | true | ok |
| canonical | https://www.bbc.com/news | https://www.bbc.com/news | ok |
| viewport present | true | true | ok |
| html lang | en-GB | en-GB | ok |
| H1 count | 1 | 1 | ok |
| H2 count | 53 | 53 | ok |
| images (with src) | 32 | 30 <br><sub>DOM has 30 <img>, 30 with a source</sub> | ok |
| images missing/empty alt | 12 | 10 <br><sub>no alt attr 10, empty alt 0</sub> | ok |
| links (scanner total vs real+hash anchors) | 152 | 163+1 hash | ok |
| JSON-LD types | 2 | 2 | ok |
| visible words (rendered) | 1547 | 1366 <br><sub>innerText vs markup count differ for hidden text; tolerance 30%</sub> | ok |
| hreflang present | true | true | ok |
| raw words (no JS) | 1738 | 1329 <br><sub>ground truth = real load with JavaScript disabled</sub> | ok |
| raw links (no JS) | 246 | 246 | ok |
| rendered words (facts) | 1565 | 1366 | ok |
| robots.txt blocks all | false | true | **MISMATCH** |
| sitemap found | true | true <br><sub>sitemap.xml HTTP 200, robots directive yes</sub> | ok |
| llms.txt found | false | false <br><sub>llms.txt HTTP 404 (HTML, not a real llms.txt)</sub> | ok |
| header hsts | true | true | ok |
| header csp | false | false | ok |
| header xFrameOptions | true | true | ok |
| header xContentTypeOptions | true | true | ok |
| header referrerPolicy | true | true | ok |
| bot GPTBot | 200 | 200 | ok |
| bot ClaudeBot | 200 | 200 | ok |
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
| bot Perplexity-User | 403 blocked | 403 blocked | ok |

## Findings (as shown to the user)

1. **critical** Search or assistant crawlers are refused by the site: Perplexity-User.
2. **critical** Perplexity-User (assistant crawler) returns HTTP 403 and is blocked — this prevents Perplexity's user-facing assistant from retrieving the page, a real loss of assistant-surface visibility.
3. **critical** ogImage is empty and twitterCard is empty — shared links and AI summarizers receive no image or card-type signal, weakening previews and entity disambiguation.
4. **critical** 12 of 32 images have no alt text — an accessibility and content-comprehension gap that also removes image context from machine readers.
5. **critical** robots.txt does not explicitly allow GPTBot, ClaudeBot, CCBot, Bytespider, OAI-SearchBot, PerplexityBot or ChatGPT-User; only Claude-SearchBot, Googlebot, Bingbot and Applebot are explicitly allowed. For a publisher that wants AI search visibility, this ambiguity should be resolved deliberately.
6. **fix [high/aeo-geo]** Let search and assistant crawlers through your CDN or firewall. These crawlers were refused when requesting the home page with their published user agents: Perplexity-User (HTTP 403). Pages they cannot fetch cannot be indexed or cited by the engines and assistants behind them. In your CDN, WAF or bot-protection settings, allow these crawlers (verify them by their vendors' published IP ranges or reverse DNS rather tha…
7. **fix [high/technical]** Populate Open Graph image and Twitter card metadata. social.ogImage is an empty string and social.twitterCard is empty. ogTitle, ogDescription and ogType are present, so the gap is specifically the image and card type. Add an og:image (1200x630, absolute HTTPS URL) and a twitter:card value of summary_large_image, plus twitter:image and twitter:title/twitter:description, to the page head template. Ensure the image URL…
8. **fix [medium/content]** Add alt text to the 12 images missing it. missingAltCount is 12 of imagesCount 32. Some of these may be decorative, but the count is high enough that editorial and thumbnail images are likely included. Audit the 12 images. For editorial/thumbnail images add concise descriptive alt text (under ~125 characters). For genuinely decorative images use alt="" explicitly. Do not keyword-stuff; describe the image.
9. **fix [medium/aeo-geo]** Extend structured data beyond WebPage and NewsMediaOrganization. structuredData.types contains only WebPage and NewsMediaOrganization. For a news index page this is valid but thin; there is no ItemList, no BreadcrumbList and no per-article NewsArticle markup on this URL. Add BreadcrumbList for the /news path and, where the page is a curated index, an ItemList referencing the lead stories. Keep NewsArticle markup on t…
10. **fix [low/performance]** Reduce network-bound load time where controllable. loadTimeMs 2238 with ttfbMs 184 means most of the measured time is transfer/network from the auditing host, not server or front-end execution. This is a measurement caveat, not a proven site defect. Do not rewrite front-end code on the basis of this number. If desired, verify with real-user monitoring (CrUX/RUM) from actual geographies. If transfer size is a concern,…
11. **fix [low/aeo-geo]** Add llms.txt for AI retrieval guidance. llmsTxtFound is false. There is no /llms.txt file to describe the site's structure and preferred content for LLM retrieval. Publish /llms.txt at the domain root with a short description of BBC News, key section URLs (/news, /sport, /business, etc.), and any usage guidance. Keep it plain text and small.

Removed by the checker (2): "Unblock Perplexity-User at the edge" (replaced by a measured finding on the same topic); "Make robots.txt AI-crawler policy explicit" (replaced by a measured finding on the same topic)
Added by the checker: search/assistant crawlers blocked

## Reviewer verdict

Lead review.
Measurements: only mismatch is "robots.txt blocks all" = **ground-truth tool bug A-12** (BBC has no site-wide block; fixed in the tool).
Findings:
1,2,6. MISLEADING (**A-15**): Perplexity-User gets 403, but BBC's robots.txt explicitly DISALLOWS Perplexity-User (and PerplexityBot, GPTBot, ClaudeBot, CCBot, Bytespider). The refusal is the site's enforced policy, not a defect; raised as critical/high.
3. ACCURATE (ogImage, twitterCard empty). 4. ACCURATE number (12 of 32; ground: 10 lack the attribute), no empty-alt split (**A-08**).
5. INACCURATE (**A-15**): "robots.txt does not explicitly allow GPTBot..., ambiguity should be resolved" while robots.txt explicitly disallows GPTBot, ClaudeBot, CCBot, Bytespider, PerplexityBot, Perplexity-User.
7,8,9,10,11. ACCURATE/SUBJECTIVE (llms.txt absent, thin structured data, TTFB caveat).

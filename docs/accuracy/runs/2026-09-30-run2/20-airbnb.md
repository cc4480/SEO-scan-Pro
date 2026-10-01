# 20-airbnb — https://www.airbnb.com

*SPA marketplace.* Script-built page; JSON-LD.

Scan: 26.8s · scoreMethod **measured** · scores {"overall":88,"technical":98,"content":100,"aeoGeo":72,"performance":80} · simulated: false · AI used: true

## Measurements vs independent ground truth

| Fact | Scanner | Ground truth | |
|---|---|---|---|
| title | "Airbnb | Vacation rentals, cabins, beach houses,  | "Airbnb | Vacation rentals, cabins, beach houses,  | ok |
| meta description present | true | true | ok |
| canonical | https://www.airbnb.com/ | https://www.airbnb.com/ | ok |
| viewport present | true | true | ok |
| html lang | en | en | ok |
| H1 count | 1 | 1 | ok |
| H2 count | 5 | 6 | ok |
| images (with src) | 33 | 43 <br><sub>DOM has 43 <img>, 43 with a source</sub> | **MISMATCH** |
| images missing/empty alt | 0 | 43 <br><sub>no alt attr 18, empty alt 25</sub> | **MISMATCH** |
| links (scanner total vs real+hash anchors) | 178 | 196+1 hash | ok |
| JSON-LD types | 2 | 2 | ok |
| visible words (rendered) | 1456 | 1528 <br><sub>innerText vs markup count differ for hidden text; tolerance 30%</sub> | ok |
| hreflang present | true | true | ok |
| raw words (no JS) | 41 | 23 <br><sub>ground truth = real load with JavaScript disabled</sub> | ok |
| raw links (no JS) | 10 | 10 | ok |
| rendered words (facts) | 1456 | 1528 | ok |
| robots.txt blocks all | false | false | ok |
| sitemap found | true | true <br><sub>sitemap.xml HTTP 404, robots directive yes</sub> | ok |
| llms.txt found | false | false <br><sub>llms.txt HTTP 404 (HTML, not a real llms.txt)</sub> | ok |
| header hsts | true | true | ok |
| header csp | true | true | ok |
| header xFrameOptions | true | true | ok |
| header xContentTypeOptions | true | true | ok |
| header referrerPolicy | false | false | ok |
| bot GPTBot | 403 | 403 blocked <br><sub>bot rules can vary run to run; re-check</sub> | **MISMATCH** |
| bot ClaudeBot | 403 | 403 blocked <br><sub>bot rules can vary run to run; re-check</sub> | **MISMATCH** |
| bot CCBot | 403 | 403 blocked <br><sub>bot rules can vary run to run; re-check</sub> | **MISMATCH** |
| bot Bytespider | 403 | 403 blocked <br><sub>bot rules can vary run to run; re-check</sub> | **MISMATCH** |
| bot OAI-SearchBot | 403 | 403 blocked <br><sub>bot rules can vary run to run; re-check</sub> | **MISMATCH** |
| bot Claude-SearchBot | 403 | 403 blocked <br><sub>bot rules can vary run to run; re-check</sub> | **MISMATCH** |
| bot PerplexityBot | 403 | 403 blocked <br><sub>bot rules can vary run to run; re-check</sub> | **MISMATCH** |
| bot Googlebot | 403 | 403 blocked <br><sub>bot rules can vary run to run; re-check</sub> | **MISMATCH** |
| bot Bingbot | 403 | 403 blocked <br><sub>bot rules can vary run to run; re-check</sub> | **MISMATCH** |
| bot Applebot | 403 | 403 blocked <br><sub>bot rules can vary run to run; re-check</sub> | **MISMATCH** |
| bot ChatGPT-User | 403 | 403 blocked <br><sub>bot rules can vary run to run; re-check</sub> | **MISMATCH** |
| bot Claude-User | 403 | 403 blocked <br><sub>bot rules can vary run to run; re-check</sub> | **MISMATCH** |
| bot Perplexity-User | 403 | 403 blocked <br><sub>bot rules can vary run to run; re-check</sub> | **MISMATCH** |

## Findings (as shown to the user)

1. **critical** Without JavaScript the page contains only 41 words (1456 once scripts run).
2. **fix [high/aeo-geo]** Put the main content in the HTML the server sends. A plain request with no JavaScript returns 41 words and 10 links; after a real browser runs the page it is 1456 words and 178 links. It is commonly reported that many AI retrieval crawlers do not execute JavaScript (this scan did not test each crawler), so they may see only the smaller version. Server-render or pre-render the headline, main sections, FAQ and navigati…
3. **fix [high/aeo-geo]** Investigate 403 responses to permitted AI search and assistant crawlers. Every crawler tested received HTTP 403, including OAI-SearchBot, Claude-SearchBot, PerplexityBot, ChatGPT-User, Claude-User, Perplexity-User, Googlebot, Bingbot and Applebot. For GPTBot and ClaudeBot the site's robots.txt explicitly disallows them, so those refusals are policy. For the search and assistant crawlers that robots.txt permits, the r…
4. **fix [high/aeo-geo]** Add entity-level structured data for the marketplace. The page emits only WebSite and SearchAction JSON-LD. It visibly shows property listings with prices and review ratings, but no Organization, Product/Accommodation, Offer or AggregateRating entities are declared, so machines cannot reliably attribute the brand, the listings or the ratings. Add Organization markup for Airbnb with name, url, logo and sameAs profiles…
5. **fix [high/content]** Rewrite the opening text as a direct answer. The first visible words are a raw sequence of listing names, prices and ratings ('Popular homes in San Antonio 6 of 9 items showing...'). There is no sentence that states what Airbnb is, what it offers or who it is for, which makes the page hard for answer engines to quote or summarise. Place a concise, factual lead paragraph immediately after the H1, before the listing ca…
6. **fix [medium/content]** Add how-it-works and trust content. The page has no how-it-works, about or contact section. These are the sections generative engines most often cite when answering 'how does X work' and 'is X trustworthy' queries. Add a concise how-it-works section explaining search, booking and payment in three or four steps, and an about section with company facts. Add a contact or support entry point. Keep all of it as server-ren…
7. **fix [low/technical]** Strengthen social preview metadata. Open Graph tags are present and complete, but the Twitter card is set to 'summary' rather than a large-image card, which reduces the visual footprint when the homepage is shared. Change the Twitter card type to 'summary_large_image' and confirm the og:image meets the recommended dimensions for large cards.
8. **fix [low/technical]** Add a referrer policy header. HSTS, Content-Security-Policy, X-Frame-Options and X-Content-Type-Options are all present, but no Referrer-Policy header was observed. Add a Referrer-Policy header, for example strict-origin-when-cross-origin, to control how much referrer information is sent to third parties.
9. **fix [low/aeo-geo]** Consider an llms.txt file. No llms.txt file was found at the site root. This is an optional convention and is not confirmed to be read by any major engine or assistant. Note: llms.txt is optional and not yet confirmed to be read by the major search engines or assistants, so treat it as low priority. Optionally publish a plain-text llms.txt at the root summarising the site's key sections and canonical URLs. Treat it a…

Removed by the checker (2): "Add FAQ content with matching FAQPage markup" (the page has no visible question-and-answer conten); "Reduce JavaScript dependence for content and prici" (replaced by a measured finding on the same topic)
Added by the checker: JavaScript-dependent content

## Reviewer verdict

_to be completed by a human reviewer_

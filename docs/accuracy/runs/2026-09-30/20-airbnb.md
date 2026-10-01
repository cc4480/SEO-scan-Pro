# 20-airbnb — https://www.airbnb.com

*SPA marketplace.* Script-built page; JSON-LD.

Scan: 46s · scoreMethod **undefined** · scores {"overall":71,"technical":93,"content":30,"aeoGeo":95,"performance":65} · simulated: false · AI used: false

## Measurements vs independent ground truth

| Fact | Scanner | Ground truth | |
|---|---|---|---|
| title | "Airbnb | Vacation rentals, cabins, beach houses,  | "Airbnb | Vacation rentals, cabins, beach houses,  | ok |
| meta description present | true | true | ok |
| canonical | https://www.airbnb.com/ | https://www.airbnb.com/ | ok |
| viewport present | true | true | ok |
| html lang | en | en | ok |
| H1 count | 1 | 1 | ok |
| H2 count | 6 | 6 | ok |
| images (with src) | 51 | 43 <br><sub>DOM has 43 <img>, 43 with a source</sub> | **MISMATCH** |
| images missing/empty alt | 51 | 43 <br><sub>no alt attr 18, empty alt 25</sub> | ok |
| links (scanner total vs real+hash anchors) | 196 | 196+1 hash | ok |
| JSON-LD types | 2 | 2 | ok |
| visible words (rendered) | 1864 | 1529 <br><sub>innerText vs markup count differ for hidden text; tolerance 30%</sub> | ok |
| hreflang present | true | true | ok |
| raw words (no JS) | 107 | 23 <br><sub>ground truth = real load with JavaScript disabled</sub> | **MISMATCH** |
| raw links (no JS) | 10 | 10 | ok |
| rendered words (facts) | 1873 | 1529 | ok |
| robots.txt blocks all | false | false | ok |
| sitemap found | true | true <br><sub>sitemap.xml HTTP 404, robots directive yes</sub> | ok |
| llms.txt found | false | false <br><sub>llms.txt HTTP 404 (HTML, not a real llms.txt)</sub> | ok |
| header hsts | true | true | ok |
| header csp | true | true | ok |
| header xFrameOptions | true | true | ok |
| header xContentTypeOptions | true | true | ok |
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
| bot Claude-User | 200 | 200 | ok |
| bot Perplexity-User | 403 blocked | 403 blocked | ok |

## Findings (as shown to the user)

1. **critical** Found 51 images missing alt-text descriptions.
2. **critical** Detected slow page generation delay of 1050ms.
3. **fix [medium/content]** Repair Alt Attributes for Images. Missing alternative texts negatively affect and degrade visual accessibility and Google Image searches. Audit image templates and populate missing [alt] tag values with contextual keywords describing the asset.
4. **fix [medium/performance]** Optimize Core Asset Performance. Response times exceed 2026 search speed standards, creating immediate conversion drop-off. Leverage CDN edge hosting, compress images with dynamic next-gen formats (WebP/AVIF), and defer secondary client scripts.
5. **fix [low/technical]** Add missing security headers. The response is missing: Referrer-Policy. Browsers and search engines treat HTTPS and hardened headers as trust signals. Serve HTTPS with a redirect from HTTP, then add the listed headers at the CDN, reverse proxy or application layer.
6. **fix [medium/performance]** Improve lab Core Web Vitals. Lab-measured from the scanning host (not real-user data): LCP 3880ms, CLS 0.089. Good thresholds are LCP <= 2500ms and CLS <= 0.1. Preload the hero image/LCP resource, set explicit width/height on media, and avoid injecting content above existing content after load.

Removed by the checker (0): none
Added by the checker: none

## Reviewer verdict

_to be completed by a human reviewer_

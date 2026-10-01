# 07-stripe — https://stripe.com

*SaaS marketing, JS heavy.* Animated, script-driven marketing page.

Scan: 28.1s · scoreMethod **undefined** · scores {"overall":70,"technical":95,"content":30,"aeoGeo":95,"performance":61} · simulated: false · AI used: false

## Measurements vs independent ground truth

| Fact | Scanner | Ground truth | |
|---|---|---|---|
| title | "Stripe | Financial Infrastructure to Grow Your Re | "Stripe | Financial Infrastructure to Grow Your Re | ok |
| meta description present | true | true | ok |
| canonical | https://stripe.com/ | https://stripe.com/ | ok |
| viewport present | true | true | ok |
| html lang | en-US | en-US | ok |
| H1 count | 2 | 2 | ok |
| H2 count | 6 | 6 | ok |
| images (with src) | 42 | 40 <br><sub>DOM has 40 <img>, 40 with a source</sub> | ok |
| images missing/empty alt | 38 | 36 <br><sub>no alt attr 0, empty alt 36</sub> | ok |
| links (scanner total vs real+hash anchors) | 191 | 191+0 hash | ok |
| JSON-LD types | 7 | 7 | ok |
| visible words (rendered) | 2090 | 1736 <br><sub>innerText vs markup count differ for hidden text; tolerance 30%</sub> | ok |
| hreflang present | true | true | ok |
| raw words (no JS) | 1861 | 1617 <br><sub>ground truth = real load with JavaScript disabled</sub> | ok |
| raw links (no JS) | 191 | 191 | ok |
| rendered words (facts) | 2098 | 1736 | ok |
| robots.txt blocks all | false | false | ok |
| sitemap found | true | true <br><sub>sitemap.xml HTTP 404, robots directive yes</sub> | ok |
| llms.txt found | true | true <br><sub>llms.txt HTTP 200</sub> | ok |
| header hsts | true | true | ok |
| header csp | true | true | ok |
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
| bot Perplexity-User | 200 | 200 | ok |

## Findings (as shown to the user)

1. **critical** Found 38 images missing alt-text descriptions.
2. **critical** Detected slow page generation delay of 1163ms.
3. **fix [medium/content]** Repair Alt Attributes for Images. Missing alternative texts negatively affect and degrade visual accessibility and Google Image searches. Audit image templates and populate missing [alt] tag values with contextual keywords describing the asset.
4. **fix [medium/performance]** Optimize Core Asset Performance. Response times exceed 2026 search speed standards, creating immediate conversion drop-off. Leverage CDN edge hosting, compress images with dynamic next-gen formats (WebP/AVIF), and defer secondary client scripts.
5. **fix [medium/aeo-geo]** Strengthen Answer optimization structures (AEO). Structure of subheadings could benefit from natural language answers to target AI prompt queries. Introduce a target FAQ zone on the landing page matching user inquiry queries to trigger Google Featured Snippets.

Removed by the checker (0): none
Added by the checker: none

## Reviewer verdict

_to be completed by a human reviewer_

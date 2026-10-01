# 21-cloudflare — https://www.cloudflare.com

*CDN vendor marketing.* Vendor of the bot rules the tool tests for.

Scan: 33.5s · scoreMethod **measured** · scores {"overall":96,"technical":100,"content":100,"aeoGeo":100,"performance":80} · simulated: false · AI used: true

## Measurements vs independent ground truth

| Fact | Scanner | Ground truth | |
|---|---|---|---|
| title | "Cloudflare: Build for the agent era" | "Cloudflare: Build for the agent era" | ok |
| meta description present | true | true | ok |
| canonical | https://www.cloudflare.com/ | https://www.cloudflare.com/ | ok |
| viewport present | true | true | ok |
| html lang | en | en | ok |
| H1 count | 2 | 2 | ok |
| H2 count | 4 | 4 | ok |
| images (with src) | 69 | 4 <br><sub>DOM has 4 <img>, 4 with a source</sub> | **MISMATCH** |
| images missing/empty alt | 0 | 1 <br><sub>no alt attr 0, empty alt 1</sub> | ok |
| links (scanner total vs real+hash anchors) | 72 | 72+0 hash | ok |
| JSON-LD types | 4 | 4 | ok |
| visible words (rendered) | 1510 | 1528 <br><sub>innerText vs markup count differ for hidden text; tolerance 30%</sub> | ok |
| hreflang present | true | true | ok |
| raw words (no JS) | 1107 | 1111 <br><sub>ground truth = real load with JavaScript disabled</sub> | ok |
| raw links (no JS) | 72 | 72 | ok |
| rendered words (facts) | 1510 | 1528 | ok |
| robots.txt blocks all | false | false | ok |
| sitemap found | true | true <br><sub>sitemap.xml HTTP 200, robots directive yes</sub> | ok |
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

1. **fix [medium/content]** Add alt text to the hero image. The hero image (hero-poster.avif) has no alt attribute at all. All other sampled images either carry descriptive alt text or use empty alt text legitimately for decorative purposes. This is an accessibility and content-quality gap, not a ranking failure. Add a concise, descriptive alt attribute to hero-poster.avif that states what the image communicates (for example, the product or con…
2. **fix [high/performance]** Reduce page transfer weight and request count. The page transfers 7,421.6 KB across 188 requests, with a measured load time of 1,932 ms. TTFB is only 283 ms, so the remaining ~1,649 ms is front-end asset loading. This is a lab measurement from the auditing host and may not reflect real-user Core Web Vitals, but the asset weight and request count are objective and high. Audit the 188 requests for render-blocking scrip…
3. **fix [medium/content]** Add a visible pricing section or link to pricing. Prices are visible on the page ($0, $20, $25, $200, $250, $7, $5, $0.30, $0.02, $0.15, $12.50, $0.00) but there is no dedicated pricing section. This makes it harder for users and AI assistants to understand the pricing model in context. Add a clear pricing section or a prominent link to the pricing page that explains the tiers and what each price represents. Use the …
4. **fix [low/aeo-geo]** Add genuine customer reviews or ratings if available. No genuine reviews are visible on the page. The page does have customer stories and case studies, which is valuable, but review markup is not present and should not be added unless real reviews exist. If Cloudflare has genuine, verifiable customer reviews or ratings, add them visibly and mark them up with Review or AggregateRating schema. If not, do not add review…
5. **fix [low/aeo-geo]** Consider adding llms.txt guidance. The site already has an llms.txt file. llms.txt is optional and not confirmed to be read by any major engine or assistant, so this is a low-priority suggestion only. Note: llms.txt is optional and not yet confirmed to be read by the major search engines or assistants, so treat it as low priority. Review the existing llms.txt to ensure it accurately summarizes the site's key pages an…
   - ⚠ says llms.txt is missing but it exists

Removed by the checker (4): "Add a visible FAQ section with matching FAQPage ma" (the page has no visible question-and-answer conten); "Add a how-it-works or features section" (the page already has a section named like "concise); "Add an about and contact section or clear links" (the suggestion itself says there is nothing to fix); "Ensure the SearchAction target is a real search UR" (the sitelinks search box was retired by Google in )
Added by the checker: none

## Reviewer verdict

_to be completed by a human reviewer_

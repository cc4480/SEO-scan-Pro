# 11-shopify — https://www.shopify.com

*SaaS marketing, multilingual.* hreflang alternates, JSON-LD, many sections.

Scan: 25.1s · scoreMethod **measured** · scores {"overall":97,"technical":93,"content":100,"aeoGeo":100,"performance":95} · simulated: false · AI used: true

## Measurements vs independent ground truth

| Fact | Scanner | Ground truth | |
|---|---|---|---|
| title | "Shopify: The All-in-One Commerce Platform for Bus | "Shopify: The All-in-One Commerce Platform for Bus | ok |
| meta description present | true | true | ok |
| canonical | https://www.shopify.com/ | https://www.shopify.com/ | ok |
| viewport present | true | true | ok |
| html lang | en | en | ok |
| H1 count | 1 | 1 | ok |
| H2 count | 6 | 6 | ok |
| images (with src) | 59 | 79 <br><sub>DOM has 79 <img>, 79 with a source</sub> | **MISMATCH** |
| images missing/empty alt | 0 | 55 <br><sub>no alt attr 0, empty alt 55</sub> | **MISMATCH** |
| links (scanner total vs real+hash anchors) | 184 | 184+2 hash | ok |
| JSON-LD types | 2 | 2 | ok |
| visible words (rendered) | 767 | 803 <br><sub>innerText vs markup count differ for hidden text; tolerance 30%</sub> | ok |
| hreflang present | true | true | ok |
| raw words (no JS) | 739 | 721 <br><sub>ground truth = real load with JavaScript disabled</sub> | ok |
| raw links (no JS) | 184 | 184 | ok |
| rendered words (facts) | 767 | 803 | ok |
| robots.txt blocks all | false | false | ok |
| sitemap found | true | true <br><sub>sitemap.xml HTTP 200, robots directive yes</sub> | ok |
| llms.txt found | true | true <br><sub>llms.txt HTTP 200</sub> | ok |
| header hsts | true | true | ok |
| header csp | false | false | ok |
| header xFrameOptions | false | false | ok |
| header xContentTypeOptions | true | true | ok |
| header referrerPolicy | false | false | ok |
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

1. **fix [medium/technical]** Add a Content-Security-Policy and the missing hardening headers. The response sets HTTPS, HSTS and X-Content-Type-Options, but no Content-Security-Policy, no X-Frame-Options and no Referrer-Policy. These are browser-hardening headers, not ranking factors, but their absence is a real gap on an enterprise commerce domain that handles checkout traffic. Set a Content-Security-Policy (start in report-only mode if you need…
2. **fix [medium/aeo-geo]** Rewrite the opening copy to lead with an extractable answer. The first visible words are brand slogans ('Be the next AI all-star', 'store they line up for') rather than a plain statement of what Shopify is and who it is for. The meta description does this well, but the on-page opening does not, which weakens passage-level extraction by AI answer engines. Add one short, declarative sentence immediately below the H1 th…
3. **fix [medium/content]** Expose the pricing and feature detail that is currently only implied. The crawl found prices on the page ($125.00, $4, $5) but no dedicated pricing section, no features section and no how-it-works section in the visible structure. For a homepage whose job is to convert evaluators, the absence of an on-page pricing anchor and a structured feature explanation is a content gap. Add an on-page section that summarises the…
4. **fix [medium/performance]** Reduce page weight on the homepage. The HTML document is 665.5 KB and the total transfer for the page is 2,249.6 KB across 129 requests. The load time itself is good, but the transfer volume and request count are high for a landing page and will hurt users on constrained connections. Audit the 129 requests for render-blocking scripts and oversized images, defer or lazy-load below-the-fold assets, and serve modern ima…
5. **fix [low/technical]** Confirm the hreflang set is complete and reciprocal. The page declares 71 hreflang entries, which is a strong signal for a multi-region site. The crawl sample shows the first 20; the full set should be verified for self-reference, x-default correctness and return links from each regional page. Run a full hreflang validation across the regional URLs: every page must reference itself, every pair must be reciprocal, and…
6. **fix [low/aeo-geo]** Publish an llms.txt file as a low-cost courtesy. An llms.txt file was found at the site root. It is optional and no major engine is confirmed to read it, so treat this as housekeeping rather than a visibility lever. Note: llms.txt is optional and not yet confirmed to be read by the major search engines or assistants, so treat it as low priority. Keep the file current with the site's key URLs and a one-line descriptio…
   - ⚠ says llms.txt is missing but it exists

Removed by the checker (3): "Give the one unlabelled image a meaningful alt att" (59 images are said to have no alt attribute, but o); "Deepen the structured data beyond Corporation and " (the Corporation/ContactPoint markup already has sa); "Add a visible FAQ block with matching FAQPage mark" (the page has no visible question-and-answer conten)
Added by the checker: none

## Reviewer verdict

_to be completed by a human reviewer_

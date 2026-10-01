# 10-mdn — https://developer.mozilla.org/en-US/

*documentation hub.* Locale paths, hreflang, structured content.

Scan: 19s · scoreMethod **measured** · scores {"overall":93,"technical":100,"content":100,"aeoGeo":72,"performance":100} · simulated: false · AI used: true

## Measurements vs independent ground truth

| Fact | Scanner | Ground truth | |
|---|---|---|---|
| title | "MDN Web Docs" | "MDN Web Docs" | ok |
| meta description present | true | true | ok |
| canonical | https://developer.mozilla.org/en-US/ | https://developer.mozilla.org/en-US/ | ok |
| viewport present | true | true | ok |
| html lang | en-US | en-US | ok |
| H1 count | 1 | 1 | ok |
| H2 count | 4 | 4 | ok |
| images (with src) | 1 | 1 <br><sub>DOM has 1 <img>, 1 with a source</sub> | ok |
| images missing/empty alt | 0 | 0 <br><sub>no alt attr 0, empty alt 0</sub> | ok |
| links (scanner total vs real+hash anchors) | 158 | 158+2 hash | ok |
| JSON-LD types | 0 | 0 | ok |
| visible words (rendered) | 844 | 844 <br><sub>innerText vs markup count differ for hidden text; tolerance 30%</sub> | ok |
| hreflang present | false | false | ok |
| raw words (no JS) | 844 | 844 <br><sub>ground truth = real load with JavaScript disabled</sub> | ok |
| raw links (no JS) | 158 | 158 | ok |
| rendered words (facts) | 844 | 844 | ok |
| robots.txt blocks all | false | false | ok |
| sitemap found | true | true <br><sub>sitemap.xml HTTP 200, robots directive yes</sub> | ok |
| llms.txt found | false | false <br><sub>llms.txt HTTP 404 (HTML, not a real llms.txt)</sub> | ok |
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

1. **fix [high/aeo-geo]** Add JSON-LD structured data (Organization and WebSite). The crawl found no JSON-LD structured data on the page (hasJsonLd false, structuredData.types empty). MDN is a well-known entity, but without explicit Organization and WebSite markup, search engines and AI answer engines must infer entity relationships from unstructured text, which weakens knowledge-graph grounding and citation confidence. Add a JSON-LD script b…
2. **fix [medium/aeo-geo]** Add a direct-answer summary near the top of the page. The first ~120 words of visible text begin with a blog teaser ('Blog Celebrating 20 years of MDN…') rather than a clear definition of what MDN Web Docs is. AI answer engines and featured-snippet systems preferentially extract concise, self-contained definitions placed near the top of the main content. Insert a one-to-two sentence plain-language definition immediat…
   - ⚠ quotes 120 words; measured values are 844 rendered / 844 no-JS
   - ⚠ quotes 50 words; measured values are 844 rendered / 844 no-JS
3. **fix [low/aeo-geo]** Publish an llms.txt file. The crawl did not find an llms.txt file at the site root. This file is an optional, emerging convention that can help AI systems understand site structure and preferred content. It is not confirmed to be read by any major engine or assistant, so treat this as a low-priority, low-risk addition. Note: llms.txt is optional and not yet confirmed to be read by the major search engines or assistan…
4. **fix [medium/content]** Expand visible content depth on the homepage. The homepage contains 844 words of visible text. While appropriate for a hub page, this is thin for competitive snippet and AI-citation purposes. The page currently surfaces featured articles and news but does not include a concise explanation of MDN's scope, audience, or key resources in the main content area. Add a short 'About MDN' or 'What you'll find here' section (1…
   - ⚠ quotes 250 words; measured values are 844 rendered / 844 no-JS
5. **fix [low/content]** Improve social sharing metadata. The page has Open Graph title, description and image, and a Twitter card set to 'summary'. The 'summary' card type produces a small thumbnail on Twitter/X, which is suboptimal for a documentation hub with a strong visual identity. Change the Twitter card type to 'summary_large_image' to use the full-width image. Ensure the og:image is at least 1200×630 px and that og:type is set to 'w…

Removed by the checker (2): "Declare language versions with hreflang" (no alternate-language versions were found, so href); "Add a visible FAQ section with FAQPage markup" (the page has no visible question-and-answer conten)
Added by the checker: none

## Reviewer verdict

_to be completed by a human reviewer_

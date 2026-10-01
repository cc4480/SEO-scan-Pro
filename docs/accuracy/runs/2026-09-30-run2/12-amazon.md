# 12-amazon — https://www.amazon.com

*e-commerce, bot defences.* Aggressive bot challenges; tests the unreachable/simulated path.

Scan: 26s · scoreMethod **measured** · scores {"overall":79,"technical":88,"content":80,"aeoGeo":72,"performance":73} · simulated: false · AI used: true

## Measurements vs independent ground truth

| Fact | Scanner | Ground truth | |
|---|---|---|---|
| title | "Amazon.com. Spend less. Smile more." | "Amazon.com. Spend less. Smile more." | ok |
| meta description present | true | true | ok |
| canonical | https://www.amazon.com/ | https://www.amazon.com/ | ok |
| viewport present | false | false | ok |
| html lang | en-us | en-us | ok |
| H1 count | 0 | 0 | ok |
| H2 count | 25 | 26 | ok |
| images (with src) | 229 | 124 <br><sub>DOM has 124 <img>, 124 with a source</sub> | **MISMATCH** |
| images missing/empty alt | 0 | 2 <br><sub>no alt attr 0, empty alt 2</sub> | ok |
| links (scanner total vs real+hash anchors) | 292 | 298+15 hash | ok |
| JSON-LD types | 0 | 0 | ok |
| visible words (rendered) | 671 | 2035 <br><sub>innerText vs markup count differ for hidden text; tolerance 30%</sub> | **MISMATCH** |
| hreflang present | false | false | ok |
| raw words (no JS) | 643 | 634 <br><sub>ground truth = real load with JavaScript disabled</sub> | ok |
| raw links (no JS) | 121 | 120 | ok |
| rendered words (facts) | 671 | 2035 | **MISMATCH** |
| robots.txt blocks all | false | false | ok |
| sitemap found | false | false <br><sub>sitemap.xml HTTP 0, robots directive no</sub> | ok |
| llms.txt found | false | false <br><sub>llms.txt HTTP 404 (HTML, not a real llms.txt)</sub> | ok |
| header hsts | true | true | ok |
| header csp | false | true | **MISMATCH** |
| header xFrameOptions | true | true | ok |
| header xContentTypeOptions | false | true | **MISMATCH** |
| header referrerPolicy | false | false | ok |
| bot GPTBot | 202 | 202 | ok |
| bot ClaudeBot | 202 | 202 | ok |
| bot CCBot | 200 | 200 | ok |
| bot Bytespider | 202 | 202 | ok |
| bot OAI-SearchBot | 202 | 202 | ok |
| bot Claude-SearchBot | 202 | 202 | ok |
| bot PerplexityBot | 202 | 202 | ok |
| bot Googlebot | 202 | 202 | ok |
| bot Bingbot | 202 | 202 | ok |
| bot Applebot | 202 | 202 | ok |
| bot ChatGPT-User | 202 | 202 | ok |
| bot Claude-User | 202 | 202 | ok |
| bot Perplexity-User | 202 | 202 | ok |

## Findings (as shown to the user)

1. **fix [high/aeo-geo]** Add JSON-LD structured data to the homepage. The homepage contains no JSON-LD structured data (structured data (JSON-LD) is false, types is empty). This means search engines and AI assistants have no machine-readable declaration of Amazon as an Organization, no WebSite entity, and no site-level relationships. For a property of this scale, the absence of any structured data is a significant missed opportunity for enti…
2. **fix [high/content]** Add a single descriptive H1 to the homepage. The homepage has zero H1 elements. The heading structure jumps directly to H2s (25 of them). While multiple H1s are not a modern ranking problem, the complete absence of an H1 removes a primary topical signal for both traditional search and AI answer engines trying to understand the page's main subject. Add exactly one H1 near the top of the main content area that accurate…
3. **fix [medium/technical]** Add Open Graph type and Twitter card metadata. The page has ogTitle, ogDescription, and ogImage, but ogType is empty and twitterCard is empty. This weakens social sharing previews and removes a signal that AI systems sometimes use to understand page type and content. Add <meta property="og:type" content="website"> and <meta name="twitter:card" content="summary_large_image"> to the homepage <head>. Ensure og:image is …
4. **fix [low/technical]** Add a Content-Security-Policy header. The security headers show csp: false and cspReportOnly: false. While not an SEO ranking factor, a missing CSP is a security hardening gap that can affect trust signals and is best practice for enterprise sites. Implement a Content-Security-Policy header, starting in report-only mode to avoid breakage, then enforce it. Coordinate with the security team to define allowed sources fo…
   - ⚠ says CSP is missing but the response has it
5. **fix [low/technical]** Add X-Content-Type-Options and Referrer-Policy headers. The security headers show xContentTypeOptions: false and referrerPolicy: false. These are low-effort hardening headers that improve security posture and can marginally affect trust. Add 'X-Content-Type-Options: nosniff' and a Referrer-Policy header (e.g. 'strict-origin-when-cross-origin') to all responses.
6. **fix [medium/aeo-geo]** Improve direct-answer content near the top of the page. The opening text of the page is dominated by navigation and category links ('Skip to Main content', 'Keyboard shortcuts', 'Search', 'Cart', etc.) rather than a clear, direct statement of what Amazon offers. AI answer engines and voice assistants benefit from a concise, factual summary near the top of the main content. Add a short, visible introductory paragraph …
7. **fix [low/aeo-geo]** Add llms.txt for AI crawler guidance (optional). No llms.txt file was found. This file is an emerging, optional convention to provide guidance to large language models about site content and permissions. It is not confirmed to be read by any major engine or assistant, so it should be treated as a low-priority, experimental addition. Note: llms.txt is optional and not yet confirmed to be read by the major search engin…

Removed by the checker (3): "Add alt attributes to images missing them" (229 images are said to have no alt attribute, but ); "Declare hreflang for multi-region audiences" (no alternate-language versions were found, so href); "Ensure critical content and links are present in r" (the no-JavaScript response was a bot wall or unrel)
Added by the checker: none

## Reviewer verdict

_to be completed by a human reviewer_

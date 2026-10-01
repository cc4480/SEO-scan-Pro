# 21-cloudflare — https://www.cloudflare.com

*CDN vendor marketing.* Vendor of the bot rules the tool tests for.

Scan: 32.1s · scoreMethod **measured** · scores {"overall":95,"technical":100,"content":100,"aeoGeo":89,"performance":90} · simulated: false · AI used: true

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
| images (with src) | 68 | 71 <br><sub>DOM has 71 <img>, 71 with a source</sub> | ok |
| images missing/empty alt | 1 | 4 <br><sub>no alt attr 2, empty alt 2</sub> | ok |
| links (scanner total vs real+hash anchors) | 72 | 72+0 hash | ok |
| JSON-LD types | 4 | 4 | ok |
| visible words (rendered) | 1506 | 1510 <br><sub>innerText vs markup count differ for hidden text; tolerance 30%</sub> | ok |
| hreflang present | true | true | ok |
| raw words (no JS) | 1119 | 1111 <br><sub>ground truth = real load with JavaScript disabled</sub> | ok |
| raw links (no JS) | 72 | 72 | ok |
| rendered words (facts) | 1512 | 1510 | ok |
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
| bot Googlebot | 0 blocked | 200 <br><sub>bot rules can vary run to run; re-check</sub> | **MISMATCH** |
| bot Bingbot | 200 | 200 | ok |
| bot Applebot | 200 | 200 | ok |
| bot ChatGPT-User | 200 | 200 | ok |
| bot Claude-User | 200 | 200 | ok |
| bot Perplexity-User | 200 | 200 | ok |

## Findings (as shown to the user)

1. **critical** Search or assistant crawlers are refused by the site: Googlebot.
   - ⚠ says Googlebot is blocked but it got HTTP 200
2. **critical** Googlebot returned HTTP 0 (blocked:true) in the direct crawler test while robotsTxtAllows is true — the only crawler of thirteen to fail. Because all other crawlers succeeded from the same auditing host, this is most likely a request-level block (WAF/bot-management challenge, UA filtering, or timeout) rather than a robots.txt disallow, but it is the single highest-risk finding in this audit and must be confirmed from…
   - ⚠ says Googlebot is blocked but it got HTTP 200
3. **critical** The homepage exposes two H1 elements ("Everything we learned from powering 20% of the Internet—yours by default" and "Build without boundaries"). This is not a modern ranking penalty, but it dilutes the page's primary topical signal for both classic ranking and AI answer extraction.
4. **critical** 68 images are present and 1 is missing alt text. This is an accessibility and image-understanding gap rather than a critical ranking failure, but it is trivially fixable and affects how AI systems interpret visual content.
5. **critical** The page has no FAQ, how-it-works, features or reviews sections (visibleSections: pricing:true, faq:false, howItWorks:false, features:false, about:true, contact:true, reviews:false) and no FAQPage, HowTo, Product or SoftwareApplication structured data. For a homepage that is the primary entry point for AI answer engines, this leaves direct-answer and entity-attribute coverage on the table.
6. **fix [high/aeo-geo]** Let search and assistant crawlers through your CDN or firewall. These crawlers were refused when requesting the home page with their published user agents: Googlebot (HTTP no response). Pages they cannot fetch cannot be indexed or cited by the engines and assistants behind them. robots.txt allows them, so the site is saying "welcome" and then refusing. In your CDN, WAF or bot-protection settings, allow these crawlers…
   - ⚠ says Googlebot is blocked but it got HTTP 200
7. **fix [medium/content]** Consolidate to a single H1 and tighten the heading hierarchy. The homepage renders two H1s: "Everything we learned from powering 20% of the Internet—yours by default" and "Build without boundaries". Multiple H1s are not a ranking penalty in modern search, but a single, keyword-bearing H1 gives both classic crawlers and AI answer extractors one unambiguous statement of what the page is about. Choose the H1 that best r…
8. **fix [low/content]** Fix the single missing image alt attribute. Of 68 images on the page, 1 is missing alt text. Decorative images legitimately carry empty alt="", so first confirm whether the image is decorative; if it is content-bearing, it needs a descriptive alt. 1) Identify the image by running an automated audit (Lighthouse or axe) and locating the element with no alt attribute. 2) If the image conveys information, add a concise, …
9. **fix [high/aeo-geo]** Add FAQ content and FAQPage structured data to the homepage. visibleSections shows faq:false and structuredData.types contains no FAQPage. For an AI-answer-engine entry point, a short FAQ block with matching FAQPage JSON-LD is the highest-leverage AEO addition: it gives ChatGPT Search, Perplexity, Gemini and Google AI Overviews pre-formed question/answer pairs to quote. Note that FAQ rich results no longer appear in …
10. **fix [medium/aeo-geo]** Add Product/SoftwareApplication entity markup for the platform. structuredData.types covers Organization, WebSite, SearchAction and WebPage, but there is no Product or SoftwareApplication entity describing what Cloudflare actually sells. AI systems building an entity graph benefit from explicit product typing, and structuredDataEntities shows no offers or aggregateRating on any existing entity. 1) Add a SoftwareAppli…
11. **fix [low/aeo-geo]** Add HowTo or feature-explanation markup where a matching visible section exists. visibleSections shows howItWorks:false and features:false, and structuredData.types contains no HowTo. If the team adds a visible 'how it works' or feature-comparison block, matching HowTo or structured data would help machines parse the steps. HowTo rich results are deprecated in Google, so treat this as machine-readability only. 1) Onl…
12. **fix [low/performance]** Keep the strong lab performance profile and verify against field data. Lab measurements from the auditing host show TTFB 293 ms, total load 1,644 ms, LCP 624 ms and CLS 0. TTFB accounts for roughly 18% of load time, so the remainder is client-side asset work rather than a network-bound artifact. These are lab numbers, not the site's real-user Core Web Vitals assessment. 1) Treat 624 ms LCP and CLS 0 as healthy lab si…
13. **fix [low/technical]** Maintain the existing technical and security baseline. The crawl confirms HTTPS, HSTS, CSP, X-Frame-Options, X-Content-Type-Options and Referrer-Policy all enabled, a single-hop redirect chain, zero broken links across the 19-link sample, valid canonical (https://www.cloudflare.com/), a viewport meta tag, lang="en", and hreflang coverage for 10 locales plus x-default. 1) Keep the security headers in place and re-audi…
   - ⚠ says hreflang is missing but the page has 10

Removed by the checker (2): "Diagnose and resolve the Googlebot HTTP 0 result" (replaced by a measured finding on the same topic); "Preserve and extend the AI crawler access posture" (replaced by a measured finding on the same topic)
Added by the checker: search/assistant crawlers blocked

## Reviewer verdict

_to be completed by a human reviewer_

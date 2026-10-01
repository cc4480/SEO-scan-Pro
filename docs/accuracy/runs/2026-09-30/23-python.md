# 23-python — https://www.python.org

*traditional site.* Classic server-rendered site with few scripts.

Scan: 17.4s · scoreMethod **measured** · scores {"overall":87,"technical":80,"content":100,"aeoGeo":76,"performance":93} · simulated: false · AI used: true

## Measurements vs independent ground truth

| Fact | Scanner | Ground truth | |
|---|---|---|---|
| title | "Welcome to Python.org" | "Welcome to Python.org" | ok |
| meta description present | true | true | ok |
| canonical | - | - | ok |
| viewport present | true | true | ok |
| html lang | en | en | ok |
| H1 count | 5 | 5 | ok |
| H2 count | 9 | 9 | ok |
| images (with src) | 1 | 1 <br><sub>DOM has 1 <img>, 1 with a source</sub> | ok |
| images missing/empty alt | 0 | 0 <br><sub>no alt attr 0, empty alt 0</sub> | ok |
| links (scanner total vs real+hash anchors) | 208 | 219+11 hash | ok |
| JSON-LD types | 2 | 2 | ok |
| visible words (rendered) | 1007 | 548 <br><sub>innerText vs markup count differ for hidden text; tolerance 30%</sub> | **MISMATCH** |
| hreflang present | false | false | ok |
| raw words (no JS) | 164 | 559 <br><sub>ground truth = real load with JavaScript disabled</sub> | **MISMATCH** |
| raw links (no JS) | 0 | 204 | **MISMATCH** |
| rendered words (facts) | 1010 | 548 | **MISMATCH** |
| robots.txt blocks all | false | false | ok |
| sitemap found | false | false <br><sub>sitemap.xml HTTP 404, robots directive no</sub> | ok |
| llms.txt found | false | false <br><sub>llms.txt HTTP 404 (HTML, not a real llms.txt)</sub> | ok |
| header hsts | true | true | ok |
| header csp | false | false | ok |
| header xFrameOptions | true | true | ok |
| header xContentTypeOptions | false | false | ok |
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

1. **critical** Raw HTML contains only 164 words and zero links or schema; all content and structured data are injected via JavaScript. Many AI retrieval crawlers (e.g., GPTBot, ClaudeBot, PerplexityBot) do not execute JavaScript, so they may see an empty page.
2. **critical** No sitemap.xml found (sitemapFound: false), which hinders efficient discovery and indexing by search engines and AI crawlers.
3. **critical** No llms.txt file found (llmsTxtFound: false), missing an emerging standard for guiding AI models on content usage and structure.
4. **critical** One broken external link: https://www.linkedin.com/company/python-software-foundation/ returns status 999 (likely a LinkedIn block or timeout).
5. **fix [medium/aeo-geo]** Put the main content in the HTML the server sends. A plain request with no JavaScript returns 164 words and 0 links; after a real browser runs the page it is 1010 words and 211 links. It is commonly reported that many AI retrieval crawlers do not execute JavaScript (this scan did not test each crawler), so they may see only the smaller version. Server-render or pre-render the headline, main sections, FAQ and navigati…
6. **fix [medium/technical]** Serve structured data in the initial HTML. These schema types appear only after JavaScript runs: WebSite, SearchAction. Crawlers that do not run scripts will not see them. Emit the JSON-LD blocks in the server-delivered HTML (in the document head or body) rather than injecting them from client-side code.
7. **fix [high/technical]** Create and Submit an XML Sitemap. No sitemap.xml was found (sitemapFound: false). A sitemap helps search engines and AI crawlers discover and index all important pages efficiently. Generate an XML sitemap that includes all important URLs on python.org (at minimum the homepage and key sections like /downloads/, /doc/, /community/). Place it at https://www.python.org/sitemap.xml. Reference it in robots.txt with a 'Site…
8. **fix [medium/technical]** Fix Broken External Link. A broken external link was detected: https://www.linkedin.com/company/python-software-foundation/ returns status 999. This may be due to LinkedIn blocking automated requests or the page being unavailable. Verify the LinkedIn URL manually in a browser. If it is valid, the 999 status is likely a bot-block; consider adding a rel='nofollow' or leaving as is. If the page is truly broken, update o…
9. **fix [low/technical]** Add Missing Security Headers. The following security headers are missing: Content-Security-Policy (CSP), X-Content-Type-Options, and Referrer-Policy. While not direct ranking factors, they improve security and trust. Configure the web server to send: Content-Security-Policy (start with a report-only policy to avoid breakage), X-Content-Type-Options: nosniff, and Referrer-Policy: strict-origin-when-cross-origin. Test …
10. **fix [medium/performance]** Improve Cumulative Layout Shift (CLS). Lab measurement shows CLS of 0.147, which is above the 'good' threshold of 0.1. This indicates some layout instability during page load. Identify elements causing layout shifts (e.g., images without dimensions, ads, embeds). Add width and height attributes to images, reserve space for dynamic content, and use CSS aspect-ratio. Re-measure with Lighthouse or WebPageTest.
11. **fix [medium/aeo-geo]** Enhance Structured Data for Rich Results. The page has WebSite and SearchAction schema, but lacks other types that could improve rich snippet eligibility, such as Organization, SoftwareApplication, or FAQPage. The page has a visible FAQ section, so FAQPage markup is appropriate. Add JSON-LD for Organization (name, url, logo, sameAs) and FAQPage (using the existing FAQ content). For SoftwareApplication, use the correc…
12. **fix [low/content]** Add Twitter Card Metadata. The social metadata shows an empty twitterCard field. Adding a Twitter card improves sharing on X/Twitter. Add a meta tag: <meta name='twitter:card' content='summary_large_image'> and optionally twitter:title, twitter:description, twitter:image. Use the existing Open Graph image.

Removed by the checker (2): "Add an llms.txt File" (the page already has a about section); "Server-Side Render Critical Content and Schema" (replaced by a measured finding on the same topic)
Added by the checker: JavaScript-dependent content; schema only after JavaScript

## Reviewer verdict

_to be completed by a human reviewer_

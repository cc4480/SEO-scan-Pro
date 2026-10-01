# 12-amazon — https://www.amazon.com

*e-commerce, bot defences.* Aggressive bot challenges; tests the unreachable/simulated path.

Scan: 31s · scoreMethod **measured** · scores {"overall":73,"technical":78,"content":79,"aeoGeo":52,"performance":85} · simulated: false · AI used: true

## Measurements vs independent ground truth

| Fact | Scanner | Ground truth | |
|---|---|---|---|
| title | "Amazon.com. Spend less. Smile more." | "Amazon.com. Spend less. Smile more." | ok |
| meta description present | true | true | ok |
| canonical | https://www.amazon.com/ | https://www.amazon.com/ | ok |
| viewport present | false | false | ok |
| html lang | en-us | en-us | ok |
| H1 count | 0 | 0 | ok |
| H2 count | 12 | 22 | **MISMATCH** |
| images (with src) | 75 | 106 <br><sub>DOM has 106 <img>, 106 with a source</sub> | **MISMATCH** |
| images missing/empty alt | 5 | 2 <br><sub>no alt attr 0, empty alt 2</sub> | ok |
| links (scanner total vs real+hash anchors) | 258 | 273+19 hash | ok |
| JSON-LD types | 0 | 0 | ok |
| visible words (rendered) | 1849 | 1778 <br><sub>innerText vs markup count differ for hidden text; tolerance 30%</sub> | ok |
| hreflang present | false | false | ok |
| raw words (no JS) | 0 | 635 <br><sub>ground truth = real load with JavaScript disabled</sub> | **MISMATCH** |
| raw links (no JS) | 0 | 120 | **MISMATCH** |
| rendered words (facts) | 1854 | 1778 | ok |
| robots.txt blocks all | false | true | **MISMATCH** |
| sitemap found | false | false <br><sub>sitemap.xml HTTP 500, robots directive no</sub> | ok |
| llms.txt found | false | false <br><sub>llms.txt HTTP 404 (HTML, not a real llms.txt)</sub> | ok |
| header hsts | true | true | ok |
| header csp | true | true | ok |
| header xFrameOptions | true | true | ok |
| header xContentTypeOptions | true | true | ok |
| header referrerPolicy | false | false | ok |
| bot GPTBot | 200 | 202 | ok |
| bot ClaudeBot | 200 | 202 | ok |
| bot CCBot | 200 | 200 | ok |
| bot Bytespider | 200 | 202 | ok |
| bot OAI-SearchBot | 200 | 202 | ok |
| bot Claude-SearchBot | 200 | 202 | ok |
| bot PerplexityBot | 200 | 202 | ok |
| bot Googlebot | 200 | 202 | ok |
| bot Bingbot | 200 | 202 | ok |
| bot Applebot | 200 | 202 | ok |
| bot ChatGPT-User | 200 | 202 | ok |
| bot Claude-User | 200 | 202 | ok |
| bot Perplexity-User | 200 | 202 | ok |

## Findings (as shown to the user)

1. **critical** Without JavaScript the page contains only 0 words (1854 once scripts run).
2. **critical** No JSON-LD structured data on the homepage (structuredData.hasJsonLd = false, types = []), preventing rich result eligibility and reducing machine readability for AI search engines.
3. **critical** Raw HTML contains zero words and zero links (rawHtmlVsRendered.rawWords = 0, rawLinks = 0), meaning all content and navigation are JavaScript-dependent. Many AI retrieval crawlers do not execute JavaScript, so they may see an empty page.
4. **critical** No H1 heading on the homepage (headings.h1 = []), weakening topical clarity for search engines and AI summarizers.
5. **critical** Three broken internal links detected in a sample of 17: two 404s (registration and sign-in URLs) and one 503 (yourstore URL). These harm user experience and crawl efficiency.
6. **critical** No llms.txt file found (llmsTxtFound = false), missing an emerging standard for guiding AI crawlers to preferred content.
7. **critical** robots.txt does not explicitly allow major AI crawlers (GPTBot, ClaudeBot, CCBot, Bytespider, OAI-SearchBot, Claude-SearchBot, PerplexityBot, ChatGPT-User, Claude-User, Perplexity-User). Only Googlebot, Bingbot, and Applebot are explicitly allowed, which may restrict AI training and retrieval.
8. **fix [high/aeo-geo]** Put the main content in the HTML the server sends. A plain request with no JavaScript returns 0 words and 0 links; after a real browser runs the page it is 1854 words and 269 links. It is commonly reported that many AI retrieval crawlers do not execute JavaScript (this scan did not test each crawler), so they may see only the smaller version. Server-render or pre-render the headline, main sections, FAQ and navigation…
9. **fix [high/content]** Add an H1 Heading to the Homepage. The homepage has no H1 element (headings.h1 = []). An H1 provides a clear topical signal to search engines and AI summarizers about the page's primary subject. Add a single H1 element to the homepage that concisely describes the page's purpose, e.g., 'Amazon.com: Online Shopping for Electronics, Apparel, Computers, Books, DVDs & more'. Ensure it is visible and server-rendered. Avoid…
10. **fix [high/technical]** Fix Broken Internal Links. Three broken internal links were found in a sample of 17 checked: two 404s (registration and sign-in URLs) and one 503 (yourstore URL). These create dead ends for users and waste crawl budget. Update or redirect the broken links. For the 404 registration and sign-in URLs, verify the correct paths and update the href attributes. For the 503 yourstore URL, investigate the server error and res…
11. **fix [medium/aeo-geo]** Create and Publish an llms.txt File. No llms.txt file was found (llmsTxtFound = false). This emerging standard helps AI crawlers understand which content is available for training and retrieval, and provides preferred URLs. Create an llms.txt file at the root (https://www.amazon.com/llms.txt) following the proposed specification. Include a brief description of the site, links to key pages (e.g., about, help, product …
12. **fix [medium/aeo-geo]** Explicitly Allow AI Crawlers in robots.txt. robots.txt does not explicitly allow GPTBot, ClaudeBot, CCBot, Bytespider, OAI-SearchBot, Claude-SearchBot, PerplexityBot, ChatGPT-User, Claude-User, or Perplexity-User. Only Googlebot, Bingbot, and Applebot are explicitly allowed. While the crawlers received HTTP 200, the lack of explicit allowance may be interpreted as a policy signal. Review robots.txt and add explicit U…
13. **fix [medium/content]** Add Alt Text to Images Missing It. 5 images out of 75 are missing alt text (missingAltCount = 5). Alt text improves accessibility and provides context to search engines and AI systems. Audit all images on the homepage and add descriptive alt text to the 5 missing ones. For decorative images, use empty alt attributes (alt=""). Ensure alt text is concise and relevant to the image content.
14. **fix [medium/content]** Add Open Graph and Twitter Card Metadata. The page has an ogImage but no ogTitle, ogDescription, ogType, or twitterCard (social.ogTitle = '', ogType = '', twitterCard = ''). This reduces the quality of social sharing previews and may affect AI summarization. Add complete Open Graph tags: og:title, og:description, og:type (e.g., 'website'), and og:url. Add Twitter Card tags: twitter:card (e.g., 'summary_large_image'),…
15. **fix [low/technical]** Add a Referrer-Policy Header. The Referrer-Policy header is missing (securityHeaders.referrerPolicy = false). While not critical for SEO, it is a security best practice. Add a Referrer-Policy header, e.g., 'strict-origin-when-cross-origin', to control how much referrer information is sent with requests. This can be set at the server or CDN level.
16. **fix [low/aeo-geo]** Consider Adding FAQ or How-To Content for AEO. The homepage lacks FAQ and how-it-works sections (visibleSections.faq = false, howItWorks = false). These can help answer user questions directly and improve visibility in AI-generated answers. Add a concise FAQ section to the homepage addressing common user queries (e.g., shipping, returns, Prime benefits). Use natural language questions and answers. Mark up with FAQPag…

Removed by the checker (2): "Implement JSON-LD Structured Data for Homepage" (replaced by a measured finding on the same topic); "Server-Side Render Critical Content and Navigation" (replaced by a measured finding on the same topic)
Added by the checker: JavaScript-dependent content

## Reviewer verdict

_to be completed by a human reviewer_

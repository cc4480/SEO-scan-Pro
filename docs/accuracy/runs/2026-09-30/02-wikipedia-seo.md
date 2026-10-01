# 02-wikipedia-seo — https://en.wikipedia.org/wiki/Search_engine_optimization

*long article.* Hundreds of links, many images, server-rendered, citations.

Scan: 27.4s · scoreMethod **measured** · scores {"overall":75,"technical":90,"content":81,"aeoGeo":64,"performance":60} · simulated: false · AI used: true

## Measurements vs independent ground truth

| Fact | Scanner | Ground truth | |
|---|---|---|---|
| title | "Search engine optimization - Wikipedia" | "Search engine optimization - Wikipedia" | ok |
| meta description present | false | false | ok |
| canonical | https://en.wikipedia.org/wiki/Search_engine_optimization | https://en.wikipedia.org/wiki/Search_engine_optimization | ok |
| viewport present | true | true | ok |
| html lang | en | en | ok |
| H1 count | 1 | 1 | ok |
| H2 count | 10 | 10 | ok |
| images (with src) | 15 | 15 <br><sub>DOM has 15 <img>, 15 with a source</sub> | ok |
| images missing/empty alt | 7 | 7 <br><sub>no alt attr 2, empty alt 5</sub> | ok |
| links (scanner total vs real+hash anchors) | 553 | 555+176 hash | ok |
| JSON-LD types | 3 | 3 | ok |
| visible words (rendered) | 5837 | 5188 <br><sub>innerText vs markup count differ for hidden text; tolerance 30%</sub> | ok |
| hreflang present | false | false | ok |
| raw words (no JS) | 5815 | 5270 <br><sub>ground truth = real load with JavaScript disabled</sub> | ok |
| raw links (no JS) | 552 | 552 | ok |
| rendered words (facts) | 5842 | 5188 | ok |
| robots.txt blocks all | false | false | ok |
| sitemap found | false | true <br><sub>sitemap.xml HTTP 404, robots directive yes</sub> | **MISMATCH** |
| llms.txt found | false | false <br><sub>llms.txt HTTP 404 (HTML, not a real llms.txt)</sub> | ok |
| header hsts | true | true | ok |
| header csp | true | true | ok |
| header xFrameOptions | false | false | ok |
| header xContentTypeOptions | true | true | ok |
| header referrerPolicy | false | false | ok |
| bot GPTBot | 200 | 200 | ok |
| bot ClaudeBot | 403 blocked | 403 blocked | ok |
| bot CCBot | 200 | 200 | ok |
| bot Bytespider | 200 | 200 | ok |
| bot OAI-SearchBot | 200 | 200 | ok |
| bot Claude-SearchBot | 200 | 200 | ok |
| bot PerplexityBot | 200 | 200 | ok |
| bot Googlebot | 403 blocked | 403 blocked | ok |
| bot Bingbot | 403 blocked | 403 blocked | ok |
| bot Applebot | 403 blocked | 403 blocked | ok |
| bot ChatGPT-User | 200 | 200 | ok |
| bot Claude-User | 200 | 200 | ok |
| bot Perplexity-User | 200 | 200 | ok |

## Findings (as shown to the user)

1. **critical** Search or assistant crawlers are refused by the site: Googlebot, Bingbot, Applebot.
2. **critical** Googlebot, Bingbot and Applebot each returned HTTP 403 on direct request, blocking the three largest traditional search crawlers from retrieving the page as tested.
3. **critical** Time to first byte measured 2,387 ms against a 3,777 ms total load, meaning roughly 63% of load time is server/network latency from the auditing host; this is a network-bound measurement and must be re-tested from a representative location before any front-end optimisation is attempted.
4. **critical** Meta description is empty and og:image is empty, so search snippets and social/AI link previews are generated from page content rather than controlled by the publisher.
5. **fix [high/aeo-geo]** Let search and assistant crawlers through your CDN or firewall. These crawlers were refused when requesting the home page with their published user agents: Googlebot (HTTP 403), Bingbot (HTTP 403), Applebot (HTTP 403). Pages they cannot fetch cannot be indexed or cited by the engines and assistants behind them. robots.txt allows them, so the site is saying "welcome" and then refusing. In your CDN, WAF or bot-protecti…
6. **fix [medium/aeo-geo]** Decide, and state, whether AI-training crawlers are welcome. ClaudeBot (HTTP 403) were refused even though robots.txt does not disallow them. Search and assistant crawlers (OAI-SearchBot, Claude-SearchBot, PerplexityBot, ChatGPT-User, Claude-User, Perplexity-User) were let through, so answer-engine citation is not affected by this. Whether to block AI-training crawlers is the site owner's choice; the problem is only …
   - ⚠ says OAI-SearchBot is blocked but it got HTTP 200
   - ⚠ says Claude-SearchBot is blocked but it got HTTP 200
   - ⚠ says PerplexityBot is blocked but it got HTTP 200
   - ⚠ says ChatGPT-User is blocked but it got HTTP 200
   - ⚠ says Claude-User is blocked but it got HTTP 200
   - ⚠ says Perplexity-User is blocked but it got HTTP 200
7. **fix [high/performance]** Re-measure TTFB from a representative location before optimising. TTFB of 2,387 ms accounts for about 63% of the 3,777 ms total load time. Because the auditing host may sit far from the target's real users, this is a network-bound measurement and is not evidence of a front-end performance defect on the page itself. Re-run the measurement from at least two locations close to the primary audience (for example a US-East…
8. **fix [medium/content]** Write a meta description and an Open Graph image. The meta description field is empty and social.ogImage is empty, so both search snippets and social/AI link previews are uncontrolled. The page already has a strong title ('Search engine optimization - Wikipedia') and 5,837 words of content to draw from. Add a 140–160 character meta description that summarises the article and includes the primary phrase 'search engine…
9. **fix [medium/content]** Add alt text to the seven images that lack it. Seven of the 15 images on the page have no alt attribute. This is an accessibility and content-completeness gap rather than a critical ranking failure, and some of the 15 images may be decorative and legitimately carry empty alt text. Audit each of the 15 images individually. For informative images, write concise descriptive alt text that names the subject; for genuinely…
10. **fix [medium/technical]** Fix the viewport declaration for mobile rendering. The viewport meta tag is set to width=1120 rather than the standard device-width, which forces a fixed-width layout on mobile devices and can trigger horizontal scrolling or scaled-down text. Change the viewport meta tag to width=device-width, initial-scale=1. Then verify the page renders without horizontal overflow at 360 px and 390 px widths. If the layout depends …
11. **fix [low/technical]** Add x-frame-options and referrer-policy response headers. The security header check shows xFrameOptions and referrerPolicy as false. HSTS, CSP and x-content-type-options are already present, so this is a hardening gap rather than an active vulnerability. Add an x-frame-options header (SAMEORIGIN or DENY) or an equivalent frame-ancestors directive in the existing CSP. Add a referrer-policy header, for example strict-o…
12. **fix [medium/aeo-geo]** Add a direct-answer summary block for generative engines. The page is a long reference article with no concise definition block near the top. Generative answer engines such as ChatGPT Search, Perplexity and Gemini extract short, self-contained passages, and a 5,837-word article without a lead summary is harder to quote accurately. Add a 40–60 word definition paragraph immediately after the H1 that answers 'What is se…
13. **fix [low/aeo-geo]** Add FAQPage markup for the questions the article already answers. The page carries Article, Organization and ImageObject JSON-LD but no FAQPage markup. FAQ rich results no longer appear in Google Search, but FAQPage markup remains valid and helps machines parse question-and-answer content. Identify three to five questions the article already answers in its body (for example around white hat versus black hat technique…
14. **fix [low/aeo-geo]** Add a BreadcrumbList to the JSON-LD graph. The existing JSON-LD graph contains Article, Organization and ImageObject entities but no BreadcrumbList, which helps search engines and AI systems understand where this article sits in the site hierarchy. Add a BreadcrumbList entity to the existing JSON-LD graph reflecting the real navigation path to this article. Use the actual section names from the site's navigation; do …

Removed by the checker (3): "Restore access for Googlebot, Bingbot and Applebot" (replaced by a measured finding on the same topic); "Make the AI training-crawler policy explicit and c" (replaced by a measured finding on the same topic); "ClaudeBot (training role) returned HTTP 403 while " (blocking AI-training crawlers is a policy decision)
Added by the checker: search/assistant crawlers blocked; AI-training crawler block

## Reviewer verdict

_to be completed by a human reviewer_

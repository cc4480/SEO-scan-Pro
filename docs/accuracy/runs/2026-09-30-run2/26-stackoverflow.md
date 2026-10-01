# 26-stackoverflow — https://stackoverflow.com

*Q&A, bot defences.* Challenges unknown clients; many links.

Scan: 24.1s · scoreMethod **measured** · scores {"overall":90,"technical":92,"content":90,"aeoGeo":92,"performance":85} · simulated: false · AI used: true

## Measurements vs independent ground truth

| Fact | Scanner | Ground truth | |
|---|---|---|---|
| title | "Newest Questions - Stack Overflow" | "Newest Questions - Stack Overflow" | ok |
| meta description present | false | false | ok |
| canonical | - | - | ok |
| viewport present | true | true | ok |
| html lang | en | en | ok |
| H1 count | 7 | 7 | ok |
| H2 count | 2 | 2 | ok |
| images (with src) | 19 | 18 <br><sub>DOM has 18 <img>, 18 with a source</sub> | ok |
| images missing/empty alt | 0 | 2 <br><sub>no alt attr 0, empty alt 2</sub> | ok |
| links (scanner total vs real+hash anchors) | 232 | 232+5 hash | ok |
| JSON-LD types | 3 | 3 | ok |
| visible words (rendered) | 1582 | 1539 <br><sub>innerText vs markup count differ for hidden text; tolerance 30%</sub> | ok |
| hreflang present | false | false | ok |
| raw words (no JS) | 1506 | 6 <br><sub>ground truth = real load with JavaScript disabled</sub> | **MISMATCH** |
| raw links (no JS) | 228 | 0 | **MISMATCH** |
| rendered words (facts) | 1582 | 1539 | ok |
| robots.txt blocks all | false | false | ok |
| sitemap found | false | false <br><sub>sitemap.xml HTTP 403, robots directive no</sub> | ok |
| llms.txt found | false | false <br><sub>llms.txt HTTP 403 (HTML, not a real llms.txt)</sub> | ok |
| header hsts | true | false | **MISMATCH** |
| header csp | true | true | ok |
| header xFrameOptions | true | true | ok |
| header xContentTypeOptions | false | true | **MISMATCH** |
| header referrerPolicy | false | true | **MISMATCH** |
| bot GPTBot | 403 | 429 | ok |
| bot ClaudeBot | 403 | 403 | ok |
| bot CCBot | 403 | 403 | ok |
| bot Bytespider | 403 | 403 | ok |
| bot OAI-SearchBot | 403 | 429 | ok |
| bot Claude-SearchBot | 402 | 402 | ok |
| bot PerplexityBot | 403 | 403 | ok |
| bot Googlebot | 403 | 403 | ok |
| bot Bingbot | 403 | 403 | ok |
| bot Applebot | 403 | 403 | ok |
| bot ChatGPT-User | 403 | 429 | ok |
| bot Claude-User | 402 | 402 | ok |
| bot Perplexity-User | 403 | 403 | ok |

## Findings (as shown to the user)

1. **fix [high/content]** Add a meta description to the homepage. The homepage has no meta description. Search engines and AI answer engines often use this text as the snippet or summary, and its absence forces them to guess from page content, which is currently a sign-up prompt. Add a concise, unique meta description (150–160 characters) to the homepage template. Example: 'Stack Overflow is the largest online community for programmers to lea…
2. **fix [high/technical]** Add a canonical tag to the homepage. The homepage has no canonical URL declared. Without it, duplicate or parameterised versions of the homepage (e.g. /questions?sort=newest) may compete in search results and dilute ranking signals. Add a self-referencing canonical tag to the homepage: <link rel="canonical" href="https://stackoverflow.com/" />. Apply the same pattern to all key listing pages, pointing to the clean, p…
3. **fix [high/technical]** Investigate and resolve the blanket 403/402 refusal for non-browser clients. Direct tests show that every non-browser client — including Googlebot, Bingbot, Applebot, GPTBot, ClaudeBot, PerplexityBot and assistant crawlers — received a 403 or 402 response. Because IP-verified crawlers like Googlebot refuse imitations, this may be a false positive from the test environment, but it could also indicate a real WAF or bot…
   - ⚠ says GPTBot is blocked but it got HTTP 429
   - ⚠ says ClaudeBot is blocked but it got HTTP 403
   - ⚠ says PerplexityBot is blocked but it got HTTP 403
   - ⚠ says Googlebot is blocked but it got HTTP 403
   - ⚠ says Bingbot is blocked but it got HTTP 403
   - ⚠ says Applebot is blocked but it got HTTP 403
4. **fix [high/aeo-geo]** Improve the opening text to be answer-first for AEO. The first ~120 words of the homepage are a sign-up prompt ('Join Stack Overflow… Sign up with Google…'), not a direct answer or definition of what the site is. AI answer engines and voice assistants rely on the opening text to extract a concise summary. This reduces the chance of being cited in AI-generated answers. Rewrite the top of the homepage (above the fold) …
   - ⚠ quotes 120 words; measured values are 1539 rendered / 6 no-JS
5. **fix [medium/aeo-geo]** Expand structured data to cover Q&A content. The homepage currently has WebSite, Organization and ContactPoint structured data. For a Q&A platform, adding QAPage or Question markup to individual question pages would help search engines and AI systems understand the content and could improve eligibility for rich results in traditional search. On question pages, add QAPage structured data with the question title, accep…
6. **fix [medium/technical]** Ensure robots.txt is readable and correctly configured. The crawl could not read robots.txt (robotsTxtReadable: false). While this may be due to the same bot-protection issue, a readable robots.txt is important for controlling crawler access and for search engines to understand site rules. Verify that https://stackoverflow.com/robots.txt returns HTTP 200 and is accessible to all user agents. If it is blocked by a WAF…
7. **fix [low/technical]** Add X-Content-Type-Options and Referrer-Policy security headers. The site is missing X-Content-Type-Options and Referrer-Policy headers. While not a direct ranking factor, these headers improve security and privacy, which can indirectly support trust signals. Add 'X-Content-Type-Options: nosniff' and 'Referrer-Policy: strict-origin-when-cross-origin' (or a suitable policy) to the server configuration for all pages.
8. **fix [low/aeo-geo]** Consider adding llms.txt for AI crawler guidance. The site does not have an llms.txt file. This is an optional, emerging standard that can provide guidance to large language models about the site's content. It is not confirmed to be read by any major engine, so treat it as a low-priority experiment. Note: llms.txt is optional and not yet confirmed to be read by the major search engines or assistants, so treat it as l…
9. **fix [medium/aeo-geo]** Every tested non-browser client — including Googlebot, Bingbot, Applebot, GPTBot, Claud.... Every tested non-browser client — including Googlebot, Bingbot, Applebot, GPTBot, ClaudeBot, PerplexityBot and the assistant crawlers — was refused with HTTP 403 or 402. Because the refusal also hits IP-verified search crawlers, it cannot be confirmed as a deliberate block; server logs, Google Search Console or Bing Webmaster …
   - ⚠ says GPTBot is blocked but it got HTTP 429
   - ⚠ says ClaudeBot is blocked but it got HTTP 403
   - ⚠ says PerplexityBot is blocked but it got HTTP 403
   - ⚠ says Googlebot is blocked but it got HTTP 403
   - ⚠ says Bingbot is blocked but it got HTTP 403
   - ⚠ says Applebot is blocked but it got HTTP 403

Removed by the checker (1): "Add a sitemap and reference it in robots.txt" (the sitemap request was refused or failed, so whet)
Added by the checker: none

## Reviewer verdict

_to be completed by a human reviewer_

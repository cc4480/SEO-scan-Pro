# 17-linkedin — https://www.linkedin.com

*login wall.* Aggressive redirect and bot handling.

Scan: 23.7s · scoreMethod **measured** · scores {"overall":91,"technical":92,"content":100,"aeoGeo":72,"performance":100} · simulated: false · AI used: true

## Measurements vs independent ground truth

| Fact | Scanner | Ground truth | |
|---|---|---|---|
| title | "LinkedIn: Log In or Sign Up" | "LinkedIn: Log In or Sign Up" | ok |
| meta description present | true | true | ok |
| canonical | https://www.linkedin.com/ | https://www.linkedin.com/ | ok |
| viewport present | true | true | ok |
| html lang | en | en | ok |
| H1 count | 1 | 1 | ok |
| H2 count | 12 | 12 | ok |
| images (with src) | 1 | 2 <br><sub>DOM has 8 <img>, 2 with a source</sub> | ok |
| images missing/empty alt | 0 | 6 <br><sub>no alt attr 1, empty alt 5</sub> | **MISMATCH** |
| links (scanner total vs real+hash anchors) | 160 | 158+1 hash | ok |
| JSON-LD types | 0 | 0 | ok |
| visible words (rendered) | 441 | 418 <br><sub>innerText vs markup count differ for hidden text; tolerance 30%</sub> | ok |
| hreflang present | true | true | ok |
| raw words (no JS) | 418 | 726 <br><sub>ground truth = real load with JavaScript disabled</sub> | **MISMATCH** |
| raw links (no JS) | 160 | 158 | ok |
| rendered words (facts) | 441 | 418 | ok |
| robots.txt blocks all | false | true | **MISMATCH** |
| sitemap found | false | false <br><sub>sitemap.xml HTTP 404, robots directive no</sub> | ok |
| llms.txt found | false | false <br><sub>llms.txt HTTP 404 (HTML, not a real llms.txt)</sub> | ok |
| header hsts | true | true | ok |
| header csp | true | true | ok |
| header xFrameOptions | true | true | ok |
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

1. **fix [low/technical]** Publish an XML sitemap. No sitemap was found at the usual locations or in robots.txt. A sitemap helps crawlers discover every page, especially new or deeply linked ones; this scan deducted a few technical points for it. Generate a sitemap.xml listing your canonical URLs, publish it, and add a "Sitemap: https://your-domain/sitemap.xml" line to robots.txt.
2. **fix [high/content]** Set an Open Graph image for social and messaging previews. The Open Graph image field is empty. When the homepage URL is shared on social platforms, messaging apps, or in AI-generated link previews, no image is rendered, which reduces click-through and brand recognition. Add an og:image meta tag pointing to a 1200x630px branded image hosted on a stable, crawlable URL. Also add og:image:width and og:image:height. Keep…
3. **fix [medium/technical]** Reconsider the 'noarchive' robots directive. The page's meta robots value is 'noarchive', which instructs search engines not to store a cached copy. This removes the 'Cached' link from search results and prevents search engines from serving a stored snapshot when the live page is slow or unavailable. If there is no legal or product reason to suppress caching, change the meta robots content from 'noarchive' to 'index,…
4. **fix [medium/aeo-geo]** Add a direct, plain-language value proposition near the top of the page. The opening visible text is dominated by sign-in prompts ('Continue with Google', 'Sign in with email', 'Join now') and topic chips. There is no direct answer, definition, or summary of what LinkedIn is and who it is for within the first ~120 words. AI answer engines and voice assistants extract concise, self-contained statements; a login wall w…
   - ⚠ quotes 120 words; measured values are 418 rendered / 726 no-JS
5. **fix [medium/content]** Add a meta description that reads as a direct answer. The current meta description ('1 billion members | Manage your professional identity...') is serviceable but opens with a statistic rather than a definition. AI answer engines and search snippets favor descriptions that answer 'what is this' in the first clause. Rewrite the meta description to lead with a definitional clause, e.g. 'LinkedIn is a professional netwo…
6. **fix [low/technical]** Add a Referrer-Policy security header. The site sets HSTS, CSP, X-Frame-Options, and X-Content-Type-Options, but no Referrer-Policy header was observed. This is a hardening gap, not a ranking factor. Add a Referrer-Policy header with a value such as 'strict-origin-when-cross-origin' at the CDN or origin server level. Verify with a header-check tool after deployment.
7. **fix [medium/technical]** Declare a canonical strategy for the 77 hreflang alternates. The page declares 77 hreflang entries pointing to regional subdomains (de.linkedin.com, ie.linkedin.com, etc.), but the crawl did not confirm reciprocal hreflang tags on those regional pages. Non-reciprocal hreflang is a common cause of incorrect regional targeting. Audit the regional homepages to confirm each one declares the full reciprocal hreflang set b…
   - ⚠ says hreflang is missing but the page has 77
8. **fix [low/aeo-geo]** Add a low-priority llms.txt file. No llms.txt file was found. This is an emerging, optional convention; no major search engine or AI assistant has confirmed it is read. It is a low-cost signal, not a ranking lever. Note: llms.txt is optional and not yet confirmed to be read by the major search engines or assistants, so treat it as low priority. Optionally publish a plain-text /llms.txt at the domain root that lists t…

Removed by the checker (2): "Add JSON-LD structured data (Organization and WebS" (a homepage has no breadcrumb trail to mark up); "Improve the ratio of crawlable links to navigation" (the navigation has real links (19 anchors; 160 lin)
Added by the checker: no sitemap found

## Reviewer verdict

_to be completed by a human reviewer_

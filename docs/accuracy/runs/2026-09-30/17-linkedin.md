# 17-linkedin — https://www.linkedin.com

*login wall.* Aggressive redirect and bot handling.

Scan: 26s · scoreMethod **measured** · scores {"overall":71,"technical":46,"content":90,"aeoGeo":66,"performance":90} · simulated: false · AI used: true

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
| images (with src) | 2 | 2 <br><sub>DOM has 8 <img>, 2 with a source</sub> | ok |
| images missing/empty alt | 1 | 6 <br><sub>no alt attr 1, empty alt 5</sub> | **MISMATCH** |
| links (scanner total vs real+hash anchors) | 160 | 158+1 hash | ok |
| JSON-LD types | 0 | 0 | ok |
| visible words (rendered) | 753 | 418 <br><sub>innerText vs markup count differ for hidden text; tolerance 30%</sub> | **MISMATCH** |
| hreflang present | true | true | ok |
| raw words (no JS) | 729 | 418 <br><sub>ground truth = real load with JavaScript disabled</sub> | **MISMATCH** |
| raw links (no JS) | 158 | 158 | ok |
| rendered words (facts) | 759 | 418 | **MISMATCH** |
| robots.txt blocks all | true | true | ok |
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

1. **critical** robotsBlocksAll is true: robots.txt disallows every crawler from the entire site. This is a deliberate policy stance by LinkedIn, but it is the dominant constraint on organic search and AI-answer visibility and should be confirmed as intentional.
2. **critical** No JSON-LD structured data is present on the homepage (structuredData.hasJsonLd: false, structuredData.types: []), so search engines and AI systems receive no machine-readable entity graph for the page.
3. **critical** Two internal links in the 15-link sample returned HTTP 999 (https://www.linkedin.com/pub/dir/+/+?trk=guest_homepage-basic_guest_nav_menu_people and https://www.linkedin.com/jobs/search?trk=guest_homepage-basic_guest_nav_menu_jobs). HTTP 999 is LinkedIn's non-standard anti-bot response, not a standard 404; treat as a crawler-access artifact rather than a broken page.
4. **critical** One of the two images on the page is missing alt text (imagesCount: 2, missingAltCount: 1), an accessibility and content-clarity gap.
5. **critical** referrerPolicy is false in securityHeaders — the Referrer-Policy response header is not set.
6. **fix [medium/technical]** Use real links for navigation. Header, navigation and footer contain 37 buttons but only 19 real <a href> links. Crawlers follow links; they do not click buttons, so those destinations are invisible to them. Render navigation and footer entries as <a href="…"> elements (a styled button can still be an anchor).
7. **fix [high/technical]** Confirm and document the robots.txt site-wide disallow. robotsBlocksAll is true, meaning robots.txt disallows all crawlers from the whole site. This is almost certainly an intentional policy choice for LinkedIn, but it means no search engine or AI crawler can index the logged-out pages regardless of any other optimisation. Treat this as a business decision, not a bug. If the intent is to keep the logged-out site out …
8. **fix [high/aeo-geo]** Add JSON-LD structured data to the homepage. structuredData.hasJsonLd is false and structuredData.types is empty. The page therefore exposes no machine-readable entity information to Google, Bing, Gemini, ChatGPT Search or Perplexity. Emit a single <script type="application/ld+json"> block in the <head> containing an Organization entity (name, url, logo, sameAs links to LinkedIn's official profiles) and a WebSite ent…
9. **fix [medium/technical]** Investigate the two HTTP 999 internal links. Two internal links in the 15-link sample returned status 999: /pub/dir/+/+ and /jobs/search. HTTP 999 is LinkedIn's proprietary anti-bot status code, returned when a request looks automated. These are not standard 404s and should not be reported to stakeholders as broken pages. Confirm with a real browser session that both URLs resolve for human users. If they do, no chang…
10. **fix [medium/content]** Add alt text to the image missing it. imagesCount is 2 and missingAltCount is 1. One image on the homepage has no alt attribute, which harms screen-reader users and removes a small amount of semantic signal for image understanding systems. Identify the image without an alt attribute and add a concise, descriptive alt value. If the image is purely decorative, set alt="" explicitly so assistive technology skips it. Do …
11. **fix [low/technical]** Set a Referrer-Policy response header. securityHeaders.referrerPolicy is false. The other major security headers (HSTS, CSP, X-Frame-Options, X-Content-Type-Options) are present, so this is a single gap in an otherwise strong header set. Add a Referrer-Policy header at the edge/CDN or origin. strict-origin-when-cross-origin is a safe default that preserves analytics while limiting leakage of full URLs to third partie…
12. **fix [low/aeo-geo]** Publish an llms.txt file if AI retrieval is ever opened up. llmsTxtFound is false. This is only relevant if LinkedIn decides to allow AI retrieval crawlers; while robotsBlocksAll is true, an llms.txt would have no effect. If and only if the robots.txt policy changes to allow AI retrieval crawlers, publish /llms.txt at the domain root listing the canonical public pages, a one-line description of each, and a contact fo…
13. **fix [medium/aeo-geo]** Review AI crawler policy deliberately. The measured crawlerAccess test shows training crawlers (GPTBot, ClaudeBot, CCBot, Bytespider) and assistant crawlers (ChatGPT-User, Claude-User, Perplexity-User) are not allowed by robots.txt, while search crawlers (OAI-SearchBot, Claude-SearchBot, Googlebot, Bingbot, Applebot) are allowed. PerplexityBot is not allowed. This is a coherent policy split, but it should be a consci…
14. **fix [low/technical]** Keep the hreflang set maintained. The page declares a large, well-formed hreflang set (50 entries) covering regional subdomains. This is a strength, not a problem, but it is easy to let drift. Add an automated check that every hreflang entry returns 200 and that each regional page reciprocates the annotation back to https://www.linkedin.com/. Flag any entry that starts returning a redirect or an error.

Removed by the checker (0): none
Added by the checker: navigation built from buttons

## Reviewer verdict

_to be completed by a human reviewer_

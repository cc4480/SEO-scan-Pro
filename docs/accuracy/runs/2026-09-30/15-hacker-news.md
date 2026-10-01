# 15-hacker-news — https://news.ycombinator.com

*minimal HTML.* Table layout, no images, no meta description, no JSON-LD.

Scan: 24.6s · scoreMethod **measured** · scores {"overall":76,"technical":90,"content":50,"aeoGeo":66,"performance":100} · simulated: false · AI used: true

## Measurements vs independent ground truth

| Fact | Scanner | Ground truth | |
|---|---|---|---|
| title | "Hacker News" | "Hacker News" | ok |
| meta description present | false | false | ok |
| canonical | - | - | ok |
| viewport present | true | true | ok |
| html lang | en | en | ok |
| H1 count | 0 | 0 | ok |
| H2 count | 0 | 0 | ok |
| images (with src) | 3 | 3 <br><sub>DOM has 3 <img>, 3 with a source</sub> | ok |
| images missing/empty alt | 3 | 3 <br><sub>no alt attr 3, empty alt 0</sub> | ok |
| links (scanner total vs real+hash anchors) | 225 | 225+1 hash | ok |
| JSON-LD types | 0 | 0 | ok |
| visible words (rendered) | 681 | 681 <br><sub>innerText vs markup count differ for hidden text; tolerance 30%</sub> | ok |
| hreflang present | false | false | ok |
| raw words (no JS) | 683 | 681 <br><sub>ground truth = real load with JavaScript disabled</sub> | ok |
| raw links (no JS) | 226 | 225 | ok |
| rendered words (facts) | 683 | 681 | ok |
| robots.txt blocks all | false | false | ok |
| sitemap found | false | false <br><sub>sitemap.xml HTTP 419, robots directive no</sub> | ok |
| llms.txt found | false | false <br><sub>llms.txt HTTP 404 (HTML, not a real llms.txt)</sub> | ok |
| header hsts | true | true | ok |
| header csp | true | true | ok |
| header xFrameOptions | true | true | ok |
| header xContentTypeOptions | true | true | ok |
| header referrerPolicy | true | true | ok |
| bot GPTBot | 419 | 419 | ok |
| bot ClaudeBot | 419 | 419 | ok |
| bot CCBot | 200 | 200 | ok |
| bot Bytespider | 200 | 200 | ok |
| bot OAI-SearchBot | 419 | 419 | ok |
| bot Claude-SearchBot | 419 | 419 | ok |
| bot PerplexityBot | 200 | 200 | ok |
| bot Googlebot | 419 | 419 | ok |
| bot Bingbot | 419 | 419 | ok |
| bot Applebot | 419 | 419 | ok |
| bot ChatGPT-User | 419 | 419 | ok |
| bot Claude-User | 200 | 200 | ok |
| bot Perplexity-User | 200 | 200 | ok |

## Findings (as shown to the user)

1. **critical** HTTP 419 responses were returned to Googlebot, Bingbot, Applebot, GPTBot, ClaudeBot, OAI-SearchBot, Claude-SearchBot and ChatGPT-User on direct request, despite robots.txt allowing them (robotsTxtAllows true). A 419 is a non-2xx status, so these crawlers cannot retrieve or index the page.
2. **critical** No structured data of any kind is present: structuredData.hasJsonLd is false and structuredData.types is empty, so the page offers no machine-readable entity, site or list signals.
3. **critical** The page has no H1, H2 or H3 elements (headings.h1, h2 and h3 are all empty arrays), leaving the document with no explicit topical hierarchy for search or AI extraction.
4. **critical** The meta description is empty and no canonical URL is declared (meta.description "", meta.canonical ""), weakening snippet control and duplicate-URL consolidation.
5. **critical** All 3 images on the page are missing alt text (imagesCount 3, missingAltCount 3), an accessibility and content-comprehension gap.
6. **critical** No Open Graph or Twitter Card metadata is present (ogTitle, ogDescription, ogImage, ogType and twitterCard are all empty), so shares and AI link previews render without context.
7. **fix [high/technical]** Resolve HTTP 419 responses for major search and AI crawlers. Direct requests from the auditing host returned HTTP 419 for Googlebot, Bingbot, Applebot, GPTBot, ClaudeBot, OAI-SearchBot, Claude-SearchBot and ChatGPT-User, while CCBot, Bytespider, PerplexityBot, Claude-User and Perplexity-User received 200. robots.txt allows all of these agents, so the rejection is happening at the application or edge layer, not in rob…
8. **fix [high/aeo-geo]** Add WebSite, Organization and ItemList JSON-LD. structuredData.hasJsonLd is false and structuredData.types is empty, so the front page exposes no machine-readable identity or content list. For an aggregator whose value is the ranked link list, an ItemList is the most accurate representation of the page. Inject a single JSON-LD block in the document head containing: (1) WebSite with name, url, potentialAction SearchAc…
9. **fix [high/content]** Establish a single descriptive H1 and a heading hierarchy. headings.h1, headings.h2 and headings.h3 are all empty. With 681 words and 225 links on the page, the absence of any heading leaves both search engines and AI extractors without an explicit statement of what the page is or how its sections relate. Add one H1 that names the page and its purpose (for example the site name plus a short descriptor). Add H2s for t…
10. **fix [medium/technical]** Write a meta description and declare a canonical URL. meta.description is empty and meta.canonical is empty. The title is present ("Hacker News") but there is no snippet-control copy and no canonical declaration to consolidate URL variants. Add a unique meta description of roughly 140-160 characters that states what the page is and what a visitor finds there. Add a self-referencing canonical link to https://news.ycom…
11. **fix [medium/content]** Add Open Graph and Twitter Card metadata. ogTitle, ogDescription, ogImage, ogType and twitterCard are all empty. When the URL is shared or surfaced by an AI assistant, it renders without a title, description or image. Add og:title, og:description, og:type (website), og:url and og:image (a real, crawlable image at least 1200x630), plus twitter:card set to summary_large_image with matching title, description and image.…
12. **fix [medium/content]** Add alt text to the three images. imagesCount is 3 and missingAltCount is 3, so every image on the page lacks an alt attribute. This is an accessibility and content-comprehension gap; it is not, by itself, a ranking failure. For each of the three images, add an alt attribute. If an image is purely decorative, set alt="" explicitly. If it conveys information, write a short functional description. Do not keyword-stuff …
13. **fix [medium/technical]** Expose the story list as crawlable anchors. The page reports 225 links but only 1 internal link and 224 external links. The measured rawHtmlVsRendered data shows 226 anchors in both raw and rendered HTML, so the link markup is server-rendered and not JavaScript-dependent. The imbalance indicates the front page is almost entirely outbound, which limits internal crawl paths and topical consolidation. Confirm that every…
14. **fix [low/aeo-geo]** Add an llms.txt file. llmsTxtFound is false. This is a low-priority omission for a link aggregator, but an llms.txt gives AI systems an explicit, curated map of what the site offers and which URLs matter. Publish /llms.txt at the site root with a short plain-text summary of the site, its purpose, and a curated list of key URLs (front page, submission page, guidelines, API documentation if public). Keep it factual and…
15. **fix [low/technical]** Keep the current security header posture. securityHeaders shows https, hsts, csp, xFrameOptions, xContentTypeOptions and referrerPolicy all true. This is a strength, not a defect, and should be preserved while making the crawler-access changes above. When adjusting WAF or edge rules to fix the 419 responses, scope the change narrowly to public GET requests for HTML and crawler user agents. Do not weaken CSP, HSTS, X-…
   - ⚠ says HSTS is missing but the response has it
   - ⚠ says CSP is missing but the response has it

Removed by the checker (0): none
Added by the checker: none

## Reviewer verdict

_to be completed by a human reviewer_

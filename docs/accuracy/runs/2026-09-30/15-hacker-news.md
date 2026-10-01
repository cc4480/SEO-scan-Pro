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

Reviewer R2. Counts: ACCURATE 10, INACCURATE 1, MISLEADING 2, UNSUPPORTED 0, SUBJECTIVE 2.
Summary: most facts are right for a deliberately minimal site. Two real problems: (a) the 419 responses are a
real HN behaviour for requests that claim to be Googlebot, Bingbot, Applebot, GPTBot, ClaudeBot, OAI-SearchBot,
Claude-SearchBot and ChatGPT-User from a non-crawler IP (verified: those UAs get 419 "Sorry", a normal Chrome UA or
curl gets 200); this is a spoofed-UA refusal (A-02), not proof that the real crawlers are shut out, yet the report
says they "cannot retrieve or index the page" and the scanner's own log says "all 13 crawlers received the page";
(b) the internal/external link split is wrong (1 internal / 224 external; real 192 internal): relative hrefs such
as `item?id=...` and `user?id=...` (no leading slash) were classified external.

Measurement mismatches explained: words 681/683 vs 681: none (HN front page changes between fetches, 681 vs 663
on a later run). Raw links 226 vs 225: live content change between runs. The sheet shows 225 total links in both,
the internal split is only visible in the findings (scanner internal 1 vs ground internalAnchors 192).

1. MISLEADING: 419 is real for those UA strings (curl-verified) but it is a spoofed-UA refusal; real crawlers use verified IPs and Google does index the site. The scanner itself did not count 419 as blocked (REFUSAL set is 401/403/406/429) so the report and the scan log disagree (A-02).
2. ACCURATE: no JSON-LD (ground 0). Critical is inflated for HN (A-13).
3. ACCURATE: no H1/H2/H3 (ground 0/0/0). Critical is inflated.
4. ACCURATE: no meta description, no canonical (ground empty).
5. ACCURATE: 3 `<img>` without an alt attribute (logo svg and two 1px `s.gif` spacers); true but trivial, "critical" is inflated.
6. ACCURATE: no Open Graph or Twitter tags (ground empty). Inflated severity.
7. MISLEADING: same as 1; the advice to alter WAF rules so spoofed Googlebot/GPTBot UAs pass is poor, and "high" is not justified.
8. SUBJECTIVE: absence of JSON-LD is true; ItemList/WebSite SearchAction on a news aggregator is optional and SearchAction no longer feeds a Google feature; "high" is unreasonable.
9. ACCURATE: facts correct (681 words, 225 links, no headings); advice is generic and "high" is generous.
10. ACCURATE: both empty; the suggested canonical host is right.
11. ACCURATE: facts correct; low value for HN.
12. ACCURATE: 3 images, none with alt attribute; the text correctly notes it is not a ranking failure.
13. INACCURATE: "only 1 internal and 224 external" is wrong: ~192 anchors are same-site (`item?id=`, `user?id=`, `hide?id=`, `from?site=` ...) and only ~33 are external story links. Scanner classified slash-less relative hrefs as external; the conclusion "almost entirely outbound" is false.
14. SUBJECTIVE: llms.txt absent (true), hedged low priority is reasonable.
15. ACCURATE: HSTS, CSP, X-Frame-Options, nosniff and Referrer-Policy all present (live GET). The two ⚠ flags are noise (sentence says they are present).

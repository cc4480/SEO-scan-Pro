# 02-wikipedia-seo — https://en.wikipedia.org/wiki/Search_engine_optimization

*long article.* Hundreds of links, many images, server-rendered, citations.

Scan: 24.8s · scoreMethod **measured** · scores {"overall":78,"technical":96,"content":87,"aeoGeo":88,"performance":27} · simulated: false · AI used: true

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
| images (with src) | 16 | 16 <br><sub>DOM has 16 <img>, 16 with a source</sub> | ok |
| images missing/empty alt | 2 | 7 <br><sub>no alt attr 2, empty alt 5</sub> | **MISMATCH** |
| links (scanner total vs real+hash anchors) | 556 | 556+176 hash | ok |
| JSON-LD types | 3 | 3 | ok |
| visible words (rendered) | 5209 | 5188 <br><sub>innerText vs markup count differ for hidden text; tolerance 30%</sub> | ok |
| hreflang present | false | false | ok |
| raw words (no JS) | 5270 | 5270 <br><sub>ground truth = real load with JavaScript disabled</sub> | ok |
| raw links (no JS) | 552 | 552 | ok |
| rendered words (facts) | 5209 | 5188 | ok |
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
| bot Googlebot | 403 | 403 blocked <br><sub>bot rules can vary run to run; re-check</sub> | **MISMATCH** |
| bot Bingbot | 403 | 403 blocked <br><sub>bot rules can vary run to run; re-check</sub> | **MISMATCH** |
| bot Applebot | 403 | 403 blocked <br><sub>bot rules can vary run to run; re-check</sub> | **MISMATCH** |
| bot ChatGPT-User | 200 | 200 | ok |
| bot Claude-User | 200 | 200 | ok |
| bot Perplexity-User | 200 | 200 | ok |

## Findings (as shown to the user)

1. **fix [low/aeo-geo]** Decide, and state, whether AI-training crawlers are welcome. ClaudeBot (HTTP 403) was refused even though robots.txt does not disallow it. Search and assistant crawlers (OAI-SearchBot, Claude-SearchBot, PerplexityBot, Googlebot, Bingbot, Applebot) were let through, so answer-engine citation is not affected by this. Whether to block AI-training crawlers is the site owner's choice; the problem is only a mismatch betwee…
   - ⚠ says OAI-SearchBot is blocked but it got HTTP 200
   - ⚠ says Claude-SearchBot is blocked but it got HTTP 200
   - ⚠ says PerplexityBot is blocked but it got HTTP 200
2. **fix [medium/content]** Add alt text to the two images that have no alt attribute. Two images on the page (the site logo file enwiki-25.svg and the 40px Edit-clear icon) carry no alt attribute at all. Six other images correctly use empty alt text for decorative purposes, which is valid and needs no change. Add a concise descriptive alt attribute to the two images missing one. Keep the existing empty alt="" on the six decorative images exact…
3. **fix [medium/content]** Write a meta description for the article. The page has a title but the meta description is empty, so search engines and AI answer engines must generate their own snippet from page text. Add a 150–160 character meta description that states what search engine optimization is and what the article covers, using the article's own opening definition as the source.
4. **fix [medium/content]** Complete Open Graph and Twitter Card metadata. Open Graph title and type are present, but og:description and og:image are empty and no Twitter Card type is set. Shared links therefore render without a description or preview image. Populate og:description with the same text as the meta description, set og:image to a representative image from the article, and add a twitter:card value (summary or summary_large_image) wi…
5. **fix [high/aeo-geo]** Add a direct definition near the top for AI answer extraction. The first visible text is a language list and navigation chrome, not a definition. AI answer engines such as ChatGPT Search, Perplexity and Gemini extract concise, self-contained statements, and this page does not lead with one. Place a one- to two-sentence plain-language definition of search engine optimization in the first paragraph of visible body text…
6. **fix [medium/aeo-geo]** Strengthen structured data with dates and authorship detail. The Article JSON-LD already includes name, url, sameAs, mainEntity, author, publisher, datePublished, dateModified and headline. It can be made more machine-readable for AI systems by ensuring the author and publisher are full Organization/Person entities rather than bare names. Expand the author and publisher values in the existing Article markup into comp…
7. **fix [medium/performance]** Confirm whether the slow response is network-bound or server-side. The measured TTFB of 3,663 ms accounts for most of the 4,685 ms total load time, which points to network distance or a slow link from the auditing host rather than front-end rendering. Lab LCP was 4,480 ms and CLS 0.075. These are lab measurements, not real-user Core Web Vitals. Check real-user Core Web Vitals in Search Console and a RUM tool before c…
8. **fix [low/aeo-geo]** Add a low-priority llms.txt file. No llms.txt file was found. This file is optional and not confirmed to be read by any major engine or assistant, so it offers no guaranteed retrieval or citation benefit. Note: llms.txt is optional and not yet confirmed to be read by the major search engines or assistants, so treat it as low priority. If desired, publish a simple /llms.txt at the site root listing the main article UR…

Removed by the checker (3): "Investigate and resolve the 403 refusals to allowe" (replaced by a measured finding on the same topic); "ClaudeBot (a training crawler that robots.txt allo" (blocking AI-training crawlers is a policy decision); "Googlebot, Bingbot and Applebot also returned HTTP" (the refusals match robots.txt policy or cannot be )
Added by the checker: AI-training crawler block

## Reviewer verdict

_to be completed by a human reviewer_

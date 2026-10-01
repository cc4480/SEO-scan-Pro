# 13-nasa — https://www.nasa.gov

*government site.* CMS-driven, large images, many links.

Scan: 25.7s · scoreMethod **measured** · scores {"overall":86,"technical":93,"content":71,"aeoGeo":88,"performance":90} · simulated: false · AI used: true

## Measurements vs independent ground truth

| Fact | Scanner | Ground truth | |
|---|---|---|---|
| title | "NASA" | "NASA" | ok |
| meta description present | true | true | ok |
| canonical | https://www.nasa.gov/ | https://www.nasa.gov/ | ok |
| viewport present | true | true | ok |
| html lang | en-US | en-US | ok |
| H1 count | 0 | 0 | ok |
| H2 count | 12 | 12 | ok |
| images (with src) | 74 | 74 <br><sub>DOM has 74 <img>, 74 with a source</sub> | ok |
| images missing/empty alt | 33 | 33 <br><sub>no alt attr 0, empty alt 33</sub> | ok |
| links (scanner total vs real+hash anchors) | 283 | 283+2 hash | ok |
| JSON-LD types | 7 | 7 | ok |
| visible words (rendered) | 1629 | 663 <br><sub>innerText vs markup count differ for hidden text; tolerance 30%</sub> | **MISMATCH** |
| hreflang present | false | false | ok |
| raw words (no JS) | 1616 | 643 <br><sub>ground truth = real load with JavaScript disabled</sub> | **MISMATCH** |
| raw links (no JS) | 283 | 283 | ok |
| rendered words (facts) | 1630 | 663 | **MISMATCH** |
| robots.txt blocks all | false | false | ok |
| sitemap found | true | true <br><sub>sitemap.xml HTTP 200, robots directive no</sub> | ok |
| llms.txt found | false | false <br><sub>llms.txt HTTP 404 (HTML, not a real llms.txt)</sub> | ok |
| header hsts | true | true | ok |
| header csp | false | false | ok |
| header xFrameOptions | true | true | ok |
| header xContentTypeOptions | false | false | ok |
| header referrerPolicy | false | false | ok |
| bot GPTBot | 200 | 200 | ok |
| bot ClaudeBot | 200 | 200 | ok |
| bot CCBot | 200 | 200 | ok |
| bot Bytespider | 429 blocked | 429 blocked | ok |
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

1. **critical** No H1 element on the homepage: headings.h1 is an empty array, while there are 12 H2s and dozens of H3s. This weakens topical clarity for both classic search and AI answer extraction.
2. **critical** 33 of 74 images (44.6%) are missing alt text, which is an accessibility and content-quality gap on a page with 74 images.
3. **critical** No llms.txt file (llmsTxtFound: false), so AI agents have no curated machine-readable map of the site's key content.
4. **critical** Security headers are incomplete: CSP is false, X-Content-Type-Options is false, and Referrer-Policy is false, despite HTTPS and HSTS being enabled.
5. **critical** Heading hierarchy is overloaded: 12 H2s and more than 40 H3s on a single page, many of which are repeated labels such as 'Highlights', 'Featured', 'Today' and 'Image Of The Day', which dilutes semantic structure.
6. **fix [low/aeo-geo]** Decide, and state, whether AI-training crawlers are welcome. Bytespider (HTTP 429) were refused even though robots.txt does not disallow them. Search and assistant crawlers (OAI-SearchBot, Claude-SearchBot, PerplexityBot, Googlebot, Bingbot, Applebot) were let through, so answer-engine citation is not affected by this. Whether to block AI-training crawlers is the site owner's choice; the problem is only a mismatch be…
   - ⚠ says OAI-SearchBot is blocked but it got HTTP 200
   - ⚠ says Claude-SearchBot is blocked but it got HTTP 200
   - ⚠ says PerplexityBot is blocked but it got HTTP 200
   - ⚠ says Googlebot is blocked but it got HTTP 200
   - ⚠ says Bingbot is blocked but it got HTTP 200
   - ⚠ says Applebot is blocked but it got HTTP 200
7. **fix [high/content]** Add a single descriptive H1 to the homepage. The homepage has zero H1 elements (headings.h1 is empty) while carrying 12 H2s and dozens of H3s. Search engines and AI answer engines use the H1 as the primary topical signal for the page. Insert one H1 near the top of the main content area, e.g. 'NASA — Explore the Universe, Missions, and Science'. Keep it to a single H1 per page, ensure it is visible (not display:none),…
8. **fix [high/content]** Add alt text to the 33 images missing it. 33 of 74 images on the homepage have no alt attribute. This is an accessibility and content-quality issue; decorative images may legitimately use empty alt="", but content images should be described. Audit all 74 images. For each content image (news thumbnails, mission imagery, portraits), add a concise descriptive alt attribute of 5–15 words. For purely decorative images, se…
9. **fix [high/aeo-geo]** Publish an llms.txt file at the site root. llmsTxtFound is false. An llms.txt gives AI agents a curated, machine-readable index of the site's most important pages and content, improving retrieval accuracy in ChatGPT Search, Perplexity, Gemini and similar systems. Create https://www.nasa.gov/llms.txt in Markdown format. Include: an H1 with the site name, a one-paragraph summary, and a bulleted list of key sections wit…
10. **fix [medium/technical]** Add missing security headers: CSP, X-Content-Type-Options, Referrer-Policy. securityHeaders shows csp: false, xContentTypeOptions: false and referrerPolicy: false, while https, hsts and xFrameOptions are true. These headers harden the site and are part of enterprise technical hygiene. Add Content-Security-Policy (start in report-only mode to avoid breakage), X-Content-Type-Options: nosniff, and Referrer-Policy: stric…
11. **fix [medium/content]** Simplify and de-duplicate the heading hierarchy. The page has 12 H2s and more than 40 H3s, with repeated labels such as 'Highlights', 'Featured', 'Today' and 'Image Of The Day'. This dilutes the semantic outline and makes it harder for AI systems to identify the page's main topics. Consolidate repeated H3 labels into unique, descriptive headings. Use H2 for major sections (News, Missions, Multimedia, About) and H3 on…
12. **fix [low/aeo-geo]** Leverage existing structured data for richer AI answers. The site already has Organization, WebSite, SearchAction, WebPage, Article, Person and ImageObject JSON-LD. This is a strong base. The Article entity includes headline, description, datePublished, dateModified, image, author, publisher and mainEntityOfPage. No new schema types are required. Instead, ensure the Article entities on news pages include the same com…
13. **fix [low/technical]** Preserve the server-rendered content advantage. rawHtmlVsRendered shows rawWords 1,616 vs renderedWords 1,630, rawLinks 283 vs renderedLinks 283, and identical schema types. The page is essentially fully server-rendered, which is ideal because many AI retrieval crawlers do not execute JavaScript. Keep critical content and JSON-LD in the initial HTML response. Avoid moving schema or primary text behind client-side Jav…

Removed by the checker (5): "Add hreflang annotations for English and Spanish c" (no alternate-language versions were found, so href); "No hreflang annotations (hreflang: []) even though" (no alternate-language versions were found, so href); "Resolve the Bytespider 429 rate-limit response" (replaced by a measured finding on the same topic); "Maintain the strong AI crawler access posture" (replaced by a measured finding on the same topic); "Bytespider returned HTTP 429 (rate-limited) while " (blocking AI-training crawlers is a policy decision)
Added by the checker: AI-training crawler block

## Reviewer verdict

Reviewer R2. Counts: ACCURATE 7, INACCURATE 1, MISLEADING 2, UNSUPPORTED 1, SUBJECTIVE 2.
Summary: the page facts are right (no H1, 12 H2, headers, JSON-LD, links). Problems: 33 "missing alt"
images are `alt=""` (A-08); the Bytespider 429 is a single non-reproducible response turned into "refused"
(A-02); llms.txt and heading counts are marked critical (A-13); the displayed word counts are not
quoted in findings except fix 13.

Measurement mismatches explained: visible words 1629 vs 663, raw 1616 vs 643, rendered 1630 vs 663:
the scanner counts text inside `display:none` mega-menu submenus (511 + 302 + 64 + 28 + 23 ... = 970 hidden
words, verified with a live DOM walk) that innerText excludes (A-09, scanner bug). Raw-vs-rendered conclusion
(server-rendered) still holds because both sides are inflated equally.

1. ACCURATE: no H1 (ground 0; 12 H2 and 86 H3).
2. MISLEADING: 33 of 74 are `alt=""` (decorative), 0 lack the attribute (A-08). "Critical" not justified.
3. ACCURATE: llms.txt 404; severity "critical" is inflated (A-13).
4. ACCURATE: live response has HSTS and X-Frame-Options only; CSP, X-Content-Type-Options, Referrer-Policy absent. "Critical" is inflated (A-13).
5. SUBJECTIVE: 12 H2 and 86 H3 are real (many H3 sit in hidden menus) and "Highlights/Featured" repeat, but critical is not reasonable; "Image Of The Day" is an H2 (x2) and "Today" an H3, loosely described.
6. MISLEADING: one 429 for Bytespider in both runs, but 5 later requests with the same UA all got 200 (not reproducible): a rate-limit/transient (A-02), not "refused". Also ungrammatical ("Bytespider ... were refused"). The 6 ⚠ flags are noise (the sentence says those crawlers were let through).
7. ACCURATE: zero H1 confirmed; example text is only a suggestion.
8. INACCURATE: "33 of 74 images have no alt attribute": none lacks the attribute, all 33 have `alt=""`; the text then concedes alt="" is valid for decorative images, which is what they have.
9. UNSUPPORTED: fact (404) true; "improving retrieval accuracy in ChatGPT Search, Perplexity, Gemini" is not evidenced (no tested crawler consumes llms.txt) and "high" priority is not justified.
10. ACCURATE: same facts as 4; medium is reasonable.
11. SUBJECTIVE: duplicated labels are real (e.g. "Highlights", "Featured"); advice is a judgement.
12. ACCURATE: schema list and the Article properties match ground (Organization, WebSite, SearchAction, WebPage, Article, Person, ImageObject).
13. ACCURATE: raw and rendered links (283/283) and schema identical, i.e. server-rendered; the word numbers (1,616/1,630) are inflated by hidden text (A-09) but the conclusion is correct.

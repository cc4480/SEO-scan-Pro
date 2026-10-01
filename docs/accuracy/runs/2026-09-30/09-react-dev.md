# 09-react-dev — https://react.dev

*documentation.* Docs site with many headings and few images.

Scan: 25.1s · scoreMethod **measured** · scores {"overall":88,"technical":85,"content":90,"aeoGeo":80,"performance":100} · simulated: false · AI used: true

## Measurements vs independent ground truth

| Fact | Scanner | Ground truth | |
|---|---|---|---|
| title | "React" | "React" | ok |
| meta description present | true | true | ok |
| canonical | https://react.dev/ | https://react.dev/ | ok |
| viewport present | true | true | ok |
| html lang | en | en | ok |
| H1 count | 2 | 2 | ok |
| H2 count | 15 | 15 | ok |
| images (with src) | 43 | 43 <br><sub>DOM has 43 <img>, 43 with a source</sub> | ok |
| images missing/empty alt | 24 | 24 <br><sub>no alt attr 0, empty alt 24</sub> | ok |
| links (scanner total vs real+hash anchors) | 98 | 98+0 hash | ok |
| JSON-LD types | 0 | 0 | ok |
| visible words (rendered) | 1227 | 977 <br><sub>innerText vs markup count differ for hidden text; tolerance 30%</sub> | ok |
| hreflang present | true | true | ok |
| raw words (no JS) | 1228 | 974 <br><sub>ground truth = real load with JavaScript disabled</sub> | ok |
| raw links (no JS) | 98 | 98 | ok |
| rendered words (facts) | 1228 | 977 | ok |
| robots.txt blocks all | false | false | ok |
| sitemap found | false | false <br><sub>sitemap.xml HTTP 404, robots directive no</sub> | ok |
| llms.txt found | true | true <br><sub>llms.txt HTTP 200</sub> | ok |
| header hsts | true | true | ok |
| header csp | false | false | ok |
| header xFrameOptions | false | false | ok |
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

1. **critical** No structured data on the homepage: structuredData.hasJsonLd is false and structuredData.types is empty. There is zero JSON-LD for an entity as significant as React, which limits rich-result eligibility and machine disambiguation.
2. **critical** 24 of 43 images (56%) are missing alt text (missingAltCount 24). This is an accessibility and content-comprehension gap, not a ranking failure, but it degrades image understanding for both screen readers and AI retrieval systems.
3. **critical** Four security headers are absent: securityHeaders.csp false, xFrameOptions false, xContentTypeOptions false, referrerPolicy false. HSTS and HTTPS are present, so this is hardening, not a breach.
4. **critical** The homepage carries no answer-shaped content blocks: visibleSections shows pricing false, faq false, howItWorks false, features false, about false, contact false, reviews false. For a library homepage this is defensible, but it leaves AI answer engines with little extractable Q&A material.
5. **fix [high/aeo-geo]** Add JSON-LD structured data to the homepage. The payload shows structuredData.hasJsonLd false and structuredData.types empty, and measured.structuredDataEntities is empty. The homepage therefore exposes no machine-readable entity graph despite being the canonical entry point for React. Emit a single <script type="application/ld+json"> block in the document head containing an @graph with: (1) WebSite — name 'React', u…
6. **fix [high/content]** Write descriptive alt text for the 24 images missing it. missingAltCount is 24 out of imagesCount 43. The homepage includes video thumbnails and illustrative diagrams (headings reference Video.js, My video, VideoList.js, SearchableVideoList.js and 30+ conference talk titles), so many of these images carry real informational value. Audit every <img> on the homepage. For content images — video thumbnails, code illustra…
7. **fix [medium/technical]** Add the four missing security headers. securityHeaders shows csp false, xFrameOptions false, xContentTypeOptions false and referrerPolicy false. HTTPS and HSTS are already true, so the transport layer is covered; these four are browser-side hardening headers. At the CDN or hosting layer, add: Content-Security-Policy with a policy that permits the site's own scripts, styles, fonts and the video player origins actually…
8. **fix [medium/aeo-geo]** Add answer-shaped content blocks for AI retrieval. visibleSections reports faq false, howItWorks false, features false and about false, and the page word count is 1,227. AI answer engines (ChatGPT Search, Perplexity, Gemini) favour pages that state a direct answer in extractable prose. The homepage currently leads with video galleries and community copy. Add a short, factual 'What is React?' block near the top — two …
9. **fix [medium/content]** Strengthen the homepage title and meta description for query coverage. meta.title is 'React' (a single word) and meta.description is a long 40+ word paragraph. The title gives search engines and AI systems almost no topical signal beyond the brand name, and the description is likely truncated in SERPs. Change the title to something like 'React — The Library for Web and Native User Interfaces' (under 60 characters). R…
10. **fix [low/aeo-geo]** Preserve and document the JavaScript-free rendering guarantee. rawHtmlVsRendered shows rawWords 1228 = renderedWords 1228, rawLinks 98 = renderedLinks 98, and schemaOnlyAfterJs is empty. The page is fully server-rendered and readable without JavaScript — a major AEO advantage, since it is commonly reported that many AI retrieval crawlers do not execute JavaScript. Treat this as a regression guard, not a fix. Add a CI…
11. **fix [low/aeo-geo]** Keep the existing crawler access policy intact. crawlerAccess shows all 13 tested crawlers — including GPTBot, ClaudeBot, CCBot, Bytespider, OAI-SearchBot, Claude-SearchBot, PerplexityBot, Googlebot, Bingbot, Applebot, ChatGPT-User, Claude-User and Perplexity-User — returning HTTP 200 with robotsTxtAllows true and blocked false. llmsTxtFound is also true. No change required. Add a regression test to the robots.txt de…
   - ⚠ says GPTBot is blocked but it got HTTP 200
   - ⚠ says ClaudeBot is blocked but it got HTTP 200
   - ⚠ says CCBot is blocked but it got HTTP 200
   - ⚠ says Bytespider is blocked but it got HTTP 200
   - ⚠ says OAI-SearchBot is blocked but it got HTTP 200
   - ⚠ says Claude-SearchBot is blocked but it got HTTP 200
   - ⚠ says PerplexityBot is blocked but it got HTTP 200
   - ⚠ says Googlebot is blocked but it got HTTP 200
   - ⚠ says Bingbot is blocked but it got HTTP 200
   - ⚠ says Applebot is blocked but it got HTTP 200
   - ⚠ says ChatGPT-User is blocked but it got HTTP 200
   - ⚠ says Claude-User is blocked but it got HTTP 200
   - ⚠ says Perplexity-User is blocked but it got HTTP 200

Removed by the checker (0): none
Added by the checker: none

## Reviewer verdict

_to be completed by a human reviewer_

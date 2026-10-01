# 08-vercel — https://vercel.com

*Next.js marketing.* SSR framework site with structured data.

Scan: 28.6s · scoreMethod **measured** · scores {"overall":98,"technical":100,"content":98,"aeoGeo":100,"performance":90} · simulated: false · AI used: true

## Measurements vs independent ground truth

| Fact | Scanner | Ground truth | |
|---|---|---|---|
| title | "Agentic Infrastructure - Vercel" | "Agentic Infrastructure - Vercel" | ok |
| meta description present | true | true | ok |
| canonical | https://vercel.com | https://vercel.com | ok |
| viewport present | true | true | ok |
| html lang | en | en | ok |
| H1 count | 1 | 1 | ok |
| H2 count | 17 | 17 | ok |
| images (with src) | 18 | 18 <br><sub>DOM has 19 <img>, 18 with a source</sub> | ok |
| images missing/empty alt | 2 | 3 <br><sub>no alt attr 0, empty alt 3</sub> | ok |
| links (scanner total vs real+hash anchors) | 166 | 166+1 hash | ok |
| JSON-LD types | 8 | 8 | ok |
| visible words (rendered) | 521 | 134 <br><sub>innerText vs markup count differ for hidden text; tolerance 30%</sub> | **MISMATCH** |
| hreflang present | false | false | ok |
| raw words (no JS) | 525 | 182 <br><sub>ground truth = real load with JavaScript disabled</sub> | **MISMATCH** |
| raw links (no JS) | 166 | 166 | ok |
| rendered words (facts) | 525 | 134 | **MISMATCH** |
| robots.txt blocks all | false | false | ok |
| sitemap found | true | true <br><sub>sitemap.xml HTTP 200, robots directive yes</sub> | ok |
| llms.txt found | true | true <br><sub>llms.txt HTTP 200</sub> | ok |
| header hsts | true | true | ok |
| header csp | true | true | ok |
| header xFrameOptions | true | true | ok |
| header xContentTypeOptions | true | true | ok |
| header referrerPolicy | true | true | ok |
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

1. **critical** 2 of 18 images on the homepage are missing alt text (missingAltCount: 2), reducing accessibility and removing image context that AI retrieval systems can otherwise index.
2. **critical** The homepage has no FAQ section (visibleSections.faq: false) and no how-it-works section (visibleSections.howItWorks: false), so the page offers no directly extractable question-and-answer content for AI answer engines.
3. **fix [medium/content]** Add descriptive alt text to the two unlabelled images. The crawl found 18 images on the homepage and missingAltCount of 2. Two images carry no alt attribute, which is an accessibility defect and removes image-level context from AI retrieval and image search. This is a content/accessibility improvement rather than a ranking failure; decorative images legitimately carry empty alt text, so only the two genuinely informa…
4. **fix [high/aeo-geo]** Add an FAQ block with FAQPage structured data to the homepage. visibleSections.faq is false and the page has no FAQ content. AI answer engines (ChatGPT Search, Perplexity, Gemini) preferentially extract question-and-answer pairs, and the homepage currently offers none — its 521 words are brand positioning, not answers. Note that FAQ rich results no longer render in Google Search, so the value here is machine comprehe…
5. **fix [medium/aeo-geo]** Add a how-it-works section to give AI systems a process narrative. visibleSections.howItWorks is false. AI systems answering 'how do I deploy on Vercel' or 'how does Vercel work' queries have no on-page process description to extract, so they must infer it from third-party sources. Add a concise how-it-works section to the homepage describing the deploy flow in 3–5 ordered steps (connect repository, push code, build,…
6. **fix [medium/content]** Surface pricing on the page to corroborate the SoftwareApplication Offer. structuredDataEntities shows a SoftwareApplication with an Offer at price 0 USD, but visibleSections.pricing is false and pricesVisibleOnPage is empty. Machine-readable pricing with no visible counterpart is a trust and consistency gap: AI systems that cross-check schema against page text may discount the claim. Add a visible pricing or plan-co…
7. **fix [low/content]** Add a features section to expose capability language to retrieval systems. visibleSections.features is false. The homepage names product areas in headings (Agent Stack, Core Platform, Security, Tools, Frameworks, SDKs) but provides no feature-level descriptive prose, limiting the vocabulary AI systems can match against capability queries. Add a short features section with 4–6 capability blocks, each with a heading an…
8. **fix [low/technical]** Preserve the no-JavaScript parity that currently benefits AI crawlers. rawHtmlVsRendered shows identical word counts (525), link counts (166) and schema types between the raw response and the rendered DOM, with schemaOnlyAfterJs empty. This means AI retrieval crawlers that do not execute JavaScript — commonly reported behaviour, not tested per crawler here — still receive the full page. This is a strength to protect,…
9. **fix [low/aeo-geo]** Keep the current crawler-permissive robots.txt policy under review. crawlerAccess confirms all 13 tested crawlers — including training crawlers GPTBot, ClaudeBot, CCBot and Bytespider, search crawlers OAI-SearchBot, Claude-SearchBot, PerplexityBot, Googlebot, Bingbot and Applebot, and assistant crawlers ChatGPT-User, Claude-User and Perplexity-User — receive HTTP 200 with robotsTxtAllows true. This is optimal for AI …
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

Removed by the checker (3): "Confirm whether localized variants are intended be" (no alternate-language versions were found, so href); "The homepage has no visible pricing section (visib" (the page already has a pricing section); "The page contains no hreflang annotations (hreflan" (no alternate-language versions were found, so href)
Added by the checker: none

## Reviewer verdict

_to be completed by a human reviewer_

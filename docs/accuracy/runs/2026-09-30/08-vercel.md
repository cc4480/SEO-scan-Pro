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

Reviewer R1 (2026-09-30). Counts: ACCURATE 2, INACCURATE 1, MISLEADING 3, UNSUPPORTED 0, SUBJECTIVE 3.

Summary: mostly true facts with several framing errors. Verified live (curl + puppeteer): no FAQ or "how it works" text anywhere in the raw HTML or the scrolled DOM; JSON-LD is in the raw HTML (Organization, SoftwareApplication+Offer price 0, Service...); the 2 "missing alt" images are the hero background fallbacks `fallback-dark-glow-*.webp`, both `alt=""` (decorative); 14 of the 18 "images" are light/dark and mobile/desktop duplicates of 4 pictures.

Measurement mismatches explained:
- Visible words 521 vs 134, rendered 525 vs 134, raw 525 vs 182: not a scanner count error per se but two definitions. The scanner counts text in the serialised HTML (my curl of the raw page gives 550 words including the mega menu, theme-duplicated markup and off-screen blocks). Ground `innerText` is 134 because below-fold sections use `content-visibility`/lazy rendering (15 of 17 `<h2>` have empty innerText until scrolled); after scrolling the page I measured 332 words. So the page a visitor reads has ~330 words, not 521: scanner overcounts (A-09), ground undercounts without scrolling (new ground-tool defect, see R1.md). Ground noJs reported status 304, so its raw figure 182 came from a conditional/cached response and is unreliable (ground-tool bug). Raw=rendered parity (525 each) is confirmed by my raw-HTML read.
- Images 18 vs 19 DOM: one `<img>` has no src (ground counts it); empty alt 2 vs 3 is the same image.

1. MISLEADING: the 2 images have `alt=""` (valid, decorative background glows), not missing alt; "of 18" also counts 14 theme/viewport duplicates of 4 pictures. Critical severity is wrong for decorative backgrounds (A-08, A-13).
2. SUBJECTIVE: facts are true (no FAQ, no how-it-works, verified), but critical for a product marketing homepage is inflated; the "no directly extractable Q&A" conclusion is reasonable but not critical (A-13).
3. INACCURATE: "Two images carry no alt attribute" is false (both are `alt=""`); the remediation itself concedes decorative images should have empty alt, contradicting the title.
4. SUBJECTIVE: FAQ does not exist (true); "high" priority is generous; text about FAQ rich results no longer showing in Google is correct. "its 521 words" overstates (about 330 visible).
5. SUBJECTIVE: true that there is no how-it-works block; value is an opinion; the suggested deploy steps are an example, not a claim.
6. MISLEADING: states `visibleSections.pricing is false`, but the payload says pricing: true (set by the "Pricing" nav link, A-05). The checker removed the model's critical-issue version of this claim with the reason "the page already has a pricing section", which is false (homepage has no prices; pricesVisibleOnPage is empty), while this fix survived. The underlying observation (SoftwareApplication Offer price 0 with no visible price) is true.
7. MISLEADING: the page does have "Features" lists under each product block (verified in DOM text: "Features / Durable Orchestration / Sandboxed Environments ..."), and the "headings" cited (Agent Stack, Core Platform, Security, Tools, Frameworks, SDKs) are footer navigation groups, not product-area headings. "No feature-level prose" is arguable, "features section absent" is not true.
8. ACCURATE: raw HTML contains the same content, links and JSON-LD (verified with curl, 626 KB, 550 words, 8 schema types); "commonly reported behaviour, not tested" is properly hedged.
9. ACCURATE: all 13 crawlers get 200 and robots.txt has no AI-crawler Disallow (ground agrees). The checker-style flags "says GPTBot is blocked" are noise from the word "blocked" in the hedge. Caveat: robots.txt carries `Content-Signal: search=yes, ai-input=yes, ai-train=no`, which the report ignores while calling the policy "optimal ... for training crawlers" (see R1.md).

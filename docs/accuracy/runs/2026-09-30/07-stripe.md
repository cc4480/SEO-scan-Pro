# 07-stripe — https://stripe.com

*SaaS marketing, JS heavy.* Animated, script-driven marketing page.

Scan: 28.1s · scoreMethod **undefined** · scores {"overall":70,"technical":95,"content":30,"aeoGeo":95,"performance":61} · simulated: false · AI used: false

## Measurements vs independent ground truth

| Fact | Scanner | Ground truth | |
|---|---|---|---|
| title | "Stripe | Financial Infrastructure to Grow Your Re | "Stripe | Financial Infrastructure to Grow Your Re | ok |
| meta description present | true | true | ok |
| canonical | https://stripe.com/ | https://stripe.com/ | ok |
| viewport present | true | true | ok |
| html lang | en-US | en-US | ok |
| H1 count | 2 | 2 | ok |
| H2 count | 6 | 6 | ok |
| images (with src) | 42 | 40 <br><sub>DOM has 40 <img>, 40 with a source</sub> | ok |
| images missing/empty alt | 38 | 36 <br><sub>no alt attr 0, empty alt 36</sub> | ok |
| links (scanner total vs real+hash anchors) | 191 | 191+0 hash | ok |
| JSON-LD types | 7 | 7 | ok |
| visible words (rendered) | 2090 | 1736 <br><sub>innerText vs markup count differ for hidden text; tolerance 30%</sub> | ok |
| hreflang present | true | true | ok |
| raw words (no JS) | 1861 | 1617 <br><sub>ground truth = real load with JavaScript disabled</sub> | ok |
| raw links (no JS) | 191 | 191 | ok |
| rendered words (facts) | 2098 | 1736 | ok |
| robots.txt blocks all | false | false | ok |
| sitemap found | true | true <br><sub>sitemap.xml HTTP 404, robots directive yes</sub> | ok |
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

1. **critical** Found 38 images missing alt-text descriptions.
2. **critical** Detected slow page generation delay of 1163ms.
3. **fix [medium/content]** Repair Alt Attributes for Images. Missing alternative texts negatively affect and degrade visual accessibility and Google Image searches. Audit image templates and populate missing [alt] tag values with contextual keywords describing the asset.
4. **fix [medium/performance]** Optimize Core Asset Performance. Response times exceed 2026 search speed standards, creating immediate conversion drop-off. Leverage CDN edge hosting, compress images with dynamic next-gen formats (WebP/AVIF), and defer secondary client scripts.
5. **fix [medium/aeo-geo]** Strengthen Answer optimization structures (AEO). Structure of subheadings could benefit from natural language answers to target AI prompt queries. Introduce a target FAQ zone on the landing page matching user inquiry queries to trigger Google Featured Snippets.

Removed by the checker (0): none
Added by the checker: none

## Reviewer verdict

Reviewer R1 (2026-09-30). Counts: ACCURATE 0, INACCURATE 2, MISLEADING 2, UNSUPPORTED 1, SUBJECTIVE 0.

Summary: CONFIRMED offline fallback. Event log: `DeepSeek failed (Unexpected non-whitespace character after JSON at position 9207 ...): using the OFFLINE generator instead. This report is NOT AI-written.` (A-06: valid JSON followed by extra text). The user-visible sheet says "AI used: false" but nothing in the report body says it is a canned rule-based text, and `scoreMethod` is undefined because the fallback in the `catch` of `generateSeoReport` (`lib/deepseek.ts` ~line 215) returns `generateSimulatorReport(crawl)` WITHOUT `finalizeReport`, so neither the fact-checker nor the measured scoring ran (the no-API-key path at line 40 does call `finalizeReport`). Measurements all agree with ground truth (42 vs 40 images: my rerun showed the scanner-sized viewport really gets 42 `<img>` and the ground one 40, so the site served a variant; 38 vs 36 empty-alt follows; words 2090 vs 1736 is hidden text counted, A-09).

What the offline report gets wrong or cannot support:
- Executive summary: "crawlability ... can be significantly improved" (all 13 crawlers 200, sitemap, llms.txt and robots all fine); "Introducing Schema.org structured models" (the page already has 7 JSON-LD types: WebSite, Organization, Person, ImageObject, ContactPoint, Place, PostalAddress); "compressing static assets" (nothing about asset size was measured, images are already webp/CDN-served); "will immediately amplify index ranking" (marketing boilerplate).
- aeoAssessment: "Excellent" direct-answer friendliness and `voiceSearchOptimized: true` come from `h2.length > 2` and `h3.length > 1`; score 85 from `hasJsonLd`. richSnippetEligibility lists ContactPoint, Place, PostalAddress, ImageObject which are not rich-result types. The three AEO recommendations are fixed boilerplate (schema "mapping business locations" for a payments company).
- competitorComparisonText: "holds solid keyword density levels but trails premium competitors" is a template; no keyword density and no competitor was measured.
- Scores: content 30 is the formula `95 - 4*missingAlt` hitting its floor of 30 because 36 to 38 `alt=""` decorative images are counted as defects (A-08); performance 61 is `100 - loadMs/30`; aeoGeo 95 is `70+15+10` constants; overall 70 is therefore not a measurement.

1. MISLEADING: Stripe has 0 images with no alt attribute; 36 (ground) to 38 (scanner variant) are `alt=""`, the valid decorative form, and only ~4 sampled images carry real alt text. "Missing alt-text descriptions" is wrong wording and a non-defect for most (A-08).
2. INACCURATE: "slow page generation delay of 1163ms". Measured TTFB 276 ms, LCP 956 ms, CLS 0: this is a fast page. The generator calls anything over a hard-coded 600 ms "critical". 1163 ms is also the full load time including all subresources, not "page generation".
3. MISLEADING: same non-defect as 1; remediation "populate alt with contextual keywords" invites keyword stuffing and would break the decorative images' correct empty alt.
4. INACCURATE: "exceed 2026 search speed standards" is an invented standard; "leverage CDN edge hosting" (images already come from b.stripecdn.com / images.stripeassets.com), "compress ... WebP/AVIF" (first image already .webp), and "creating immediate conversion drop-off" are unsupported by any measurement. LCP 956 ms passes Google's 2.5 s threshold.
5. UNSUPPORTED: generic filler added when fewer than 3 fixes exist ("Ensure we always have at least 3-4 fixes"), not derived from evidence; "FAQ zone ... to trigger Google Featured Snippets" is wrong in itself (FAQ blocks do not trigger featured snippets; FAQ rich results are largely retired). Its premise (no FAQ on stripe.com) is true (verified) but that is not why it was written.

# 06-apple — https://www.apple.com

*heavy marketing.* Large pages, many images, strict performance expectations.

Scan: 23.4s · scoreMethod **measured** · scores {"overall":96,"technical":100,"content":90,"aeoGeo":92,"performance":100} · simulated: false · AI used: true

## Measurements vs independent ground truth

| Fact | Scanner | Ground truth | |
|---|---|---|---|
| title | "Apple" | "Apple" | ok |
| meta description present | true | true | ok |
| canonical | https://www.apple.com/ | https://www.apple.com/ | ok |
| viewport present | true | true | ok |
| html lang | en-US | en-US | ok |
| H1 count | 1 | 1 | ok |
| H2 count | 38 | 38 | ok |
| images (with src) | 51 | 51 <br><sub>DOM has 51 <img>, 51 with a source</sub> | ok |
| images missing/empty alt | 42 | 42 <br><sub>no alt attr 0, empty alt 42</sub> | ok |
| links (scanner total vs real+hash anchors) | 353 | 353+10 hash | ok |
| JSON-LD types | 5 | 5 | ok |
| visible words (rendered) | 1510 | 893 <br><sub>innerText vs markup count differ for hidden text; tolerance 30%</sub> | **MISMATCH** |
| hreflang present | true | true | ok |
| raw words (no JS) | 926 | 880 <br><sub>ground truth = real load with JavaScript disabled</sub> | ok |
| raw links (no JS) | 134 | 133 | ok |
| rendered words (facts) | 1511 | 893 | **MISMATCH** |
| robots.txt blocks all | false | false | ok |
| sitemap found | true | true <br><sub>sitemap.xml HTTP 200, robots directive yes</sub> | ok |
| llms.txt found | false | false <br><sub>llms.txt HTTP 404 (HTML, not a real llms.txt)</sub> | ok |
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

1. **critical** 42 of 51 images on the homepage have no alt attribute (missingAltCount: 42 of imagesCount: 51), which is an accessibility and image-understanding gap for both screen readers and AI crawlers that parse image context.
2. **critical** The homepage exposes no FAQ, how-it-works or feature section (visibleSections.faq, .howItWorks and .features are all false), so there is little structured, directly quotable answer content for AI Overviews, ChatGPT Search or Perplexity to lift.
3. **critical** No llms.txt file was found (llmsTxtFound: false), so there is no curated machine-readable map of the site's key pages and facts for AI agents that look for one.
4. **fix [high/content]** Add descriptive alt text to the 42 unlabelled images. The crawl found 51 images on the homepage and 42 without an alt attribute. Decorative images legitimately use empty alt="", but 42 of 51 is far above what a decorative-only set would explain, and unlabelled product imagery loses meaning for screen readers and for AI systems that use image context. Audit every <img> on the homepage. For each image that conveys info…
5. **fix [high/aeo-geo]** Add an extractable FAQ block with FAQPage markup. visibleSections.faq is false, so the homepage offers no question-and-answer content. AI answer engines favour pages that state a question and answer it in plain, self-contained sentences. Note that FAQ rich results no longer appear in Google Search, so this is for machine comprehension, not for a rich result. Add a short FAQ section near the bottom of the homepage wit…
6. **fix [medium/aeo-geo]** Publish an llms.txt file. llmsTxtFound is false. An llms.txt gives AI agents a curated, plain-text index of the site's most important pages and canonical facts, which reduces the chance they cite an outdated or secondary page. Create https://www.apple.com/llms.txt containing a short site description followed by a markdown list of key URLs with one-line descriptions (product hubs, support, store, newsroom). Keep it fa…
7. **fix [medium/technical]** Reduce JavaScript dependence for primary content and navigation. rawHtmlVsRendered shows the raw response carries 926 words and 134 links versus 1,511 words and 354 links after rendering. The gap means a meaningful share of content and links is injected by JavaScript, and it is commonly reported that many AI retrieval crawlers do not execute JavaScript. Server-render or statically pre-render the primary homepage copy…
8. **fix [medium/content]** Add a visible pricing or value section. visibleSections.pricing is true but pricesVisibleOnPage is empty, and no Product or Offer entities appear in structuredDataEntities. The page therefore gives answer engines no concrete price or offer facts to quote. Where products are merchandised on the homepage, surface the actual starting price shown on the page next to the product name so it is present in the DOM. If pricin…
9. **fix [low/technical]** Add Twitter Card metadata. social.twitterCard is an empty string while ogTitle, ogDescription and ogImage are all populated. The page shares well on Open Graph platforms but has no explicit Twitter/X card declaration. Add <meta name="twitter:card" content="summary_large_image"> plus twitter:title, twitter:description and twitter:image to the homepage head, mirroring the existing Open Graph values.
10. **fix [low/content]** Add a meta description fallback check and keep it unique. The homepage meta description is present and well written, but it is identical to the ogDescription. That is acceptable for a homepage, but the pattern should not be copied to subpages. Keep the homepage description as is. For all other templates, write a unique description that states the page's specific value in under 160 characters, and do not simply reuse …
11. **fix [low/technical]** Confirm the hreflang cluster is reciprocal. The homepage declares 50+ hreflang entries. hreflang only works when each target page links back to the others; a one-way cluster is ignored. Spot-check a sample of the declared locales (e.g. /de/, /jp/, /br/) and confirm each returns a reciprocal hreflang set that includes en-US and itself. Fix any locale that does not point back to https://www.apple.com/.

Removed by the checker (1): "The page is heavily JavaScript-dependent: a raw re" (the gap is moderate (926 of 1511 words are in the )
Added by the checker: none

## Reviewer verdict

Lead review.
Measurements: **visible words 1510 (scanner) vs 893 (innerText)** = **A-09** (hidden text counted). Everything else matches.
Findings:
1,4. INACCURATE (**A-08**): all 42 are alt="" (decorative, valid); 0 lack the attribute; reported as CRITICAL and high priority "no alt attribute".
2. SUBJECTIVE (**A-13**; no FAQ/how-it-works section on a product marketing page called critical). 3. ACCURATE but not critical (llms.txt).
5. SUBJECTIVE. 6. ACCURATE. 7. MISLEADING-ish: raw 926 vs 1,511 words; the 1,511 includes hidden text (**A-09**), so the gap is overstated (real gap smaller).
8. UNSUPPORTED/odd ("pricing section true but prices empty" is expected for a brand page). 9,10,11. ACCURATE/SUBJECTIVE.

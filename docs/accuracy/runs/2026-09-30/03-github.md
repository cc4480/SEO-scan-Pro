# 03-github — https://github.com

*marketing, SSR + JS.* Heavy marketing page with many images and videos.

Scan: 26.6s · scoreMethod **measured** · scores {"overall":89,"technical":94,"content":90,"aeoGeo":80,"performance":90} · simulated: false · AI used: true

## Measurements vs independent ground truth

| Fact | Scanner | Ground truth | |
|---|---|---|---|
| title | "GitHub · Change is constant. GitHub keeps you ahe | "GitHub · Change is constant. GitHub keeps you ahe | ok |
| meta description present | true | true | ok |
| canonical | https://github.com | https://github.com | ok |
| viewport present | true | true | ok |
| html lang | en | en | ok |
| H1 count | 1 | 1 | ok |
| H2 count | 10 | 10 | ok |
| images (with src) | 24 | 24 <br><sub>DOM has 24 <img>, 24 with a source</sub> | ok |
| images missing/empty alt | 17 | 17 <br><sub>no alt attr 0, empty alt 17</sub> | ok |
| links (scanner total vs real+hash anchors) | 138 | 135+8 hash | ok |
| JSON-LD types | 0 | 0 | ok |
| visible words (rendered) | 1127 | 878 <br><sub>innerText vs markup count differ for hidden text; tolerance 30%</sub> | ok |
| hreflang present | true | true | ok |
| raw words (no JS) | 1080 | 811 <br><sub>ground truth = real load with JavaScript disabled</sub> | ok |
| raw links (no JS) | 135 | 135 | ok |
| rendered words (facts) | 1138 | 878 | ok |
| robots.txt blocks all | false | false | ok |
| sitemap found | false | false <br><sub>sitemap.xml HTTP 406, robots directive no</sub> | ok |
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

1. **critical** No JSON-LD structured data on the homepage: structuredData.hasJsonLd is false and structuredData.types is empty, so search engines and AI answer engines receive no machine-readable entity graph for GitHub.
2. **critical** 17 of 24 images on the page are missing alt text (missingAltCount: 17), which degrades accessibility and removes image-level context that AI retrieval systems can index.
3. **critical** Meta description is truncated to 'Join the world' — far below the 120–160 character range that Google and AI answer engines typically surface, weakening click-through and snippet quality.
4. **critical** Title tag is 61 characters and ends with a redundant '· GitHub' suffix after the brand name already appears at the start, wasting SERP pixel width.
5. **critical** The homepage has no FAQPage or HowTo structured data despite visibleSections.faq being true, so the on-page FAQ content is not exposed as a machine-readable Q&A pair.
6. **fix [high/aeo-geo]** Add Organization and WebSite JSON-LD to the homepage. The crawl confirms structuredData.hasJsonLd is false and structuredData.types is empty. GitHub's homepage therefore exposes no entity graph to Google, Gemini, ChatGPT Search or Perplexity, which rely on schema to disambiguate the brand, its logo, its social profiles and its site search endpoint. Inject a single <script type="application/ld+json"> block in the <hea…
7. **fix [high/aeo-geo]** Add SoftwareApplication JSON-LD for the GitHub platform. The page markets GitHub as a developer platform with Copilot, Actions, Codespaces and security features, but carries no SoftwareApplication entity. AI answer engines cannot reliably map the page to a product entity without it. Add a SoftwareApplication node to the same @graph with name 'GitHub', applicationCategory 'DeveloperApplication', operatingSystem 'Web, …
8. **fix [high/content]** Fix alt text on the 17 images missing it. missingAltCount is 17 out of 24 images. Decorative images legitimately carry empty alt text, but 17 missing attributes is too high to be explained by decoration alone and represents a real accessibility and content-context gap. Audit all 24 <img> elements. For each image that conveys meaning (product screenshots, customer logos, Copilot UI, security diagrams), write a concise…
9. **fix [high/content]** Rewrite the meta description to a full-length snippet. The current meta description is 'Join the world' — roughly 13 characters. This gives Google and AI answer engines almost nothing to quote and suppresses click-through from search results. Replace with a 140–155 character description that names the product, the audience and the primary value proposition, e.g. 'GitHub is where over 100 million developers build, shi…
10. **fix [medium/content]** Tighten the title tag. The title is 'GitHub · Change is constant. GitHub keeps you ahead. · GitHub' — 61 characters with the brand repeated twice, which wastes SERP width and reads awkwardly. Reduce to a single brand mention and lead with the primary keyword, e.g. 'GitHub: Build, Ship and Secure Software Together' (49 characters) or 'GitHub — The Developer Platform for Modern Software Teams'. Keep it under 60 charact…
11. **fix [medium/aeo-geo]** Expose the FAQ answers as plain HTML, not JS-only. rawHtmlVsRendered shows rawWords 1080 versus renderedWords 1138 and rawLinks 135 versus renderedLinks 135, so the delta is small and the page is largely server-rendered. However, any FAQ or feature content that only appears after hydration is commonly reported to be invisible to AI retrieval crawlers, which typically do not execute JavaScript. Confirm that the FAQ qu…
12. **fix [low/aeo-geo]** Add BreadcrumbList JSON-LD if subpages are added. The crawl is a single-page sample (additionalPagesSummary is empty), so no breadcrumb trail exists yet. This is a forward-looking recommendation for when the site expands beyond the homepage. When subpages are introduced, add BreadcrumbList JSON-LD to each page reflecting the real URL hierarchy. Do not add it to the homepage, where it would be meaningless.
13. **fix [low/technical]** Keep the existing security header posture. securityHeaders shows https, hsts, csp, xFrameOptions, xContentTypeOptions and referrerPolicy all true. This is already best-in-class and should not be regressed. Add a regression test or CI check that asserts the presence of Strict-Transport-Security, Content-Security-Policy, X-Frame-Options, X-Content-Type-Options and Referrer-Policy on the production homepage response.
14. **fix [low/technical]** Preserve the current hreflang implementation. hreflang is present for 26 locales including x-default, which is correct for a multi-region site. No change is needed, but the implementation should be protected. Add a CI assertion that every locale in the hreflang set resolves to a 200 and that x-default remains present. Do not remove or consolidate the regional Spanish variants (es-AR through es-VE) unless the business…

Removed by the checker (1): "Add FAQPage JSON-LD for the on-page FAQ section" (the page already has a faq section)
Added by the checker: none

## Reviewer verdict

Lead review.
Measurements: all match except the **meta description text**: scanner "Join the world", truth "Join the world's most widely adopted, AI-powered developer platform..." = scanner bug **A-14** (apostrophe truncates the attribute).
Findings:
1. ACCURATE (no JSON-LD). 2. INACCURATE (**A-08**): all 17 are alt="" (decorative, valid); 0 images lack the attribute; reported as CRITICAL.
3. INACCURATE (**A-14**): "description truncated to 'Join the world'" is the parser's own truncation. 9. INACCURATE (same root cause), advice to rewrite a fine description.
4,10. SUBJECTIVE (title ends with a brand suffix; critical severity is **A-13**).
5. ACCURATE but low value (FAQ visible, no FAQPage; the model correctly notes FAQ rich results are gone). 6,7. SUBJECTIVE (reasonable). 8. INACCURATE (**A-08**).
11,12,13,14. ACCURATE.

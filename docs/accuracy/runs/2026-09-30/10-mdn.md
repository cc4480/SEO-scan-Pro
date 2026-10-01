# 10-mdn — https://developer.mozilla.org/en-US/

*documentation hub.* Locale paths, hreflang, structured content.

Scan: 24.5s · scoreMethod **measured** · scores {"overall":93,"technical":100,"content":100,"aeoGeo":72,"performance":100} · simulated: false · AI used: true

## Measurements vs independent ground truth

| Fact | Scanner | Ground truth | |
|---|---|---|---|
| title | "MDN Web Docs" | "MDN Web Docs" | ok |
| meta description present | true | true | ok |
| canonical | https://developer.mozilla.org/en-US/ | https://developer.mozilla.org/en-US/ | ok |
| viewport present | true | true | ok |
| html lang | en-US | en-US | ok |
| H1 count | 1 | 1 | ok |
| H2 count | 4 | 4 | ok |
| images (with src) | 1 | 1 <br><sub>DOM has 1 <img>, 1 with a source</sub> | ok |
| images missing/empty alt | 0 | 0 <br><sub>no alt attr 0, empty alt 0</sub> | ok |
| links (scanner total vs real+hash anchors) | 158 | 158+2 hash | ok |
| JSON-LD types | 0 | 0 | ok |
| visible words (rendered) | 872 | 844 <br><sub>innerText vs markup count differ for hidden text; tolerance 30%</sub> | ok |
| hreflang present | false | false | ok |
| raw words (no JS) | 901 | 834 <br><sub>ground truth = real load with JavaScript disabled</sub> | ok |
| raw links (no JS) | 169 | 158 | ok |
| rendered words (facts) | 875 | 844 | ok |
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

1. **critical** No JSON-LD structured data is present on the homepage: structuredData.hasJsonLd is false and structuredData.types is empty, and structuredDataEntities is empty. The page therefore gives search engines and AI answer engines no explicit entity graph (Organization, WebSite, Article, BreadcrumbList, etc.) to parse.
2. **critical** No llms.txt file is published (llmsTxtFound = false), so AI agents and retrieval systems have no curated, machine-readable map of MDN's most authoritative documentation surfaces.
3. **critical** The homepage's visible sections do not include a FAQ or pricing block (visibleSections.faq = false, visibleSections.pricing = false), and no direct-answer Q&A content is exposed, which limits the page's eligibility for answer-engine citation on 'what is MDN' style queries.
4. **fix [high/aeo-geo]** Add JSON-LD structured data to the homepage. structuredData.hasJsonLd is false and structuredData.types is empty on https://developer.mozilla.org/en-US/. The page has a clear H1 ('Resources for Developers, by Developers'), a title ('MDN Web Docs'), a meta description, an og:image and a Twitter summary card, but none of this is expressed as machine-readable entities. Without JSON-LD, Google, Gemini, ChatGPT Search and…
5. **fix [medium/aeo-geo]** Publish an llms.txt file at the site root. llmsTxtFound is false. MDN is one of the most-cited technical documentation sources on the web, yet it provides no llms.txt manifest to guide AI agents toward its canonical, highest-value documentation trees. Create https://developer.mozilla.org/llms.txt (plain text, served with Content-Type text/plain) containing: an H1 with the site name, a one-paragraph summary of what MD…
6. **fix [medium/content]** Add a concise FAQ / direct-answer block to the homepage. visibleSections.faq is false. The homepage explains MDN only through the meta description and the H1; there is no question-and-answer block that answer engines can lift verbatim. The word count is 872, which is ample room for a short FAQ without harming the page. Add a visible 'Frequently asked questions' section near the bottom of the homepage with 4–6 questio…
7. **fix [medium/technical]** Declare Open Graph type and upgrade the Twitter card. social.ogType is an empty string and social.twitterCard is 'summary' while an og:image is present. A 'summary' card renders a small square thumbnail and discards much of the value of the existing social image; a missing og:type weakens the entity signal for social and AI previews. Set <meta property="og:type" content="website"> on the homepage (and 'article' on do…
8. **fix [low/technical]** Reduce the raw-HTML vs rendered-DOM delta. rawHtmlVsRendered shows rawWords 901 vs renderedWords 875 and rawLinks 169 vs renderedLinks 158. The delta is small, but it means a non-JavaScript retrieval crawler sees a slightly larger link set and word count than a browser. schemaOnlyAfterJs is empty, so no schema is hidden behind JavaScript — this is a hygiene item, not a defect. Identify the 11 links present in raw HTM…
9. **fix [low/technical]** Keep the current security and crawler posture intact. All measured security headers are present (https, hsts, csp, xFrameOptions, xContentTypeOptions, referrerPolicy all true), robotsBlocksAll is false, and every tested AI crawler — training, search and assistant roles — returns HTTP 200 with robotsTxtAllows true. This is a best-in-class configuration and should not be regressed. Add a regression test or CI check tha…

Removed by the checker (2): "Add hreflang only if MDN ships localized variants" (no alternate-language versions were found, so href); "The raw HTML contains 169 links but the rendered D" (the gap is moderate (901 of 875 words are in the r)
Added by the checker: none

## Reviewer verdict

Reviewer R1 (2026-09-30). Counts: ACCURATE 3, INACCURATE 0, MISLEADING 3, UNSUPPORTED 0, SUBJECTIVE 3.

Summary: core facts are right (no JSON-LD: 0 `ld+json` in the raw HTML; llms.txt 404 HTML; all 5 security headers and all crawlers fine). Problems: a wrong "single-language" premise, a mis-explained link delta, and social-card advice that does not fit MDN's square logo.

Measurement notes:
- Raw links 169 (scanner, regex over the HTML source) vs 158 (ground JS-off DOM): I reproduced this. The 11 extra anchors are the language-switcher links (`/de/ /es/ /fr/ /ja/ /ko/ /pt-BR/ /ru/ /zh-CN/ /zh-TW/`) plus one GitHub discussion link and one duplicate `/en-US/`, which sit inside Lit web-component `<template>` markup and never become DOM anchors. So the regex over-counts and the "raw has more links than a browser" signal is not a real crawler difference (A-10). Raw words 901 vs 834/844 is the usual markup-vs-visible text gap (A-09).
- Ground `og` values are empty while the page has `<meta name="og:title|description|image">`: MDN uses `name=` rather than `property=`; ground reads only `property`. Ground-tool defect (scanner is right to read them). The page has no `og:type` at all (scanner correct).
- hreflang false is correct for the homepage HTML (no `hreflang` string in the source).

1. ACCURATE: no JSON-LD anywhere in the page (verified). Critical is inflated for a docs hub (A-13).
2. ACCURATE: /llms.txt returns 404 with HTML (verified). Real but "critical" is inflated: llms.txt is an unproven convention (A-13).
3. MISLEADING: no FAQ is true, but "pricing block" is irrelevant for MDN (free docs hub), and rated critical it overstates a nice-to-have. Facts partly right, framing wrong.
4. SUBJECTIVE: JSON-LD advice is reasonable; some content is odd (a BreadcrumbList for the root, a logo "pointing at the social image", which is a 1024x1024 MDN mark). "Search engines and AI must infer identity from prose alone" overstates.
5. SUBJECTIVE: the fact is correct; "one of the most-cited technical documentation sources" is an unsupported assertion; value of llms.txt is debatable.
6. SUBJECTIVE: FAQ block on a docs hub homepage is a judgement call; 872 words is the over-count (about 840 visible), fine for the argument.
7. MISLEADING: og:type missing and twitter:card=summary are true, but the shared image is 1024x1024 (`og:image:width/height` in the page), exactly what the `summary` card is for; switching to `summary_large_image` and a 1200x630 image would crop or distort it. Also notes it should be `og:type=article` on doc pages, which is off-scope.
8. MISLEADING: the 11 links are the locale picker and one GitHub link in web-component templates, not "conditionally hidden navigation or tracking links"; there is no real raw-vs-rendered difference, and "remove them from server output" would delete the language picker.
9. ACCURATE: all 5 headers present (ground agrees), crawlers 200, robots OK (`Disallow: /api/ /*/files/ /media` only).

Executive summary error (not a numbered finding): "no hreflang is declared (acceptable for a single-language page)". MDN is multilingual (9-locale switcher in the homepage markup; `/de/` returns 200). The checker also removed "Add hreflang only if MDN ships localized variants" with the reason "no alternate-language versions were found", which is untrue for MDN: a correct suggestion was suppressed.

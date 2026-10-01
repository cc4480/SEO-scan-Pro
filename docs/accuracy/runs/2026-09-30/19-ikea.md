# 19-ikea — https://www.ikea.com/us/en/

*e-commerce, multilingual.* Locale path, hreflang, lazy images.

Scan: 39.8s · scoreMethod **measured** · scores {"overall":93,"technical":98,"content":94,"aeoGeo":92,"performance":85} · simulated: false · AI used: true

## Measurements vs independent ground truth

| Fact | Scanner | Ground truth | |
|---|---|---|---|
| title | "Shop Affordable Home Furnishings & Home Goods - I | "Shop Affordable Home Furnishings & Home Goods - I | ok |
| meta description present | true | true | ok |
| canonical | https://www.ikea.com/us/en/ | https://www.ikea.com/us/en/ | ok |
| viewport present | true | true | ok |
| html lang | en-US | en-US | ok |
| H1 count | 1 | 1 | ok |
| H2 count | 16 | 15 | ok |
| images (with src) | 145 | 145 <br><sub>DOM has 145 <img>, 145 with a source</sub> | ok |
| images missing/empty alt | 41 | 41 <br><sub>no alt attr 1, empty alt 40</sub> | ok |
| links (scanner total vs real+hash anchors) | 217 | 217+14 hash | ok |
| JSON-LD types | 8 | 8 | ok |
| visible words (rendered) | 2323 | 2173 <br><sub>innerText vs markup count differ for hidden text; tolerance 30%</sub> | ok |
| hreflang present | false | false | ok |
| raw words (no JS) | 1564 | 1445 <br><sub>ground truth = real load with JavaScript disabled</sub> | ok |
| raw links (no JS) | 185 | 185 | ok |
| rendered words (facts) | 2332 | 2173 | ok |
| robots.txt blocks all | false | false | ok |
| sitemap found | true | true <br><sub>sitemap.xml HTTP 404, robots directive yes</sub> | ok |
| llms.txt found | false | false <br><sub>llms.txt HTTP 404</sub> | ok |
| header hsts | true | true | ok |
| header csp | true | true | ok |
| header xFrameOptions | true | true | ok |
| header xContentTypeOptions | true | true | ok |
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

1. **critical** 41 of 145 images on the homepage (28%) are missing the alt attribute, per the crawl's missingAltCount. This is an accessibility defect and removes image context that AI answer engines and image search rely on.
2. **critical** 14 navigation controls are implemented as buttons rather than anchor elements (navButtons: 14 vs navAnchors: 56). Button-based navigation is invisible to crawlers that parse raw HTML, weakening internal link discovery for the primary menu.
3. **critical** No llms.txt file is present (llmsTxtFound: false), so AI agents have no curated, machine-readable map of the site's canonical content and policies.
4. **fix [high/content]** Add alt attributes to the 41 images missing them. The crawl found 145 images on the homepage and 41 with no alt attribute (missingAltCount: 41). Missing alt text degrades screen-reader accessibility and strips context that image search and multimodal AI answer engines use to understand product imagery. For each of the 41 images flagged without an alt attribute, add an alt attribute. Product and editorial images shoul…
5. **fix [medium/technical]** Server-render primary homepage content and navigation. Raw HTML returns 1,564 words and 185 links; the rendered DOM returns 2,332 words and 217 links. Roughly 768 words and 32 links are injected by JavaScript, and 14 navigation controls are buttons rather than anchors. AI retrieval crawlers are commonly reported not to execute JavaScript, so this content may not reach them. Move the primary hero content, category nav…
   - ⚠ quotes 768 words; measured values are 2173 rendered / 1445 no-JS
6. **fix [medium/aeo-geo]** Publish an llms.txt file. llmsTxtFound is false. An llms.txt gives AI agents a curated, low-noise index of the site's most important pages, policies and product categories, improving how assistants cite and route users to IKEA content. Create /llms.txt at the domain root. Include a short site description, then a markdown list of canonical URLs: top category pages, the IKEA Family and IKEA Business Network pages, retu…
7. **fix [low/technical]** Add Twitter card metadata. The social payload shows a populated ogTitle, ogDescription and ogImage, but twitterCard is an empty string. Without a Twitter card declaration, X/Twitter falls back to generic link rendering and loses the controlled preview already defined in Open Graph. Add a twitter:card meta tag (summary_large_image) plus twitter:title, twitter:description and twitter:image mirroring the existing ogTitl…
8. **fix [low/technical]** Add a Referrer-Policy header. securityHeaders shows https, hsts, csp, xFrameOptions and xContentTypeOptions all true, but referrerPolicy is false. This is a hardening gap, not a ranking factor. Set a Referrer-Policy response header, for example strict-origin-when-cross-origin, at the CDN or origin. Confirm the header appears on the homepage response and does not break existing analytics or affiliate referral flows.
9. **fix [medium/aeo-geo]** Add FAQPage markup to the existing FAQ content. visibleSections shows faq: true, so the page already contains FAQ content, but no FAQPage type appears in structuredData.types. FAQPage markup remains valid for machine understanding even though Google no longer shows FAQ rich results. Wrap the existing on-page FAQ question-and-answer pairs in FAQPage JSON-LD with Question and acceptedAnswer entities, using the exact vi…
10. **fix [medium/performance]** Reduce transfer-bound load time. Lab measurement from the auditing host shows loadTimeMs 1,749 with ttfbMs 239, meaning about 86% of load time is network and transfer, not front-end execution. Page size is 1,962.8 KB. This is a host-measured lab figure, not field Core Web Vitals, and may reflect distance between the auditing host and IKEA's edge. Confirm real-user performance with field data before making structural …

Removed by the checker (3): "Strengthen entity markup for the store and organiz" (it suggests a price (1) the site does not show; pr); "Add hreflang only if regional variants are deploye" (no alternate-language versions were found, so href); "The homepage is JavaScript-dependent: raw HTML con" (the gap is moderate (1564 of 2332 words are in the)
Added by the checker: none

## Reviewer verdict

Counts: ACCURATE 3, INACCURATE 4, MISLEADING 2, UNSUPPORTED 0, SUBJECTIVE 1.

**Mismatches explained (live: puppeteer 1366x900, curl).** All measurements agree within tolerance; no challenge or variant. H2 16 vs 15: the scanner's list includes the duplicated "Furniture and inspiration..." heading and "Footer" (a hidden duplicate); trivial. Words 2,323 vs 2,173 and raw 1,564 vs 1,445: small A-09/A-10 overcount (~7%). Images 145/145, alt: 41 = 1 no attribute + 40 `alt=""`; I inspected them: the empties are category and logo images inside links that already carry the text label ("Sofas & armchairs", "IKEA Home"...), the correct pattern; the single no-attribute `<img>` is `style="display:none" aria-hidden="true"` (a preload). `hreflang` none, twitter:card none (confirmed). Nav buttons: 10 at desktop (Search, Open navigation menu, Cookie settings, USEnglish, store selector), 14 at the scanner's width.

1. INACCURATE: "41 of 145 missing the alt attribute" is wrong, 1 lacks it (hidden, aria-hidden), 40 are decorative `alt=""` inside labelled links (A-08); not an accessibility defect.
2. INACCURATE: the 14 buttons are search, menu toggle, cookie and locale controls, not navigation destinations; the raw HTML already has 185 links, so "invisible to crawlers" is false (R3-04).
3. SUBJECTIVE: llms.txt is 404 (true) but an optional, unproven convention; "critical" is not reasonable (A-13).
4. INACCURATE: same as 1; the remediation would add alt text to decorative images that are already correct.
5. MISLEADING: the numbers (1,564/2,332 words, 185/217 links, ~768 words, 32 links) are as measured and the medium rating is fair, but the "14 navigation controls are buttons" clause is the false R3-04 heuristic and the word figures include hidden text.
6. ACCURATE: `/llms.txt` 404 for a browser UA; advice generic but harmless.
7. ACCURATE: no `twitter:*` meta tags on the live page; og tags present.
8. ACCURATE: no Referrer-Policy on the GET response; the rest of the security headers present.
9. INACCURATE: the "FAQ" signal comes from a footer link to another page (`<a>FAQ</a>`), the homepage has no FAQ content to mark up (A-05); FAQPage markup would be invalid without visible Q&A.
10. MISLEADING: 1,749 ms load / 239 ms TTFB is a good result; "86% is network and transfer" is an inference from `1 - ttfb/load` (load also includes parsing, script and images) and 1,962.8 KB is the serialized DOM, not transfer (R3-08); the "host-measured" hedge does not cure the implied problem.

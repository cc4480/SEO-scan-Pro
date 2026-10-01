# 14-gov-uk — https://www.gov.uk

*government, minimal.* Lean, accessible markup; very few images.

Scan: 29.2s · scoreMethod **measured** · scores {"overall":84,"technical":100,"content":90,"aeoGeo":72,"performance":65} · simulated: false · AI used: true

## Measurements vs independent ground truth

| Fact | Scanner | Ground truth | |
|---|---|---|---|
| title | "Welcome to GOV.UK" | "Welcome to GOV.UK" | ok |
| meta description present | true | true | ok |
| canonical | https://www.gov.uk/ | https://www.gov.uk/ | ok |
| viewport present | true | true | ok |
| html lang | en | en | ok |
| H1 count | 1 | 1 | ok |
| H2 count | 13 | 13 | ok |
| images (with src) | 4 | 4 <br><sub>DOM has 4 <img>, 4 with a source</sub> | ok |
| images missing/empty alt | 4 | 4 <br><sub>no alt attr 0, empty alt 4</sub> | ok |
| links (scanner total vs real+hash anchors) | 106 | 106+1 hash | ok |
| JSON-LD types | 0 | 0 | ok |
| visible words (rendered) | 852 | 582 <br><sub>innerText vs markup count differ for hidden text; tolerance 30%</sub> | **MISMATCH** |
| hreflang present | false | false | ok |
| raw words (no JS) | 806 | 536 <br><sub>ground truth = real load with JavaScript disabled</sub> | ok |
| raw links (no JS) | 106 | 106 | ok |
| rendered words (facts) | 855 | 582 | **MISMATCH** |
| robots.txt blocks all | false | true | **MISMATCH** |
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

1. **critical** No structured data of any type is present: structuredData.hasJsonLd is false and structuredData.types is empty, confirmed by rawHtmlVsRendered (rawSchemaTypes and renderedSchemaTypes both empty, schemaOnlyAfterJs empty). The page is invisible to schema-driven entity extraction.
2. **critical** All 4 images on the page are missing alt text (imagesCount: 4, missingAltCount: 4), an accessibility and content-comprehension failure that also removes image context from AI retrieval.
3. **critical** No llms.txt file was found (llmsTxtFound: false), so AI agents have no curated machine-readable map of the site's key content.
4. **critical** Open Graph and Twitter Card metadata are empty (social.ogTitle, ogDescription, ogType, twitterCard all blank), so link previews and social/AI citation cards render without title or description context.
5. **critical** Lab-measured CLS is 0.439 (webVitals.cls), well above the 0.1 'good' threshold; this is an auditing-host lab value, not field data, but it warrants investigation of layout-shift sources.
6. **critical** No FAQ section is present (visibleSections.faq: false), removing a high-value direct-answer surface for AI Overviews, ChatGPT Search and Perplexity.
7. **fix [medium/aeo-geo]** Add JSON-LD structured data to the homepage. The page returns zero JSON-LD (structuredData.hasJsonLd: false, structuredData.types: []), and the rendered-DOM comparison confirms no schema is injected by JavaScript. Search engines and AI answer engines therefore have no explicit entity graph to anchor the page to. Add a single <script type="application/ld+json"> block in the <head> (or before </body>) containing an @gr…
8. **fix [high/aeo-geo]** Publish an llms.txt file at the site root. llmsTxtFound is false. AI agents (ChatGPT Search, Perplexity, Claude) have no curated, machine-readable index of the site's most important pages and their purpose. Create /llms.txt at the domain root: a Markdown file with an H1 site name, a one-paragraph description, and a bulleted list of the highest-value sections (services and information, government activity, popular pag…
9. **fix [high/content]** Add descriptive alt text to all images. All 4 images on the page have empty alt attributes (imagesCount: 4, missingAltCount: 4). Screen readers and AI image understanding lose all context, and the images contribute nothing to topical relevance. For each of the 4 <img> elements, add an alt attribute that describes the image's purpose in the page context (e.g. the GOV.UK crown logo, the Open Graph preview image). If an…
10. **fix [high/technical]** Complete Open Graph and Twitter Card metadata. social.ogTitle, ogDescription, ogType and twitterCard are all empty; only ogImage is populated. Shared links and AI citation cards have no title or description to render. Add to the <head>: <meta property="og:title"> matching the page title, <meta property="og:description"> matching the meta description, <meta property="og:type" content="website">, <meta property="og:url…
11. **fix [high/performance]** Investigate and reduce layout shift (CLS 0.439 lab). Lab-measured CLS is 0.439, far above the 0.1 'good' threshold. This is an auditing-host lab measurement, not real-user field data, but the magnitude justifies a check of shift sources. Audit the homepage in Chrome DevTools Performance and Layout Instability panels: reserve explicit width/height (or aspect-ratio) on the 4 images, set font-display and preload the pri…
12. **fix [medium/aeo-geo]** Add a FAQ section with FAQPage markup. visibleSections.faq is false. The page has no question-and-answer block, which is the format AI answer engines most readily quote for direct answers. Add a short FAQ block to the homepage covering the highest-intent questions users ask about government services (e.g. how to find a service, how to check eligibility, where to get cost-of-living support). Mark it up with FAQPage JS…
13. **fix [medium/content]** Strengthen the meta description and title for query intent. The title ("Welcome to GOV.UK") and description ("GOV.UK - The best place to find government services and information.") are brand-led and generic; they do not surface the service categories the page actually lists in its H3s (Benefits, Visas and immigration, Money and tax, etc.). Rewrite the title to lead with the user task, e.g. "GOV.UK: Government Service…
14. **fix [medium/technical]** Expose navigation as crawlable anchors. rawHtmlVsRendered reports navButtons: 4 alongside navAnchors: 59. Any navigation control implemented as a button rather than an <a href> is invisible to crawlers and AI retrieval agents. Audit the 4 nav buttons and convert any that lead to a URL into real <a href> elements (styled as buttons if needed). Keep <button> only for controls that trigger in-page behaviour (e.g. openin…
15. **fix [medium/aeo-geo]** Add WebSite SearchAction and breadcrumb signals. The page has a Search H3 and a search surface, but no structured data declares a search entry point, and no breadcrumb markup is present (structuredData.types is empty). Include a SearchAction in the WebSite JSON-LD pointing at the site's search URL template (e.g. https://www.gov.uk/search?q={search_term_string}). On subpages, add BreadcrumbList JSON-LD matching the vi…
16. **fix [low/performance]** Reduce TTFB measurement noise and confirm origin latency. loadTimeMs is 1456ms and ttfbMs is 1140ms — roughly 78% of load time is time-to-first-byte. This is a network-bound measurement from the auditing host, not evidence of front-end slowness, but origin latency should be confirmed from a representative location. Re-run the crawl from a host geographically close to the primary audience, and compare TTFB against a C…

Removed by the checker (1): "Add hreflang only if the site serves multiple lang" (no alternate-language versions were found, so href)
Added by the checker: none

## Reviewer verdict

_to be completed by a human reviewer_

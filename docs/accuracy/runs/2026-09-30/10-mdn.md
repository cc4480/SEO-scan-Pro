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

_to be completed by a human reviewer_

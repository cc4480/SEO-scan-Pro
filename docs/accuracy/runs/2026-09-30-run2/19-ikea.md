# 19-ikea — https://www.ikea.com/us/en/

*e-commerce, multilingual.* Locale path, hreflang, lazy images.

Scan: 35.8s · scoreMethod **measured** · scores {"overall":93,"technical":98,"content":100,"aeoGeo":92,"performance":80} · simulated: false · AI used: true

## Measurements vs independent ground truth

| Fact | Scanner | Ground truth | |
|---|---|---|---|
| title | "Shop Affordable Home Furnishings & Home Goods - I | "Shop Affordable Home Furnishings & Home Goods - I | ok |
| meta description present | true | true | ok |
| canonical | https://www.ikea.com/us/en/ | https://www.ikea.com/us/en/ | ok |
| viewport present | true | true | ok |
| html lang | en-US | en-US | ok |
| H1 count | 1 | 1 | ok |
| H2 count | 15 | 15 | ok |
| images (with src) | 145 | 145 <br><sub>DOM has 145 <img>, 145 with a source</sub> | ok |
| images missing/empty alt | 1 | 41 <br><sub>no alt attr 1, empty alt 40</sub> | **MISMATCH** |
| links (scanner total vs real+hash anchors) | 216 | 216+14 hash | ok |
| JSON-LD types | 8 | 8 | ok |
| visible words (rendered) | 2173 | 2173 <br><sub>innerText vs markup count differ for hidden text; tolerance 30%</sub> | ok |
| hreflang present | false | false | ok |
| raw words (no JS) | 1627 | 1523 <br><sub>ground truth = real load with JavaScript disabled</sub> | ok |
| raw links (no JS) | 188 | 188 | ok |
| rendered words (facts) | 2173 | 2173 | ok |
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

1. **fix [medium/technical]** Add the missing image alt attribute. One image on the homepage has no alt attribute at all (the payload reports 1 image missing alt). Forty images correctly use empty alt text for decorative purposes, which is valid and needs no change. The single missing attribute is an accessibility and content-understanding gap, not a ranking failure. Locate the image element that has no alt attribute (the tracking pixel and the I…
2. **fix [low/technical]** Add a referrer-policy security header. The crawl confirms HTTPS, HSTS, CSP, X-Frame-Options and X-Content-Type-Options are all present, but no Referrer-Policy header was observed. This is a hardening improvement rather than a ranking issue. Configure the web server or CDN to send a Referrer-Policy header, for example 'strict-origin-when-cross-origin', on all responses. Verify with a header-check tool after deployment…
3. **fix [medium/performance]** Reduce homepage page weight and request count. The homepage transfers approximately 5,991 KB across 542 requests. TTFB (292 ms) and LCP (836 ms) are already fast in this lab measurement, so the site is not currently failing Core Web Vitals, but the request volume and transfer size are high and can hurt real-world mobile users on slower connections. Audit the 542 requests for third-party scripts, tracking pixels and u…
4. **fix [medium/aeo-geo]** Add a direct answer or summary near the top of the homepage. The first visible text on the page is a long list of product categories ('Skip product categories list Deals Storage & organization Sofas & armchairs...'). There is no concise, self-contained sentence that defines what IKEA USA offers, which makes it harder for AI assistants and featured-snippet systems to extract a clean answer. Add a short introductory pa…
5. **fix [low/aeo-geo]** Consider adding an llms.txt file. The crawl did not find an llms.txt file. This is an optional, emerging convention; no major search engine or AI assistant has confirmed that it reads llms.txt, so this is a low-priority, experimental improvement with no guaranteed retrieval or citation benefit. Note: llms.txt is optional and not yet confirmed to be read by the major search engines or assistants, so treat it as low pr…
6. **fix [low/content]** Improve social sharing metadata coverage. Open Graph title, description, image and type are present, but no Twitter card value was detected. This affects how the page renders when shared on X/Twitter and some messaging apps. Add a twitter:card meta tag (for example 'summary_large_image') plus twitter:title, twitter:description and twitter:image mirroring the Open Graph values. Verify with a social preview debugger.
7. **fix [low/content]** Expand the thin visible word count with supporting content. The rendered page contains approximately 2,173 words, most of which are product names and navigation labels. There is little explanatory prose that search engines and AI systems can use to understand the brand's services, delivery, sustainability or support offerings beyond the headings. Add short, useful content blocks (two to four sentences each) summarisi…

Removed by the checker (2): "Declare language and region versions with hreflang" (no alternate-language versions were found, so href); "Strengthen structured data with product and offer " (it suggests a price (1) the site does not show; pr)
Added by the checker: none

## Reviewer verdict

_to be completed by a human reviewer_

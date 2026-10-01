# 01-example — https://example.com

*tiny static page.* Smallest possible page; letter-by-letter markup; no JSON-LD.

Scan: 23.1s · scoreMethod **measured** · scores {"overall":54,"technical":78,"content":36,"aeoGeo":66,"performance":27} · simulated: false · AI used: true

## Measurements vs independent ground truth

| Fact | Scanner | Ground truth | |
|---|---|---|---|
| title | "Example Domain" | "Example Domain" | ok |
| meta description present | false | false | ok |
| canonical | - | - | ok |
| viewport present | true | true | ok |
| html lang | en | en | ok |
| H1 count | 0 | 0 | ok |
| H2 count | 0 | 0 | ok |
| images (with src) | 0 | 0 <br><sub>DOM has 0 <img>, 0 with a source</sub> | ok |
| images missing/empty alt | 0 | 0 <br><sub>no alt attr 0, empty alt 0</sub> | ok |
| links (scanner total vs real+hash anchors) | 1 | 1+0 hash | ok |
| JSON-LD types | 0 | 0 | ok |
| visible words (rendered) | 133 | 133 <br><sub>innerText vs markup count differ for hidden text; tolerance 30%</sub> | ok |
| hreflang present | false | false | ok |
| raw words (no JS) | 27 | 27 <br><sub>ground truth = real load with JavaScript disabled</sub> | ok |
| raw links (no JS) | 1 | 1 | ok |
| rendered words (facts) | 133 | 133 | ok |
| robots.txt blocks all | false | false | ok |
| sitemap found | false | false <br><sub>sitemap.xml HTTP 404, robots directive no</sub> | ok |
| llms.txt found | false | false <br><sub>llms.txt HTTP 404 (HTML, not a real llms.txt)</sub> | ok |
| header hsts | false | false | ok |
| header csp | false | false | ok |
| header xFrameOptions | false | false | ok |
| header xContentTypeOptions | false | false | ok |
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

1. **critical** The page has no H1 heading at all — the crawled heading set is empty for H1, H2 and H3. A page without a primary heading gives search engines and AI answer engines no declared subject, which is a foundational content defect.
2. **critical** The page title is 'Example Domain' — a placeholder string, not a descriptive title. Combined with the absence of an H1, the page has no machine-readable statement of what it is about.
3. **fix [high/content]** Add a single descriptive H1 and a supporting heading hierarchy. The crawled page contains no H1, H2 or H3 elements. The visible text is a multilingual notice that the domain is for documentation examples, but no heading declares that subject to crawlers or AI retrieval systems. In the page template, add one H1 that states the page's actual purpose in plain language (for example, 'Example Domain — reserved for documen…
4. **fix [high/content]** Replace the placeholder title and add a meta description. The title tag reads 'Example Domain' and the meta description field is empty. Neither communicates the page's subject to search result snippets or to AI answer engines that read the head of the document. Set a unique, descriptive title of roughly 50–60 characters that names the page and the site. Add a meta description of roughly 140–160 characters that summar…
5. **fix [medium/technical]** Add a self-referencing canonical URL. No canonical link element was found on the page. Without one, search engines must infer the preferred URL from other signals. Add a self-referencing canonical link in the document head pointing to the exact preferred URL of this page, including the HTTPS scheme and the trailing-slash form you intend to serve.
6. **fix [medium/content]** Add Open Graph and Twitter card metadata. Open Graph title, description, image and type are all empty, and no Twitter card type is set. When the URL is shared in chat apps, social platforms or AI assistants that render link previews, it will appear as a bare link. Add og:title, og:description, og:type and og:url to the head, plus a representative og:image at least 1200×630 pixels. Add twitter:card set to 'summary_lar…
7. **fix [medium/aeo-geo]** Add structured data describing the page and its publisher. No JSON-LD was detected and no schema types are present. Machines therefore have no structured statement of what this page is or who publishes it. Add a JSON-LD block in the head. Use WebPage for the page itself, with name, description and url matching the visible content, and an Organization entity for the publisher with name, url and logo. Only include prop…
8. **fix [medium/technical]** Publish a sitemap and reference it from robots.txt. No sitemap was found for the site. Even a small site benefits from an explicit URL inventory that search engines and AI crawlers can fetch directly. Generate an XML sitemap listing every canonical URL on the site, host it at /sitemap.xml, and add a Sitemap directive to robots.txt pointing to its absolute URL. Keep lastmod values accurate and regenerate the file when…
9. **fix [low/technical]** Review the security header set. The crawl shows HTTPS is in place but no Strict-Transport-Security, Content-Security-Policy, X-Frame-Options, X-Content-Type-Options or Referrer-Policy headers were observed. These are hardening measures rather than ranking factors, but their absence is visible to any technical reviewer. At the server or CDN layer, add Strict-Transport-Security with a long max-age once you are certain …
10. **fix [high/technical]** Confirm whether this host is the intended production domain. The page's own opening text states that the domain is for documentation examples, is not a service, and should not be relied on for testing or monitoring. The crawl also shows a single external link, no internal links, no images and 133 words of content. Before investing in any optimisation, confirm with the site owner whether example.com is the real produc…

Removed by the checker (0): none
Added by the checker: none

## Reviewer verdict

_to be completed by a human reviewer_

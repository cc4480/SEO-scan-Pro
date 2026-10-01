# 01-example — https://example.com

*tiny static page.* Smallest possible page; letter-by-letter markup; no JSON-LD.

Scan: 20.3s · scoreMethod **measured** · scores {"overall":59,"technical":78,"content":36,"aeoGeo":66,"performance":50} · simulated: false · AI used: true

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
| raw words (no JS) | 29 | 27 <br><sub>ground truth = real load with JavaScript disabled</sub> | ok |
| raw links (no JS) | 0 | 1 | ok |
| rendered words (facts) | 135 | 133 | ok |
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

1. **critical** No meta description (meta.description is empty), so search engines and AI answer engines have no summary to display or quote.
2. **critical** No canonical URL (meta.canonical is empty), leaving the page without an explicit preferred URL signal.
3. **critical** No headings at all: h1, h2 and h3 arrays are empty, so the page has no topical structure for crawlers or LLMs to parse.
4. **critical** No structured data: structuredData.hasJsonLd is false and structuredData.types is empty, so the page is ineligible for any rich result or entity-level machine understanding.
5. **critical** No internal links (internalLinksCount is 0); the only link is external, so crawlers have no path to the rest of the site.
6. **critical** No Open Graph or Twitter card tags (social.ogTitle, ogDescription, ogImage, ogType and twitterCard are all empty), so shares and AI previews render as bare links.
7. **critical** Thin content: wordCount is 133, which is insufficient to rank for any competitive query or to be cited by generative engines.
8. **critical** No sitemap was found (sitemapFound is false), which slows discovery of any other URLs on the domain.
9. **fix [high/content]** Add a unique meta description. meta.description is empty on https://example.com/. Search engines and AI answer engines use this text as the default snippet and citation summary. In the <head> of the page template, add <meta name="description" content="..."> with a 140–160 character summary of what the page offers and who it is for. Make it unique per page.
10. **fix [high/technical]** Add a self-referencing canonical tag. meta.canonical is empty, so the page does not declare its preferred URL. Add <link rel="canonical" href="https://example.com/"> to the <head>, using the exact absolute URL of the page.
11. **fix [high/content]** Add a single H1 and supporting H2 structure. The crawl found zero H1, H2 and H3 elements, so the page has no heading outline for crawlers or LLMs. Add exactly one <h1> stating the page's primary topic, then 2–4 <h2> sections covering the main subtopics, with <h3> sub-points where useful. Keep the heading text descriptive and keyword-relevant.
12. **fix [high/aeo-geo]** Add Organization and WebSite JSON-LD. structuredData.hasJsonLd is false and structuredData.types is empty, so no entity data is available to search or AI engines. Add a <script type="application/ld+json"> block containing Organization (name, url, logo) and WebSite (name, url) entities. Add WebPage with name, description and url. Do not add aggregateRating or Review markup unless genuine reviews are visible on the pag…
13. **fix [high/technical]** Add internal links to real content pages. internalLinksCount is 0; the only link on the page is external. Crawlers have no path into the rest of the site. Add at least 3–5 contextual <a href> links in the page body pointing to key internal pages (home, product/service, about, contact). Use descriptive anchor text, not "click here".
14. **fix [medium/content]** Add Open Graph and Twitter card tags. social.ogTitle, ogDescription, ogImage, ogType and twitterCard are all empty, so shared and AI-previewed links render without a title, description or image. Add og:title, og:description, og:image (1200x630 px), og:type and og:url, plus twitter:card="summary_large_image", twitter:title, twitter:description and twitter:image to the <head>.
15. **fix [high/content]** Expand thin page content. wordCount is 133, which is too thin to rank or to be cited by generative engines. Expand the page to at least 600–800 words of substantive, original content organised under the H2 sections. Cover what the offering is, who it is for, how it works and what makes it different. Avoid filler.
   - ⚠ quotes 800 words; measured values are 133 rendered / 27 no-JS
16. **fix [medium/technical]** Publish a sitemap.xml. sitemapFound is false, so crawlers have no machine-readable index of the site's URLs. Generate an XML sitemap listing all canonical URLs and reference it from robots.txt with a Sitemap: line. Submit it in Google Search Console and Bing Webmaster Tools.
17. **fix [medium/performance]** Investigate TTFB from a representative location. loadTimeMs is 3493 ms and ttfbMs is 2427 ms, meaning roughly 70% of load time is server/network response. This measurement was taken from the auditing host and may be network-bound rather than a site defect. Re-measure TTFB from a location near the target audience and from a real-user monitoring tool before changing anything. If TTFB is still high from representative l…
18. **fix [low/technical]** Add baseline security headers. securityHeaders shows hsts, csp, xFrameOptions, xContentTypeOptions and referrerPolicy all false. HTTPS is true. Add Strict-Transport-Security, Content-Security-Policy, X-Frame-Options, X-Content-Type-Options and Referrer-Policy response headers at the server or CDN layer.

Removed by the checker (0): none
Added by the checker: none

## Reviewer verdict

Lead review. **Measurements: all match ground truth** (including the lettered-span word count fixed earlier).
Findings: 18 reviewed. Factually ACCURATE: 1-8 and 9-18 (no meta description, no canonical, no headings, no JSON-LD, 0 internal links, no OG tags, 133 words, no sitemap, headers absent, TTFB caveated).
- SUBJECTIVE / A-13: severity. 8 "critical" issues on a demo page, several minor (no OG tags, no sitemap).
- 15: "at least 600-800 words" is a recommendation target, not a claim (the automatic flag is a false alarm).
Counts: ACCURATE 17, SUBJECTIVE 1.

# 29-tesla — https://www.tesla.com

*brand site, bot defences.* Large hero media, blocks some automated traffic.

Scan: 14.2s · scoreMethod **illustrative** · scores {"overall":68,"technical":72,"content":65,"aeoGeo":70,"performance":85} · simulated: true · AI used: true

## Measurements vs independent ground truth

| Fact | Scanner | Ground truth | |
|---|---|---|---|
| page reached | simulated | status 403 <br><sub>scanner used placeholder data</sub> | ok |

## Findings (as shown to the user)

1. **critical** Simulated data only — the site could not be reached or crawled, so no real technical, content, or AEO issues can be confirmed.
2. **critical** No sitemap was found (sitemapFound: false), which would make it harder for search engines to discover all pages if this were a real crawl.
3. **critical** No llms.txt file was found (llmsTxtFound: false), meaning AI crawlers have no curated guidance file for this site.
4. **critical** 3 of 14 images are missing alt text (missingAltCount: 3), which is an accessibility and content-quality gap.
   - ⚠ mentions alt text but the page has no images
   - ⚠ quotes 14 images; page has 0 (0 without useful alt)
5. **critical** The meta title 'Www | Leading Solutions & Professional Services' is generic and does not reflect the brand or page topic, reducing click-through and relevance signals.
6. **fix [high/technical]** Publish an XML sitemap and reference it in robots.txt. The crawl found no sitemap (sitemapFound: false). Without one, search engines and AI crawlers must rely on link discovery alone, which slows indexing and can leave pages undiscovered. Generate an XML sitemap covering all canonical URLs. Place it at /sitemap.xml. Add a line 'Sitemap: https://www.tesla.com/sitemap.xml' to robots.txt. Submit the sitemap in Google Se…
7. **fix [medium/aeo-geo]** Create an llms.txt file to guide AI crawlers. No llms.txt file was found (llmsTxtFound: false). This optional file helps large language models understand which content is authoritative and how to cite the site. Create a plain-text file at /llms.txt. Include a short site description, links to key pages (home, about, products, contact), and a note on preferred citation format. Keep it under 100 lines and update it when…
8. **fix [medium/content]** Add descriptive alt text to the three images missing it. 3 of 14 images on the page have no alt attribute (missingAltCount: 3). This harms screen-reader users and removes a small relevance signal for image search. Audit all <img> tags. For each of the three images without alt text, add a concise, descriptive alt attribute that explains the image's content or function. If an image is purely decorative, use alt="" inte…
   - ⚠ mentions alt text but the page has no images
   - ⚠ quotes 14 images; page has 0 (0 without useful alt)
9. **fix [high/content]** Rewrite the meta title to be brand-specific and descriptive. The current title 'Www | Leading Solutions & Professional Services' is generic and does not mention the brand or the page's actual topic, which weakens relevance and click-through in search results. Replace the title with a unique, 50–60 character string that includes the brand name and the primary value proposition of the page. Example pattern: 'Brand Name…
10. **fix [medium/aeo-geo]** Expand structured data to cover page-level entities. The page has Organization, WebSite, and LocalBusiness JSON-LD, but no page-specific schema such as WebPage or BreadcrumbList. Adding these helps search engines and AI systems understand the page's role. Add a WebPage entity to the existing JSON-LD @graph, with properties name, description, url, and isPartOf pointing to the WebSite. Add a BreadcrumbList if the page …
11. **fix [low/technical]** Improve internal linking with descriptive anchor text. The page has 19 internal links. If any use generic anchor text like 'click here' or 'read more', they waste relevance signals. Review all internal links. Replace generic anchor text with keyword-rich phrases that describe the destination page. Ensure every important page is reachable within three clicks from the homepage.
12. **fix [medium/aeo-geo]** Add FAQPage structured data to the existing FAQ section. The page has an H2 'Frequently Asked Questions' but no FAQPage schema is present in the structured data types. Adding it can help AI systems extract direct answers, even though Google no longer shows FAQ rich results. Mark up the existing FAQ content with FAQPage JSON-LD, using Question and acceptedAnswer properties. Do not expect a Google rich result, but it i…
13. **fix [low/performance]** Optimize page load performance and monitor Core Web Vitals. The measured load time is 596 ms, which is fast. However, this is a lab measurement from the auditing host and may not reflect real-user experience. No field data (CrUX) is available in this payload. Continue monitoring Core Web Vitals via Google Search Console's Core Web Vitals report. Ensure images are compressed, use modern formats (WebP/AVIF), and levera…

Removed by the checker (0): none
Added by the checker: none

## Reviewer verdict

_to be completed by a human reviewer_

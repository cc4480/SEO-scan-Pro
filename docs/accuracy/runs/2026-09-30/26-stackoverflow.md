# 26-stackoverflow — https://stackoverflow.com

*Q&A, bot defences.* Challenges unknown clients; many links.

Scan: 14.5s · scoreMethod **illustrative** · scores {"overall":68,"technical":72,"content":65,"aeoGeo":70,"performance":85} · simulated: true · AI used: true

## Measurements vs independent ground truth

| Fact | Scanner | Ground truth | |
|---|---|---|---|
| page reached | simulated | status 403 <br><sub>scanner used placeholder data</sub> | ok |

## Findings (as shown to the user)

1. **critical** 3 images are missing alt text, which is an accessibility and content issue that can hinder image search and AI understanding.
2. **critical** No sitemap was found (sitemapFound: false), which may slow discovery of new or updated pages by search engines.
3. **critical** No llms.txt file was found (llmsTxtFound: false), which is a missed opportunity for guiding AI crawlers and improving generative search visibility.
4. **fix [high/technical]** Add descriptive alt text to all images. 3 out of 14 images on the homepage are missing alt attributes. This reduces accessibility and deprives search engines and AI models of context about the images. Identify the 3 images without alt text. For each, add a concise, descriptive alt attribute that accurately reflects the image content and purpose. If an image is purely decorative, use an empty alt attribute (alt="") to…
5. **fix [high/technical]** Create and submit an XML sitemap. The crawl did not find a sitemap (sitemapFound: false). A sitemap helps search engines discover and index all important pages, especially new or updated content. Generate an XML sitemap that includes all canonical URLs of the site. Place it at the root (e.g., https://stackoverflow.com/sitemap.xml) and reference it in robots.txt. Submit the sitemap to Google Search Console and Bing We…
6. **fix [medium/aeo-geo]** Add an llms.txt file to guide AI crawlers. No llms.txt file was found (llmsTxtFound: false). This file is an emerging standard to provide AI models with a curated list of important content, improving visibility in generative search engines like ChatGPT, Perplexity, and Gemini. Create a plain text file named llms.txt at the root of the domain. Include a brief description of the site and a list of key URLs (e.g., main …
7. **fix [medium/aeo-geo]** Enhance structured data with FAQPage markup. The page has an FAQ section (H2: 'Frequently Asked Questions') but does not include FAQPage structured data. Adding FAQPage markup can help AI models and search engines understand and surface question-answer pairs, though Google no longer shows FAQ rich results. Add JSON-LD structured data of type FAQPage to the page, marking up the questions and answers from the FAQ secti…
   - ⚠ says structured data is missing but the page has 3 type(s)
8. **fix [medium/content]** Improve internal linking with descriptive anchor text. The page has 19 internal links. While the number is reasonable, the audit did not assess anchor text quality. Descriptive anchor text helps both users and search engines understand the linked content. Review internal links and ensure anchor text is descriptive and relevant to the target page. Avoid generic phrases like 'click here' or 'read more'. Where appropria…
9. **fix [medium/content]** Expand content depth and topical authority. The homepage content appears relatively thin (page size 58KB, headings limited). For competitive terms, deeper content that comprehensively covers topics can improve rankings and AI citations. Conduct a content gap analysis against top competitors. Add in-depth sections, guides, case studies, or resources that address user intent and common questions. Ensure content is well…
10. **fix [low/aeo-geo]** Optimize for voice search with natural language Q&A. Voice search queries are often longer and conversational. The current content may not directly answer common spoken queries. Identify frequent voice search queries related to your business (e.g., 'how to...', 'what is...', 'best... near me'). Create concise, direct answers in a dedicated FAQ or Q&A section, using natural language and schema markup where appropriate…

Removed by the checker (0): none
Added by the checker: none

## Reviewer verdict

Reviewer R5. Counts: ACCURATE 0, INACCURATE 5, MISLEADING 0, UNSUPPORTED 5, SUBJECTIVE 0.

Summary: the scan is simulated, and the cause is a bot defence, not an unreachable site. The scanner's Chromium (UA "...SEO-Scan-Pro/1.1") was redirected / -> /questions and got a Cloudflare "Just a moment..." 403 (curl confirms 403 "Just a moment..." on /questions for that UA). A normal Chrome UA in puppeteer passes the challenge and renders the real page (title "Newest Questions - Stack Overflow", 1549 words, 155 internal links, 19 images, JSON-LD WebSite/Organization/ContactPoint, no FAQ section). So "simulated" is a scanner limitation and the page a real visitor sees is fully readable. Every page-derived statement in the report comes from the placeholder generator (brand "Stackoverflow", title "Stackoverflow | Leading Solutions & Professional Services", 14 images/3 without alt, 28 links/19 internal, H2 "Frequently Asked Questions", JSON-LD Organization/WebSite/LocalBusiness, 58 KB, 529 ms): none of it exists on stackoverflow.com. The finding list never says the data is simulated (only the executive summary does), and the agent hand-off prompt carries the same fabricated tasks.

Fabricated placeholder claims presented as findings: image counts (1, 4, 8), "3 of 14 images" (also the alt-text title), FAQ section with H2 "Frequently Asked Questions" (7, 10 and the aeoAssessment text), "19 internal links" (8), "page size 58KB, headings limited" (9), structured data types Organization/WebSite/LocalBusiness (7, aeo richSnippetEligibility), load time 529 ms, scores 68/72/65/70/85 (identical to Tesla's). Also in the executive summary and agentReadyPrompt (tasks 1, 4, 5).

Measurement table: "page reached: simulated vs status 403" is correct (the first response IS 403). Ground truth rendered the real page after the JS challenge; the sheet only compares the status.

1. INACCURATE: "3 images missing alt" is the placeholder image list; the real page has 19 images, 0 without an alt attribute, 2 with empty alt.
2. UNSUPPORTED: scan saw sitemap.xml -> 403 and read it as "not found"; live (browser UA and in-browser fetch) it is 404, so the claim is true today but was not established by the evidence (A-01).
3. UNSUPPORTED: llms.txt -> 403 at scan time; live 404 (true today, not established). Also rated critical for an optional file (A-13).
4. INACCURATE: repeats the fabricated 3 of 14 images.
5. UNSUPPORTED: sitemap advice based on a 403; see 2. robots.txt is not "unreadable-so-absent" either: from this machine it answers HTTP 418 with a disallow-all body ("User-agent: * / Content-signal: search=no, ai-train=no / Disallow: /"), which the scanner turned into "no crawl rules published" (A-01).
6. UNSUPPORTED: llms.txt advice; see 3 (SUBJECTIVE advice on top).
7. INACCURATE: the page has no FAQ section and no "Frequently Asked Questions" H2; its structured data is WebSite/Organization/ContactPoint, not LocalBusiness. The checker flag ("says structured data is missing but the page has 3 types") is correct and the 3 types are themselves fabricated.
8. INACCURATE: the 19 internal links are placeholder ("https://stackoverflow.com//about"); the real page has 155 internal anchors. "The audit did not assess anchor text" admits there is nothing real behind it.
9. INACCURATE: "page size 58KB, headings limited" is the placeholder; the real page is 1549 words with many headings.
10. UNSUPPORTED: voice-search / Q&A advice written without any page text; generic boilerplate.

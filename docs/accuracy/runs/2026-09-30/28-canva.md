# 28-canva — https://www.canva.com

*SaaS marketing, multilingual.* Many locales, heavy imagery.

Scan: 31.9s · scoreMethod **measured** · scores {"overall":62,"technical":66,"content":60,"aeoGeo":27,"performance":100} · simulated: false · AI used: true

## Measurements vs independent ground truth

| Fact | Scanner | Ground truth | |
|---|---|---|---|
| title | "Unsupported client – Canva" | "Canva: Visual Suite for Everyone" | **MISMATCH** |
| meta description present | true | true | ok |
| canonical | - | https://www.canva.com/ | **MISMATCH** |
| viewport present | true | true | ok |
| html lang | en | en | ok |
| H1 count | 1 | 1 | ok |
| H2 count | 0 | 36 | **MISMATCH** |
| images (with src) | 4 | 7 <br><sub>DOM has 7 <img>, 7 with a source</sub> | ok |
| images missing/empty alt | 4 | 5 <br><sub>no alt attr 0, empty alt 5</sub> | ok |
| links (scanner total vs real+hash anchors) | 6 | 411+5 hash | **MISMATCH** |
| JSON-LD types | 0 | 2 <br><sub>differs: ContactPoint, Organization</sub> | **MISMATCH** |
| visible words (rendered) | 54 | 738 <br><sub>innerText vs markup count differ for hidden text; tolerance 30%</sub> | **MISMATCH** |
| hreflang present | false | true | **MISMATCH** |
| raw words (no JS) | 32 | 31 <br><sub>ground truth = real load with JavaScript disabled</sub> | ok |
| raw links (no JS) | 99 | 1 | **MISMATCH** |
| rendered words (facts) | 58 | 738 | **MISMATCH** |
| robots.txt blocks all | false | true | **MISMATCH** |
| sitemap found | true | true <br><sub>sitemap.xml HTTP 403, robots directive yes</sub> | ok |
| llms.txt found | false | false <br><sub>llms.txt HTTP 403 (HTML, not a real llms.txt)</sub> | ok |
| header hsts | true | true | ok |
| header csp | true | true | ok |
| header xFrameOptions | true | true | ok |
| header xContentTypeOptions | true | true | ok |
| header referrerPolicy | true | true | ok |
| bot GPTBot | 403 blocked | 403 <br><sub>bot rules can vary run to run; re-check</sub> | **MISMATCH** |
| bot ClaudeBot | 403 blocked | 403 <br><sub>bot rules can vary run to run; re-check</sub> | **MISMATCH** |
| bot CCBot | 403 blocked | 403 <br><sub>bot rules can vary run to run; re-check</sub> | **MISMATCH** |
| bot Bytespider | 403 blocked | 403 <br><sub>bot rules can vary run to run; re-check</sub> | **MISMATCH** |
| bot OAI-SearchBot | 403 blocked | 403 <br><sub>bot rules can vary run to run; re-check</sub> | **MISMATCH** |
| bot Claude-SearchBot | 403 blocked | 403 <br><sub>bot rules can vary run to run; re-check</sub> | **MISMATCH** |
| bot PerplexityBot | 403 blocked | 403 <br><sub>bot rules can vary run to run; re-check</sub> | **MISMATCH** |
| bot Googlebot | 403 blocked | 403 <br><sub>bot rules can vary run to run; re-check</sub> | **MISMATCH** |
| bot Bingbot | 403 blocked | 403 <br><sub>bot rules can vary run to run; re-check</sub> | **MISMATCH** |
| bot Applebot | 403 blocked | 403 <br><sub>bot rules can vary run to run; re-check</sub> | **MISMATCH** |
| bot ChatGPT-User | 403 blocked | 403 <br><sub>bot rules can vary run to run; re-check</sub> | **MISMATCH** |
| bot Claude-User | 403 blocked | 403 <br><sub>bot rules can vary run to run; re-check</sub> | **MISMATCH** |
| bot Perplexity-User | 403 blocked | 403 <br><sub>bot rules can vary run to run; re-check</sub> | **MISMATCH** |

## Findings (as shown to the user)

1. **critical** Search or assistant crawlers are refused by the site: OAI-SearchBot, Claude-SearchBot, PerplexityBot, Googlebot, Bingbot, Applebot, ChatGPT-User, Claude-User, Perplexity-User.
   - ⚠ says OAI-SearchBot is blocked but it got HTTP 403
   - ⚠ says Claude-SearchBot is blocked but it got HTTP 403
   - ⚠ says PerplexityBot is blocked but it got HTTP 403
   - ⚠ says Googlebot is blocked but it got HTTP 403
   - ⚠ says Bingbot is blocked but it got HTTP 403
   - ⚠ says Applebot is blocked but it got HTTP 403
   - ⚠ says ChatGPT-User is blocked but it got HTTP 403
   - ⚠ says Claude-User is blocked but it got HTTP 403
   - ⚠ says Perplexity-User is blocked but it got HTTP 403
2. **critical** Every tested crawler received HTTP 403 on https://www.canva.com/, including search crawlers Googlebot, Bingbot, Applebot, OAI-SearchBot, Claude-SearchBot, and PerplexityBot, and assistant crawlers ChatGPT-User, Claude-User, and Perplexity-User. robotsTxtAllows is true for all of these, so the block is happening at the server/WAF layer, not in robots.txt.
   - ⚠ says OAI-SearchBot is blocked but it got HTTP 403
   - ⚠ says Claude-SearchBot is blocked but it got HTTP 403
   - ⚠ says PerplexityBot is blocked but it got HTTP 403
   - ⚠ says Googlebot is blocked but it got HTTP 403
   - ⚠ says Bingbot is blocked but it got HTTP 403
   - ⚠ says Applebot is blocked but it got HTTP 403
   - ⚠ says ChatGPT-User is blocked but it got HTTP 403
   - ⚠ says Claude-User is blocked but it got HTTP 403
   - ⚠ says Perplexity-User is blocked but it got HTTP 403
3. **critical** The response served to the crawler is an interstitial error page, not the homepage: title and meta description are both 'Unsupported client – Canva', H1 is 'Please update your browser', and meta robots is 'noindex,nofollow,noarchive'.
   - ⚠ says meta description is missing but the page has one
4. **critical** The interstitial page carries no canonical URL (meta.canonical is empty) and no JSON-LD structured data (structuredData.hasJsonLd is false, types is empty).
   - ⚠ says canonical is missing but the page has https://www.canva.com/
   - ⚠ says structured data is missing but the page has 2 type(s)
5. **critical** All 4 images on the crawled page are missing alt text (missingAltCount 4 of imagesCount 4).
6. **critical** The page has no Open Graph title (social.ogTitle is empty) and no Twitter card title; ogDescription is the error string 'Unsupported client – Canva'.
7. **fix [high/aeo-geo]** Let search and assistant crawlers through your CDN or firewall. These crawlers were refused when requesting the home page with their published user agents: OAI-SearchBot (HTTP 403), Claude-SearchBot (HTTP 403), PerplexityBot (HTTP 403), Googlebot (HTTP 403), Bingbot (HTTP 403), Applebot (HTTP 403), ChatGPT-User (HTTP 403), Claude-User (HTTP 403), Perplexity-User (HTTP 403). Pages they cannot fetch cannot be indexed o…
   - ⚠ says OAI-SearchBot is blocked but it got HTTP 403
   - ⚠ says Claude-SearchBot is blocked but it got HTTP 403
   - ⚠ says PerplexityBot is blocked but it got HTTP 403
   - ⚠ says Googlebot is blocked but it got HTTP 403
   - ⚠ says Bingbot is blocked but it got HTTP 403
   - ⚠ says Applebot is blocked but it got HTTP 403
   - ⚠ says ChatGPT-User is blocked but it got HTTP 403
   - ⚠ says Claude-User is blocked but it got HTTP 403
   - ⚠ says Perplexity-User is blocked but it got HTTP 403
8. **fix [medium/aeo-geo]** Decide, and state, whether AI-training crawlers are welcome. GPTBot (HTTP 403), ClaudeBot (HTTP 403), CCBot (HTTP 403), Bytespider (HTTP 403) were refused. Whether to block AI-training crawlers is the site owner's choice; the problem is only a mismatch between policy and behaviour. If the block is intentional, add matching "User-agent: … / Disallow: /" rules to robots.txt so crawlers and humans see the same policy. I…
   - ⚠ says GPTBot is blocked but it got HTTP 403
   - ⚠ says ClaudeBot is blocked but it got HTTP 403
   - ⚠ says CCBot is blocked but it got HTTP 403
   - ⚠ says Bytespider is blocked but it got HTTP 403
9. **fix [high/technical]** Serve the real homepage instead of the 'Unsupported client' interstitial to crawlers. The crawled page returned title 'Unsupported client – Canva', meta description 'Unsupported client – Canva', H1 'Please update your browser', and meta robots 'noindex,nofollow,noarchive'. This is an error/browser-support page, not the homepage, and it is explicitly marked noindex,nofollow. Ensure the bot-detection layer does not rou…
10. **fix [medium/technical]** Restore a self-referencing canonical on the homepage response. meta.canonical is empty on the crawled response. A missing canonical on the homepage removes an explicit consolidation signal and is especially risky when the same URL can return different responses (real page vs. interstitial). Add a self-referencing canonical link element to the homepage head, e.g. <link rel="canonical" href="https://www.canva.com/">. V…
   - ⚠ says canonical is missing but the page has https://www.canva.com/
11. **fix [medium/aeo-geo]** Add JSON-LD structured data to the homepage. structuredData.hasJsonLd is false and structuredData.types is empty on the crawled page. There is no machine-readable entity definition for the brand, product, or organization. Add JSON-LD to the homepage head. Include Organization (name, url, logo, sameAs) and WebSite (name, url, potentialAction SearchAction if site search exists). If the page markets a software product, …
12. **fix [medium/content]** Add descriptive alt text to the 4 images on the page. imagesCount is 4 and missingAltCount is 4, so every image on the crawled page lacks alt text. This is an accessibility and content-comprehension gap; it is not a critical ranking failure, but it reduces the page's usefulness to screen readers and to image-understanding systems. For each of the 4 images, add an alt attribute. Use descriptive text for meaningful ima…
13. **fix [medium/content]** Populate Open Graph and Twitter card metadata. social.ogTitle is empty, social.ogDescription is the error string 'Unsupported client – Canva', and the Twitter card is 'summary' with no title. ogImage is present (https://static.canva.com/static/images/fb_cover-1.jpg) and ogType is 'website'. Set og:title and og:description to the real homepage title and description, and set twitter:title and twitter:description to mat…
14. **fix [medium/technical]** Ensure primary content and links are server-rendered. rawHtmlVsRendered shows rawWords 32 vs renderedWords 58, rawLinks 99 vs renderedLinks 6, and renderedSchemaTypes is empty. The rendered page is a near-empty shell with 58 words and 6 links. Many AI retrieval crawlers are commonly reported not to execute JavaScript, so content that only appears after JS may be invisible to them. Server-render the homepage's primary…
   - ⚠ says structured data is missing but the page has 2 type(s)
15. **fix [low/aeo-geo]** Add an llms.txt file. llmsTxtFound is false. There is no llms.txt at the site root to guide large language models and AI agents to canonical, machine-readable information. Publish https://www.canva.com/llms.txt with a short plain-text summary of the site, the canonical URL, and links to the most important pages and resources. Keep it factual and free of marketing fluff.
16. **fix [medium/aeo-geo]** Add a visible FAQ section with FAQPage markup. visibleSections.faq is false on the crawled page. FAQ content is useful for direct-answer and AI-answer surfaces, and FAQPage markup remains valid for machines even though Google no longer shows FAQ rich results. Add a visible FAQ section to the homepage with genuine question-and-answer pairs about the product. Mark it up with FAQPage JSON-LD.
17. **fix [medium/content]** Add a visible pricing section and price markup. visibleSections.pricing is false and pricesVisibleOnPage is empty on the crawled page. Pricing is a high-intent query topic and its absence limits both user conversion and AI answer coverage. Add a visible pricing section to the homepage or link prominently to a pricing page. If you add Offer or price markup, use only the price shown on the page; do not invent or hardco…
18. **fix [low/content]** Add a visible 'How it works' section. visibleSections.howItWorks is false on the crawled page. A step-by-step explanation improves comprehension for users and gives AI systems a clear process description to extract. Add a concise 'How it works' section with numbered steps. Do not add HowTo rich-result expectations; HowTo rich results were deprecated. The value is clarity for users and machines.
19. **fix [low/content]** Add a visible contact section. visibleSections.contact is false on the crawled page. Contact information supports trust signals and entity verification. Add a visible contact section or a clearly linked contact page with a support channel. Keep it consistent with any Organization structured data you add.
20. **fix [low/content]** Add a visible reviews section only if genuine reviews exist. genuineReviewsVisible is false on the crawled page. Review content can support trust and answer coverage, but only when the reviews are real and visible. If you have genuine, verifiable customer reviews, add a visible reviews section and mark it up with Review or aggregateRating only when the reviews are actually shown on the page. If you do not have genuin…

Removed by the checker (2): "Resolve the HTTP 403 block for search and assistan" (replaced by a measured finding on the same topic); "The page exposes only 2 internal links and 4 exter" (the gap is moderate (32 of 58 words are in the raw)
Added by the checker: search/assistant crawlers blocked; AI-training crawler block

## Reviewer verdict

Reviewer R5. Counts: ACCURATE 2, INACCURATE 5, MISLEADING 8, UNSUPPORTED 5, SUBJECTIVE 0.

Summary: the audit is of the wrong page, and the cause is the scanner's own User-Agent. Live tests (curl, one request per UA, plus node fetch and puppeteer):
- Real browser UA (Chrome/130 or Safari 17), even from plain curl: HTTP 200, 470 KB, title "Canva: Visual Suite for Everyone".
- The scanner's Chromium UA "Mozilla/5.0 (Windows NT 10.0; Win64; x64) SEO-Scan-Pro/1.1" (lib/crawler.ts:9) and "Mozilla/5.0 (compatible; SEOScanPro/1.1; ...)": HTTP 200 "Unsupported client - Canva" (10 KB). That is the page the scanner audited (rendered status was 200, not 403 as the executive summary says).
- No User-Agent, curl default, bare "Mozilla/5.0", and ALL 13 crawler UAs in lib/audit/botAccess.ts (also Googlebot/Bingbot): HTTP 403, 755 KB Cloudflare challenge page ("We'll have you designing again soon", challenge_title).
- Node fetch (undici) with a full Chrome UA also got 403 in my test while curl with the same UA got 200, so Cloudflare also uses the TLS/HTTP fingerprint, not only the UA.
So the site does NOT refuse every non-browser client: it serves the real page to anything that claims to be a normal browser, challenges bot/unknown/empty identities, and shows "Unsupported client" to a UA that looks like a browser but has no engine token. All 13 "refused" results are therefore the site's reaction to a spoofed UA on a datacenter-style client; they say nothing about whether real GPTBot/Googlebot (verified by IP) are let in. The scan's "baseline 200" was the Unsupported-client page (default UA), a different transport and identity from the probes (A-02).
Real page (puppeteer, Chrome UA): title as above, canonical https://www.canva.com/, lang en, 1 H1, 36 H2, 7 images (5 alt=""), 411 anchors, 107 hreflang, JSON-LD Organization + ContactPoint (no WebSite), og:title/twitter:title present, no noindex, 738 visible words; raw HTML (no JS) 1245 words / 404 links, i.e. server-rendered; sitemap via robots Sitemap directive 200, llms.txt 404, no FAQ/how-it-works.
Measurement mismatches: title, canonical, H2, links, JSON-LD, words, hreflang, images, rendered words: all scanner-side, the interstitial (A-03 plus the UA cause below). raw links 99 vs 1: both wrong; the scanner's raw fetch (node, Chrome/124 Linux UA) got the 403 challenge page (755 KB, 32 words, 99 links of the challenge), ground's JS-disabled Chromium got the same challenge (31 words, 1 link); the truth is 1245 words / 404 links. robots "blocks all" true in ground: ground-tool bug, the file is "User-agent: * / Disallow: " (empty) plus pattern Disallows (A-12). Bot 403s: scanner and ground agree (both 403); the sheet's MISMATCH label is only the "refused vs baseline" rule. sitemap found true and llms false are right. Scores (62; -30 for noindex, -20 no JSON-LD, -32 crawlers refused, -30 thin) are all derived from the interstitial and should be discarded.

1. MISLEADING: the 403s are real for those UAs (reproduced) but caused by UA spoofing; IP-verified Googlebot/Bingbot/Applebot cannot be tested this way (A-02).
2. MISLEADING: duplicate of 1; "block is at the server/WAF layer, not robots.txt" is true for the challenge; "every tested crawler" true for spoofed UAs only.
3. ACCURATE: title, description, H1 "Please update your browser", noindex,nofollow,noarchive all confirmed for that response. But it never says why (the scanner's UA), and the summary calls it "HTTP 403" while the rendered status was 200 (the 403 was the raw challenge fetch).
4. MISLEADING: true of the interstitial only; the real page has a canonical and 2 JSON-LD types (checker flags confirm).
5. MISLEADING: the 4 images are Chrome/Firefox/Safari/Edge logos on the Unsupported-client page; the real page has 7 images, 5 decorative.
6. MISLEADING: og:title/twitter:title exist on the real page ("Canva: Visual Suite for Everyone"); the error string is the interstitial's description.
7. MISLEADING: same as 1.
8. MISLEADING: same as 1, for training crawlers.
9. MISLEADING: tells the owner to fix something a real browser never sees; the interstitial appears for the scanner's own UA (reproduced both ways).
10. INACCURATE: the real homepage has a self-referencing canonical.
11. INACCURATE: the real homepage has JSON-LD (Organization, ContactPoint). Adding WebSite would still be fair advice, but "no JSON-LD" is false.
12. INACCURATE: advice for 4 images that are not on the site.
13. INACCURATE: og:title and twitter:title exist; the error string is not the site's og:description.
14. INACCURATE: compares two challenge/interstitial pages. Real raw HTML is 1245 words / 404 links, so the homepage is not a JS-only shell.
15. ACCURATE: https://www.canva.com/llms.txt is 404 for a browser UA (the scan saw 403, so the evidence was weak, but the claim is true). Low priority is right.
16. UNSUPPORTED: FAQ absence was read from the interstitial; true on the real page (no FAQ text) by luck.
17. UNSUPPORTED: derived from the interstitial; the real page links to /pricing prominently ("Plans").
18. UNSUPPORTED: derived from the interstitial (real page also lacks it).
19. UNSUPPORTED: derived from the interstitial; real page has contact links in nav/footer.
20. UNSUPPORTED: derived from the interstitial.

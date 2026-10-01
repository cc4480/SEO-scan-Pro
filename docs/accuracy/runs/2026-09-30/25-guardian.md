# 25-guardian — https://www.theguardian.com/international

*news, structured data.* Rich JSON-LD, many images, edition alternates.

Scan: 30.5s · scoreMethod **measured** · scores {"overall":72,"technical":94,"content":76,"aeoGeo":34,"performance":79} · simulated: false · AI used: true

## Measurements vs independent ground truth

| Fact | Scanner | Ground truth | |
|---|---|---|---|
| title | "Latest news, sport and opinion from the Guardian" | "Latest news, sport and opinion from the Guardian" | ok |
| meta description present | true | true | ok |
| canonical | https://www.theguardian.com | https://www.theguardian.com | ok |
| viewport present | true | true | ok |
| html lang | en | en | ok |
| H1 count | 0 | 0 | ok |
| H2 count | 32 | 32 | ok |
| images (with src) | 111 | 112 <br><sub>DOM has 112 <img>, 112 with a source</sub> | ok |
| images missing/empty alt | 1 | 1 <br><sub>no alt attr 0, empty alt 1</sub> | ok |
| links (scanner total vs real+hash anchors) | 348 | 349+3 hash | ok |
| JSON-LD types | 0 | 0 | ok |
| visible words (rendered) | 3282 | 3002 <br><sub>innerText vs markup count differ for hidden text; tolerance 30%</sub> | ok |
| hreflang present | false | false | ok |
| raw words (no JS) | 3262 | 3029 <br><sub>ground truth = real load with JavaScript disabled</sub> | ok |
| raw links (no JS) | 345 | 347 | ok |
| rendered words (facts) | 3290 | 3002 | ok |
| robots.txt blocks all | false | true | **MISMATCH** |
| sitemap found | false | true <br><sub>sitemap.xml HTTP 404, robots directive yes</sub> | **MISMATCH** |
| llms.txt found | false | false <br><sub>llms.txt HTTP 404 (HTML, not a real llms.txt)</sub> | ok |
| header hsts | true | true | ok |
| header csp | true | true | ok |
| header xFrameOptions | true | true | ok |
| header xContentTypeOptions | true | true | ok |
| header referrerPolicy | true | true | ok |
| bot GPTBot | 200 | 200 | ok |
| bot ClaudeBot | 403 blocked | 403 blocked | ok |
| bot CCBot | 403 blocked | 403 blocked | ok |
| bot Bytespider | 403 blocked | 403 blocked | ok |
| bot OAI-SearchBot | 200 | 200 | ok |
| bot Claude-SearchBot | 403 blocked | 403 blocked | ok |
| bot PerplexityBot | 403 blocked | 403 blocked | ok |
| bot Googlebot | 200 | 200 | ok |
| bot Bingbot | 200 | 200 | ok |
| bot Applebot | 200 | 200 | ok |
| bot ChatGPT-User | 200 | 200 | ok |
| bot Claude-User | 403 blocked | 403 blocked | ok |
| bot Perplexity-User | 403 blocked | 403 blocked | ok |

## Findings (as shown to the user)

1. **critical** Search or assistant crawlers are refused by the site: Claude-SearchBot, PerplexityBot, Claude-User, Perplexity-User.
2. **critical** ClaudeBot, CCBot, Bytespider, Claude-SearchBot, PerplexityBot, Claude-User, and Perplexity-User are blocked with HTTP 403, preventing AI search and assistant crawlers from accessing content.
3. **critical** No JSON-LD structured data found on the page, missing opportunities for rich results and entity understanding.
4. **critical** No H1 heading present on the homepage, weakening topical relevance signals.
5. **critical** Open Graph and Twitter Card meta tags are empty, reducing social media click-through and sharing appeal.
6. **fix [high/aeo-geo]** Let search and assistant crawlers through your CDN or firewall. These crawlers were refused when requesting the home page with their published user agents: Claude-SearchBot (HTTP 403), PerplexityBot (HTTP 403), Claude-User (HTTP 403), Perplexity-User (HTTP 403). Pages they cannot fetch cannot be indexed or cited by the engines and assistants behind them. robots.txt allows them, so the site is saying "welcome" and the…
7. **fix [medium/aeo-geo]** Decide, and state, whether AI-training crawlers are welcome. ClaudeBot (HTTP 403), CCBot (HTTP 403), Bytespider (HTTP 403) were refused even though robots.txt does not disallow them. Search and assistant crawlers (OAI-SearchBot, Googlebot, Bingbot, Applebot, ChatGPT-User) were let through, so answer-engine citation is not affected by this. Whether to block AI-training crawlers is the site owner's choice; the problem …
   - ⚠ says OAI-SearchBot is blocked but it got HTTP 200
   - ⚠ says Googlebot is blocked but it got HTTP 200
   - ⚠ says Bingbot is blocked but it got HTTP 200
   - ⚠ says Applebot is blocked but it got HTTP 200
   - ⚠ says ChatGPT-User is blocked but it got HTTP 200
8. **fix [high/technical]** Implement JSON-LD Structured Data. The page has no JSON-LD structured data, missing opportunities for rich results and better entity recognition by search engines and AI models. Add JSON-LD markup for NewsArticle or WebSite schema on the homepage. Include properties such as headline, description, datePublished, author, publisher, and image. For the homepage, consider WebSite schema with potentialAction for sitelinks …
9. **fix [medium/content]** Add a Single H1 Heading. The homepage lacks an H1 heading, which is a missed opportunity to reinforce the page's primary topic for search engines and assistive technologies. Add a single H1 element that concisely describes the page's main focus, such as 'Latest International News, Sport and Opinion from The Guardian'. Ensure it is visually prominent and semantically correct.
10. **fix [medium/content]** Populate Open Graph and Twitter Card Metadata. Open Graph and Twitter Card meta tags are empty, leading to poor social media previews and reduced click-through rates when shared. Add og:title, og:description, og:image, og:type, and twitter:card meta tags with relevant content. Use a high-quality image (at least 1200x630 pixels) and compelling descriptions to encourage social sharing.
11. **fix [low/content]** Improve Alt Text Coverage. One image is missing alt text, which is an accessibility issue and a minor content quality gap. Identify the image without alt text and add a descriptive alt attribute. For decorative images, use empty alt text (alt="") to indicate they are not content.
12. **fix [medium/performance]** Optimize for Core Web Vitals. Lab measurements show a Cumulative Layout Shift (CLS) of 0.19, which exceeds the recommended threshold of 0.1, indicating potential visual instability. Audit the page for elements that cause layout shifts, such as images without dimensions, ads, or dynamic content. Ensure images have width and height attributes, reserve space for ads, and avoid inserting content above existing content. U…

Removed by the checker (2): "Enhance Direct Answer Friendliness" (the page already has a faq section); "Unblock AI Search and Assistant Crawlers" (replaced by a measured finding on the same topic)
Added by the checker: search/assistant crawlers blocked; AI-training crawler block

## Reviewer verdict

Reviewer R4. Counts: ACCURATE 8, INACCURATE 2, MISLEADING 2, UNSUPPORTED 0, SUBJECTIVE 0.

robots.txt, verified live: HTTP 200, 2,873 bytes (same with no UA, node UA and the scanner UA today; the scanner got 406 during the scan, which per ssrfGuard's comment was the missing User-Agent). It does NOT disallow everything for `*` (ground's "robots blocks all = true" is a ground-tool bug, A-12: the `Disallow: /` belongs to a long named-bot group). That named group explicitly disallows ClaudeBot, anthropic-ai, Claude-SearchBot, Claude-User, PerplexityBot, CCBot, Bytespider and others (not GPTBot, OAI-SearchBot or Perplexity-User). It declares two sitemaps (http://www.theguardian.com/sitemaps/news.xml and video.xml, both 200 live); /sitemap.xml is 404. So: the scanner's "robots.txt: no rules, all crawlers allowed" and "sitemap not found" are wrong (A-01), and "robots.txt allows them, so the site says welcome then refuses" is false for ClaudeBot, CCBot, Bytespider, Claude-SearchBot, PerplexityBot and Claude-User: the 403s are the site enforcing its stated policy. The 403s themselves are real: ClaudeBot, Claude-User, PerplexityBot and Perplexity-User UAs got 403, GPTBot 200 (my curl).

Other mismatches: images 111 vs 112, links 348 vs 349: trivial. Missing alt 1 = alt="" (ground: no attr 0, empty 1), A-08. Section signals (faq/reviews/features true) are wrong, see new defect R4-02. og/twitter: none in raw HTML (only twitter:dnt), no JSON-LD, no H1: scanner, ground and 1.2 MB raw HTML all agree.

1. MISLEADING: the four refusals are real (403 verified) but framed as a misconfiguration to fix; robots.txt explicitly disallows Claude-SearchBot, PerplexityBot and Claude-User and the 403s are deliberate (Perplexity-User is not listed).
2. ACCURATE: 7 UAs get HTTP 403 (verified for 4 of them live); the claim stops at "preventing access", which is true. Duplicates 1.
3. ACCURATE: no JSON-LD in the raw HTML or rendered DOM. "Critical" is generous (A-13).
4. ACCURATE: no H1 (ground 0, raw HTML 0). "Critical" is generous (A-13).
5. ACCURATE: no og: or twitter:card meta tags in the page (only twitter:dnt). "Empty" means absent.
6. INACCURATE: "robots.txt allows them" is false for 3 of the 4 listed (Claude-SearchBot, PerplexityBot, Claude-User are explicitly Disallow: /). Advice to let them through contradicts the publisher's declared policy (A-01 root cause: 406 read as "no rules").
7. INACCURATE: "refused even though robots.txt does not disallow them" is false: ClaudeBot, CCBot and Bytespider are all explicitly disallowed. The statement about Googlebot/Bingbot/Applebot/OAI-SearchBot/ChatGPT-User being let through is true (the flags are noise).
8. ACCURATE: no JSON-LD (see 3). Advice (WebSite/NewsArticle) reasonable.
9. ACCURATE: no H1; the suggested H1 text is reasonable.
10. ACCURATE: no OG/Twitter tags; advice correct.
11. MISLEADING: the one image has alt="" (valid decorative), not missing alt (A-08).
12. ACCURATE: CLS 0.19 as measured (page never reaches network idle for me, so I could not re-measure; Guardian pages are ad-heavy and variable).

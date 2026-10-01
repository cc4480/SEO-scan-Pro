# 25-guardian — https://www.theguardian.com/international

*news, structured data.* Rich JSON-LD, many images, edition alternates.

Scan: 35.4s · scoreMethod **measured** · scores {"overall":83,"technical":100,"content":76,"aeoGeo":61,"performance":95} · simulated: false · AI used: true

## Measurements vs independent ground truth

| Fact | Scanner | Ground truth | |
|---|---|---|---|
| title | "Latest news, sport and opinion from the Guardian" | "Latest news, sport and opinion from the Guardian" | ok |
| meta description present | true | true | ok |
| canonical | https://www.theguardian.com | https://www.theguardian.com | ok |
| viewport present | true | true | ok |
| html lang | en | en | ok |
| H1 count | 0 | 0 | ok |
| H2 count | 33 | 33 | ok |
| images (with src) | 107 | 107 <br><sub>DOM has 107 <img>, 107 with a source</sub> | ok |
| images missing/empty alt | 0 | 1 <br><sub>no alt attr 0, empty alt 1</sub> | ok |
| links (scanner total vs real+hash anchors) | 347 | 348+3 hash | ok |
| JSON-LD types | 0 | 0 | ok |
| visible words (rendered) | 2976 | 2993 <br><sub>innerText vs markup count differ for hidden text; tolerance 30%</sub> | ok |
| hreflang present | false | false | ok |
| raw words (no JS) | 2964 | 3006 <br><sub>ground truth = real load with JavaScript disabled</sub> | ok |
| raw links (no JS) | 345 | 345 | ok |
| rendered words (facts) | 2976 | 2993 | ok |
| robots.txt blocks all | false | false | ok |
| sitemap found | true | true <br><sub>sitemap.xml HTTP 404, robots directive yes</sub> | ok |
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

1. **critical** Search or assistant crawlers are refused by the site: Perplexity-User.
2. **critical** No H1 heading is present in the crawled homepage markup, leaving the page without a single top-level heading for crawlers and assistive technology to anchor on.
3. **fix [high/aeo-geo]** Let search and assistant crawlers through your CDN or firewall. Perplexity-User (HTTP 403) was refused when requesting the home page with its published user agent. A page a crawler cannot fetch cannot be indexed or cited by the engine or assistant behind it. robots.txt allows it, so the site says "welcome" and then refuses. In your CDN, WAF or bot-protection settings, allow these crawlers (verify them by their vendor…
4. **fix [high/technical]** Add a single H1 to the homepage. The crawled homepage markup contains no H1 element. The page has 33 H2s and a very large number of H3s but no top-level heading, so neither search engines nor AI assistants get a single clear statement of what the page is. Add one visually appropriate H1 to the homepage template, e.g. 'Latest news, sport and opinion from the Guardian', matching the existing title tag. Keep it as the o…
5. **fix [medium/aeo-geo]** Add JSON-LD structured data to the homepage. The page has no JSON-LD structured data of any type. There is no Organization, WebSite, NewsArticle, ItemList or BreadcrumbList markup, which limits entity recognition and rich-result eligibility. Add JSON-LD to the homepage template: an Organization entity for the publisher (name, url, logo, sameAs profiles), a WebSite entity with name and url, and an ItemList or Collecti…
6. **fix [high/content]** Add Open Graph and Twitter Card metadata. The page has no Open Graph title, description, image or type, and no Twitter Card value. Shared links and assistant previews therefore have no controlled title, description or image. Add og:title, og:description, og:image, og:type and og:url to the homepage head, plus twitter:card, twitter:title, twitter:description and twitter:image. Use the same title and description as the…
7. **fix [medium/aeo-geo]** Lead the page with a direct answer or summary block. The opening visible text begins with navigation and a list of headlines rather than a short summary of what the page contains. AI assistants extract answers most reliably from a concise opening statement. Add a short, plain-language summary paragraph near the top of the homepage (for example, a one- or two-sentence 'Today's top stories' introduction) that states wh…
8. **fix [medium/performance]** Reduce page weight and request count. The HTML document is 1.2 MB and the full page transfer is 2.76 MB across 552 requests. While measured load time is good, this volume increases the risk of slow loads on mobile networks and for crawlers with limited budgets. Audit the 552 requests for render-blocking scripts, unused CSS and oversized images. Defer non-critical JavaScript, lazy-load below-the-fold images and media,…
9. **fix [low/technical]** Add a sitemap reference and keep it current. A sitemap was found for the site, which is good. Keeping it referenced and current helps crawlers discover new and updated stories quickly. Confirm the sitemap is declared in robots.txt, is limited to canonical URLs, and is regenerated as new stories publish. Submit it in Google Search Console and Bing Webmaster Tools.
10. **fix [low/aeo-geo]** Consider an llms.txt file as a low-priority experiment. No llms.txt file was found. This is optional and no major engine or assistant is confirmed to read it, so it should be treated as an experiment rather than a fix. Note: llms.txt is optional and not yet confirmed to be read by the major search engines or assistants, so treat it as low priority. If you choose to test it, publish a concise /llms.txt at the site roo…

Removed by the checker (6): "Stop refusing AI search and assistant crawlers tha" (robots.txt explicitly disallows Claude-SearchBot: ); "Declare language and regional versions with hrefla" (no alternate-language versions were found, so href); "PerplexityBot (search crawler) is refused with HTT" (it is about the same thing as a suggestion the evi); "Claude-SearchBot (search crawler) is refused with " (it is about the same thing as a suggestion the evi); "Claude-User (assistant crawler) is refused with HT" (it is about the same thing as a suggestion the evi); "Perplexity-User (assistant crawler) is refused wit" (it is about the same thing as a suggestion the evi)
Added by the checker: crawlers disallowed by robots.txt and refused, consistent with the site's policy: ClaudeBot, CCBot, Bytespider, Claude-SearchBot, PerplexityBot, Claude-User; search/assistant crawlers blocked

## Reviewer verdict

_to be completed by a human reviewer_

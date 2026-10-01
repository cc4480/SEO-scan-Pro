# 27-notion — https://www.notion.so

*SaaS marketing.* Animated sections, lazy images, hreflang.

Scan: 29.2s · scoreMethod **measured** · scores {"overall":83,"technical":92,"content":90,"aeoGeo":60,"performance":90} · simulated: false · AI used: true

## Measurements vs independent ground truth

| Fact | Scanner | Ground truth | |
|---|---|---|---|
| title | "The AI workspace that works for you. | Notion" | "The AI workspace that works for you. | Notion" | ok |
| meta description present | true | true | ok |
| canonical | https://www.notion.com/ | https://www.notion.com/ | ok |
| viewport present | true | true | ok |
| html lang | en-us | en-us | ok |
| H1 count | 1 | 1 | ok |
| H2 count | 6 | 6 | ok |
| images (with src) | 60 | 61 <br><sub>DOM has 61 <img>, 61 with a source</sub> | ok |
| images missing/empty alt | 51 | 52 <br><sub>no alt attr 3, empty alt 49</sub> | ok |
| links (scanner total vs real+hash anchors) | 94 | 94+0 hash | ok |
| JSON-LD types | 0 | 0 | ok |
| visible words (rendered) | 426 | 345 <br><sub>innerText vs markup count differ for hidden text; tolerance 30%</sub> | ok |
| hreflang present | true | true | ok |
| raw words (no JS) | 459 | 385 <br><sub>ground truth = real load with JavaScript disabled</sub> | ok |
| raw links (no JS) | 104 | 92 | ok |
| rendered words (facts) | 435 | 345 | ok |
| robots.txt blocks all | false | true | **MISMATCH** |
| sitemap found | true | true <br><sub>sitemap.xml HTTP 200, robots directive yes</sub> | ok |
| llms.txt found | true | true <br><sub>llms.txt HTTP 200</sub> | ok |
| header hsts | true | true | ok |
| header csp | true | true | ok |
| header xFrameOptions | true | true | ok |
| header xContentTypeOptions | false | false | ok |
| header referrerPolicy | true | true | ok |
| bot GPTBot | 200 | 200 | ok |
| bot ClaudeBot | 200 | 200 | ok |
| bot CCBot | 200 | 200 | ok |
| bot Bytespider | 403 blocked | 403 blocked | ok |
| bot OAI-SearchBot | 200 | 200 | ok |
| bot Claude-SearchBot | 200 | 200 | ok |
| bot PerplexityBot | 200 | 200 | ok |
| bot Googlebot | 403 blocked | 403 blocked | ok |
| bot Bingbot | 403 blocked | 403 blocked | ok |
| bot Applebot | 200 | 200 | ok |
| bot ChatGPT-User | 200 | 200 | ok |
| bot Claude-User | 200 | 200 | ok |
| bot Perplexity-User | 200 | 200 | ok |

## Findings (as shown to the user)

1. **critical** Search or assistant crawlers are refused by the site: Googlebot, Bingbot.
2. **critical** Two internal links in the 16-link sample return HTTP 404: https://www.notion.so/product/features and https://www.notion.so/product/demos. These are crawl-equity leaks and broken user journeys on the primary navigation path.
3. **critical** Googlebot and Bingbot both returned HTTP 403 to this audit while robotsTxtAllows is true for both — a contradiction that must be resolved, because if it reflects real edge/WAF behaviour it suppresses the two largest search indexes.
4. **critical** 51 of 60 images on the homepage have no alt text (missingAltCount 51), reducing accessibility compliance and removing image-level signal for both classic and AI image retrieval.
5. **critical** The homepage carries only 426 words of visible copy, which is thin for a page expected to rank for competitive 'AI workspace' and 'team collaboration' queries and to serve as a citable source for generative engines.
6. **fix [high/aeo-geo]** Let search and assistant crawlers through your CDN or firewall. These crawlers were refused when requesting the home page with their published user agents: Googlebot (HTTP 403), Bingbot (HTTP 403). Pages they cannot fetch cannot be indexed or cited by the engines and assistants behind them. robots.txt allows them, so the site is saying "welcome" and then refusing. In your CDN, WAF or bot-protection settings, allow th…
7. **fix [medium/aeo-geo]** Decide, and state, whether AI-training crawlers are welcome. Bytespider (HTTP 403) were refused even though robots.txt does not disallow them. Search and assistant crawlers (OAI-SearchBot, Claude-SearchBot, PerplexityBot, Applebot, ChatGPT-User, Claude-User) were let through, so answer-engine citation is not affected by this. Whether to block AI-training crawlers is the site owner's choice; the problem is only a mism…
   - ⚠ says OAI-SearchBot is blocked but it got HTTP 200
   - ⚠ says Claude-SearchBot is blocked but it got HTTP 200
   - ⚠ says PerplexityBot is blocked but it got HTTP 200
   - ⚠ says Applebot is blocked but it got HTTP 200
   - ⚠ says ChatGPT-User is blocked but it got HTTP 200
   - ⚠ says Claude-User is blocked but it got HTTP 200
8. **fix [high/technical]** Repair the two 404 internal links. The crawl sampled 16 links and found https://www.notion.so/product/features and https://www.notion.so/product/demos returning HTTP 404. Both sit on the homepage's primary product path, so every crawl and every user click on them is wasted. Decide the correct destination for each (likely the corresponding pages on the notion.com host after the domain migration). Update the href value…
9. **fix [medium/aeo-geo]** Deploy a JSON-LD entity graph on the homepage. structuredData.hasJsonLd is false and structuredData.types is empty, and rawHtmlVsRendered shows no schema type appears after JavaScript either. The page therefore offers generative engines no machine-readable identity, product or organisation facts to quote. Add a single <script type="application/ld+json"> block in the server-rendered <head> containing an @graph with: O…
10. **fix [medium/content]** Add meaningful alt text to content images. 51 of 60 images on the homepage have no alt attribute. Decorative images legitimately use empty alt, but this ratio indicates content imagery is unlabelled, which harms screen-reader users and removes image context that AI retrieval systems can use. Audit the 60 images and classify each as decorative or informative. Give informative images concise, specific alt text describi…
11. **fix [medium/content]** Expand homepage copy to support competitive queries. The homepage renders 426 words. That is thin for a page competing on 'AI workspace', 'team collaboration' and 'AI agents for teams', and it gives generative engines little extractable prose to cite. Add substantive server-rendered copy beneath the existing sections: a short paragraph per H2 explaining the capability (AI where your team works, one system of record, …
   - ⚠ quotes 1200 words; measured values are 345 rendered / 385 no-JS
12. **fix [medium/aeo-geo]** Add FAQPage markup for the questions the page already answers. The homepage makes several implicit claims (cited answers, agents, one system of record) but exposes no question-and-answer structure. FAQPage markup remains valid and helps machines parse intent, even though Google no longer renders FAQ rich results. Add a short FAQ section with 4–6 real questions users ask about the product, each with a direct two-to-th…
13. **fix [low/technical]** Tighten the redirect and canonical chain. The crawl records a redirect from https://www.notion.so/ to https://www.notion.com/, and the canonical already points at https://www.notion.com/. The chain is only two hops, so this is not a defect, but every remaining internal link still using the notion.so host adds an unnecessary hop. Sweep internal templates for absolute links still pointing at www.notion.so and rewrite t…
14. **fix [low/technical]** Add the missing X-Content-Type-Options header. securityHeaders shows xContentTypeOptions is false while HTTPS, HSTS, CSP, X-Frame-Options and Referrer-Policy are all present. This is a hardening gap, not a ranking factor. Add 'X-Content-Type-Options: nosniff' at the edge/CDN layer for all HTML responses and verify it appears in the response headers of the homepage.

Removed by the checker (3): "Resolve the Googlebot and Bingbot 403 responses" (replaced by a measured finding on the same topic); "Keep the AI crawler posture and make it explicit" (replaced by a measured finding on the same topic); "No structured data at all: structuredData.hasJsonL" (the gap is moderate (459 of 435 words are in the r)
Added by the checker: search/assistant crawlers blocked; AI-training crawler block

## Reviewer verdict

_to be completed by a human reviewer_

# 11-shopify — https://www.shopify.com

*SaaS marketing, multilingual.* hreflang alternates, JSON-LD, many sections.

Scan: 21.4s · scoreMethod **measured** · scores {"overall":95,"technical":93,"content":90,"aeoGeo":100,"performance":100} · simulated: false · AI used: true

## Measurements vs independent ground truth

| Fact | Scanner | Ground truth | |
|---|---|---|---|
| title | "Shopify: The All-in-One Commerce Platform for Bus | "Shopify: The All-in-One Commerce Platform for Bus | ok |
| meta description present | true | true | ok |
| canonical | https://www.shopify.com/ | https://www.shopify.com/ | ok |
| viewport present | true | true | ok |
| html lang | en | en | ok |
| H1 count | 1 | 1 | ok |
| H2 count | 6 | 6 | ok |
| images (with src) | 59 | 59 <br><sub>DOM has 59 <img>, 59 with a source</sub> | ok |
| images missing/empty alt | 48 | 48 <br><sub>no alt attr 0, empty alt 48</sub> | ok |
| links (scanner total vs real+hash anchors) | 184 | 184+2 hash | ok |
| JSON-LD types | 2 | 2 | ok |
| visible words (rendered) | 1073 | 767 <br><sub>innerText vs markup count differ for hidden text; tolerance 30%</sub> | ok |
| hreflang present | true | true | ok |
| raw words (no JS) | 1077 | 721 <br><sub>ground truth = real load with JavaScript disabled</sub> | ok |
| raw links (no JS) | 184 | 184 | ok |
| rendered words (facts) | 1082 | 767 | ok |
| robots.txt blocks all | false | false | ok |
| sitemap found | true | true <br><sub>sitemap.xml HTTP 200, robots directive yes</sub> | ok |
| llms.txt found | true | true <br><sub>llms.txt HTTP 200</sub> | ok |
| header hsts | true | true | ok |
| header csp | false | false | ok |
| header xFrameOptions | false | false | ok |
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

1. **critical** 48 of 59 images (81%) are missing alt text, which is an accessibility and content issue that can hinder image search and AI understanding.
2. **critical** The page has only 1,073 words, which is thin for a homepage of a major commerce platform and limits topical depth for AI and search engines.
3. **critical** No FAQ, HowTo, or review sections are present, reducing eligibility for rich results and direct-answer features.
4. **fix [high/content]** Add descriptive alt text to all meaningful images. 48 images on the homepage have no alt attribute. This harms accessibility and prevents search engines and AI models from understanding image content. Audit all 59 images on the homepage. For each image that conveys meaning (product screenshots, logos, icons), add a concise, descriptive alt attribute in the HTML. For purely decorative images, use an empty alt attribut…
5. **fix [high/content]** Expand homepage content with a FAQ section. The homepage has only 1,073 words and no FAQ section. Adding a FAQ can increase topical relevance and provide direct answers for voice search and AI assistants. Add a FAQ section to the homepage with 5–8 questions that potential customers might ask (e.g., 'What is Shopify?', 'How much does Shopify cost?', 'Can I use Shopify for my small business?'). Provide clear, concise a…
   - ⚠ quotes 60 words; measured values are 767 rendered / 721 no-JS
6. **fix [medium/technical]** Implement missing security headers. The site lacks Content-Security-Policy (CSP), X-Frame-Options, and Referrer-Policy headers, which can leave it more vulnerable to certain attacks and may affect trust signals. Configure the web server to send the following HTTP response headers: Content-Security-Policy (start with a report-only policy to avoid breakage), X-Frame-Options: SAMEORIGIN (or DENY), and Referrer-Policy: s…
7. **fix [medium/aeo-geo]** Add structured data for Organization and WebSite. The site currently has Corporation and ContactPoint schema, but lacks WebSite and Organization markup that can enhance entity understanding for AI and search engines. Add JSON-LD structured data for WebSite (with potentialAction for SearchAction) and Organization (with logo, sameAs links to social profiles, and contactPoint). Ensure the markup is valid and matches vis…
8. **fix [medium/aeo-geo]** Optimize for voice search with natural language questions. The homepage content is not optimized for voice search queries, which are typically longer and conversational. Identify common voice search queries related to Shopify (e.g., 'What is the best ecommerce platform for small business?', 'How do I start an online store?'). Incorporate these as headings or within FAQ answers using natural language. Ensure answers a…
9. **fix [low/technical]** Improve internal linking with descriptive anchor text. The homepage has 141 internal links, but anchor text quality was not assessed. Descriptive anchor text helps search engines understand linked pages. Review internal links on the homepage. Replace generic anchor text like 'click here' or 'learn more' with descriptive phrases that include relevant keywords (e.g., 'start your free Shopify trial', 'explore ecommerce …
10. **fix [low/content]** Enhance page content with customer testimonials or case studies. No genuine reviews or testimonials are visible on the homepage, which can reduce trust and conversion. Add a section featuring real customer testimonials or brief case studies. If reviews are collected, consider adding Review structured data (only if genuine and visible). Ensure testimonials are authentic and include names or business details.

Removed by the checker (0): none
Added by the checker: none

## Reviewer verdict

_to be completed by a human reviewer_

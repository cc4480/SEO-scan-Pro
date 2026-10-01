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

Reviewer R2. Counts: ACCURATE 1, INACCURATE 2, MISLEADING 5, UNSUPPORTED 1, SUBJECTIVE 1.
Summary: structure, schema, headers and link counts are measured correctly. The report is hurt by three
register issues: all 48 "missing alt" images are `alt=""` (valid decorative markup; ground: 0 without the
attribute) (A-08); the word count 1,073 includes 343 words of `display:none` text (a hidden `<nav>` of 221
words and the language popover of 108) while a reader sees 767 (A-09; verified with a live DOM walk); and
"critical" is used for items that are not (A-13). Two claims are false on the live page: Shopify does show
customer stories, and `Corporation` is already an Organization.

Measurement mismatches explained: visible/rendered/raw words 1073/1082/1077 vs 767/767/721 = scanner counts
CSS-hidden menu and popover text (A-09, scanner bug; the 30% tolerance hid it in the table). Everything else matches.

1. MISLEADING: all 48 are `alt=""` (decorative, valid), none lack the attribute; counted as "missing" (A-08). Severity "critical" not justified.
2. MISLEADING: 1,073 words is wrong (767 visible, 343 hidden-menu words counted, A-09); "thin" for a 767-word marketing homepage is also doubtful.
3. MISLEADING: no FAQ is true, but FAQ/HowTo rich results are no longer shown for ordinary sites (the report's own fix 5 says so) and the "review sections" part ignores the customer stories on the page; not critical.
4. INACCURATE: "48 images have no alt attribute": 0 lack it, 48 have an empty alt (ground: no attr 0, empty 48). Advice to use alt="" for decorative images is what they already do.
5. MISLEADING: quotes 1,073 words (really 767); "no FAQ" true. The "60 words" flag is noise (it is the advised answer length).
6. ACCURATE: live GET shows HSTS and nosniff only; no CSP, X-Frame-Options or Referrer-Policy.
7. MISLEADING: "lacks WebSite and Organization": the page has Corporation (a schema.org subtype of Organization, with logo, sameAs, contactPoint); only WebSite/SearchAction is genuinely missing.
8. UNSUPPORTED: "not optimized for voice search" cannot be derived from any measured evidence; generic advice.
9. SUBJECTIVE: 141 internal links is correct (ground 141); the report admits anchor text was not assessed, so the advice is generic boilerplate, low priority is reasonable.
10. INACCURATE: "No genuine reviews or testimonials ... visible": the page shows customer stories (Guests on Earth "$4M+ business", Our Place, Mattel; Steve Madden / Ornot / Glossier cards). Ratings/reviews markup is absent, but the advice to "add case studies" is wrong.

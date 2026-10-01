# 09-react-dev — https://react.dev

*documentation.* Docs site with many headings and few images.

Scan: 20.7s · scoreMethod **measured** · scores {"overall":89,"technical":85,"content":100,"aeoGeo":80,"performance":90} · simulated: false · AI used: true

## Measurements vs independent ground truth

| Fact | Scanner | Ground truth | |
|---|---|---|---|
| title | "React" | "React" | ok |
| meta description present | true | true | ok |
| canonical | https://react.dev/ | https://react.dev/ | ok |
| viewport present | true | true | ok |
| html lang | en | en | ok |
| H1 count | 2 | 2 | ok |
| H2 count | 15 | 15 | ok |
| images (with src) | 43 | 43 <br><sub>DOM has 43 <img>, 43 with a source</sub> | ok |
| images missing/empty alt | 0 | 24 <br><sub>no alt attr 0, empty alt 24</sub> | **MISMATCH** |
| links (scanner total vs real+hash anchors) | 98 | 98+0 hash | ok |
| JSON-LD types | 0 | 0 | ok |
| visible words (rendered) | 977 | 977 <br><sub>innerText vs markup count differ for hidden text; tolerance 30%</sub> | ok |
| hreflang present | true | true | ok |
| raw words (no JS) | 978 | 981 <br><sub>ground truth = real load with JavaScript disabled</sub> | ok |
| raw links (no JS) | 98 | 98 | ok |
| rendered words (facts) | 977 | 977 | ok |
| robots.txt blocks all | false | false | ok |
| sitemap found | false | false <br><sub>sitemap.xml HTTP 404, robots directive no</sub> | ok |
| llms.txt found | true | true <br><sub>llms.txt HTTP 200</sub> | ok |
| header hsts | true | true | ok |
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

1. **fix [high/technical]** Implement JSON-LD Structured Data for Organization and WebSite. The page has no structured data (JSON-LD) at all. This means search engines and AI systems cannot easily parse the site's entity type, name, logo, or social profiles, reducing eligibility for rich results and knowledge graph inclusion. Add JSON-LD script blocks to the homepage: 1) Organization schema with name 'React', url 'https://react.dev', logo URL (…
2. **fix [high/technical]** Add Missing Security Headers. The site is missing several important security headers: Content-Security-Policy (CSP), X-Frame-Options, X-Content-Type-Options, and Referrer-Policy. These headers protect against XSS, clickjacking, MIME-type sniffing, and referrer leakage, and their absence can impact trust signals and user safety. Configure the web server or CDN to send the following headers on all responses: 1) Content…
3. **fix [high/technical]** Create and Submit an XML Sitemap. No sitemap was found at the standard location (no sitemap was found). A sitemap helps search engines discover and index all important pages, especially for a large documentation site like React.dev. Generate an XML sitemap that includes all canonical URLs (homepage, docs pages, blog posts, etc.). Place it at https://react.dev/sitemap.xml. Reference it in robots.txt with 'Sitemap: htt…
4. **fix [medium/content]** Improve Image Alt Text for Informative Images. 24 images have empty alt text (alt=""), which is valid for decorative images but may be missing descriptive alt text for informative images. The audit shows images like 'cover.svg', 'andrew.jpg', 'lauren.jpg', etc., with empty alt. If these images convey meaning (e.g., speaker photos, diagrams), they need descriptive alt text for accessibility and image search. Review ea…
5. **fix [medium/aeo-geo]** Enhance Opening Text for Direct Answer Optimization. The opening text starts with 'React The library for web and native user interfaces Learn ReactAPI Reference...' which is somewhat fragmented. A clear, concise definition in the first paragraph can improve featured snippet and AI answer capture. Revise the first paragraph to include a direct, standalone definition: 'React is a JavaScript library for building user in…
   - ⚠ quotes 100 words; measured values are 977 rendered / 981 no-JS
6. **fix [low/aeo-geo]** Consider Adding llms.txt for AI Crawler Guidance. The site already has an llms.txt file (llmsTxtFound: true), which is good. However, ensure it is up-to-date and provides clear guidance for AI crawlers about preferred content and usage. Note: llms.txt is optional and not yet confirmed to be read by the major search engines or assistants, so treat it as low priority. Review the existing llms.txt file to ensure it list…
   - ⚠ says llms.txt is missing but it exists

Removed by the checker (2): "Add FAQPage Structured Data for Common Questions" (the page has no visible question-and-answer conten); "Add BreadcrumbList Structured Data for Documentati" (a homepage has no breadcrumb trail to mark up)
Added by the checker: none

## Reviewer verdict

_to be completed by a human reviewer_

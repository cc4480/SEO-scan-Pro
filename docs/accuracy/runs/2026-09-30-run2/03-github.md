# 03-github — https://github.com

*marketing, SSR + JS.* Heavy marketing page with many images and videos.

Scan: 17.4s · scoreMethod **measured** · scores {"overall":91,"technical":100,"content":100,"aeoGeo":80,"performance":80} · simulated: false · AI used: true

## Measurements vs independent ground truth

| Fact | Scanner | Ground truth | |
|---|---|---|---|
| title | "GitHub · Change is constant. GitHub keeps you ahe | "GitHub · Change is constant. GitHub keeps you ahe | ok |
| meta description present | true | true | ok |
| canonical | https://github.com | https://github.com | ok |
| viewport present | true | true | ok |
| html lang | en | en | ok |
| H1 count | 1 | 1 | ok |
| H2 count | 10 | 10 | ok |
| images (with src) | 24 | 24 <br><sub>DOM has 24 <img>, 24 with a source</sub> | ok |
| images missing/empty alt | 0 | 17 <br><sub>no alt attr 0, empty alt 17</sub> | **MISMATCH** |
| links (scanner total vs real+hash anchors) | 135 | 135+8 hash | ok |
| JSON-LD types | 0 | 0 | ok |
| visible words (rendered) | 878 | 878 <br><sub>innerText vs markup count differ for hidden text; tolerance 30%</sub> | ok |
| hreflang present | true | true | ok |
| raw words (no JS) | 820 | 811 <br><sub>ground truth = real load with JavaScript disabled</sub> | ok |
| raw links (no JS) | 135 | 135 | ok |
| rendered words (facts) | 878 | 878 | ok |
| robots.txt blocks all | false | false | ok |
| sitemap found | false | false <br><sub>sitemap.xml HTTP 406, robots directive no</sub> | ok |
| llms.txt found | true | true <br><sub>llms.txt HTTP 200</sub> | ok |
| header hsts | true | true | ok |
| header csp | true | true | ok |
| header xFrameOptions | true | true | ok |
| header xContentTypeOptions | true | true | ok |
| header referrerPolicy | true | true | ok |
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

1. **fix [high/aeo-geo]** Add JSON-LD structured data for Organization and WebSite. The page contains no JSON-LD structured data, which means search engines and AI assistants cannot easily identify GitHub as an organization or the site as a website. This reduces eligibility for rich results and knowledge graph inclusion. Add a JSON-LD script block to the <head> of the homepage. Include an Organization entity with name, url, logo, sameAs (link…
2. **fix [medium/aeo-geo]** Improve direct answer friendliness in opening text. The opening text begins with a descriptive narrative about characters and animations, rather than a concise definition or summary of what GitHub is and what it offers. This makes it harder for AI assistants to extract a direct answer when users ask 'What is GitHub?' or similar queries. Revise the first paragraph of visible text to lead with a clear, factual statemen…
   - ⚠ quotes 50 words; measured values are 878 rendered / 811 no-JS
3. **fix [medium/content]** Add alt text to images missing it. One image (particles-170bd1fd231f4669.png) lacks an alt attribute. While decorative images with empty alt are valid, a missing alt attribute is an accessibility and content gap that can hinder screen readers and image understanding by AI. Add an appropriate alt attribute to the image. If it is purely decorative, use alt="". If it conveys meaning, provide a concise description. Do no…
4. **fix [medium/performance]** Reduce total page weight. The total transfer size is 3830.5 KB, which is large and can slow down page load for users on slower connections, potentially affecting Core Web Vitals and user experience. Optimize images by compressing them and serving next-gen formats like WebP or AVIF. Consider lazy-loading below-the-fold images. Minify CSS and JavaScript, and leverage browser caching. Use a CDN to serve assets closer to…
5. **fix [low/aeo-geo]** Consider adding an llms.txt file. The site does not have an llms.txt file. While not confirmed to be read by major AI engines, it is a low-effort way to provide guidance to AI crawlers about the site's content. Note: llms.txt is optional and not yet confirmed to be read by the major search engines or assistants, so treat it as low priority. Create a plain text file at /llms.txt that lists key pages and provides a bri…
   - ⚠ says llms.txt is missing but it exists

Removed by the checker (0): none
Added by the checker: none

## Reviewer verdict

_to be completed by a human reviewer_

# 23-python — https://www.python.org

*traditional site.* Classic server-rendered site with few scripts.

Scan: 20.5s · scoreMethod **measured** · scores {"overall":92,"technical":85,"content":100,"aeoGeo":92,"performance":93} · simulated: false · AI used: true

## Measurements vs independent ground truth

| Fact | Scanner | Ground truth | |
|---|---|---|---|
| title | "Welcome to Python.org" | "Welcome to Python.org" | ok |
| meta description present | true | true | ok |
| canonical | - | - | ok |
| viewport present | true | true | ok |
| html lang | en | en | ok |
| H1 count | 5 | 5 | ok |
| H2 count | 9 | 9 | ok |
| images (with src) | 1 | 1 <br><sub>DOM has 1 <img>, 1 with a source</sub> | ok |
| images missing/empty alt | 0 | 0 <br><sub>no alt attr 0, empty alt 0</sub> | ok |
| links (scanner total vs real+hash anchors) | 219 | 219+11 hash | ok |
| JSON-LD types | 2 | 2 | ok |
| visible words (rendered) | 544 | 548 <br><sub>innerText vs markup count differ for hidden text; tolerance 30%</sub> | ok |
| hreflang present | false | false | ok |
| raw words (no JS) | 559 | 559 <br><sub>ground truth = real load with JavaScript disabled</sub> | ok |
| raw links (no JS) | 204 | 204 | ok |
| rendered words (facts) | 544 | 548 | ok |
| robots.txt blocks all | false | false | ok |
| sitemap found | false | false <br><sub>sitemap.xml HTTP 404, robots directive no</sub> | ok |
| llms.txt found | false | false <br><sub>llms.txt HTTP 404 (HTML, not a real llms.txt)</sub> | ok |
| header hsts | true | true | ok |
| header csp | false | false | ok |
| header xFrameOptions | true | true | ok |
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

1. **fix [high/technical]** Add a self-referencing canonical URL. The homepage has no canonical link element. Without it, search engines and AI retrieval systems must infer the preferred URL, and any parameterised or trailing-slash variants of https://www.python.org/ can be treated as separate documents. In the <head> of the homepage template, add <link rel="canonical" href="https://www.python.org/">. Ensure the same canonical is emitted on eve…
2. **fix [medium/aeo-geo]** Lead the page with a direct, extractable definition of Python. The first visible text on the page is a JavaScript-fallback notice ('This page displays a fallback because interactive scripts did not run...') followed by navigation. The first substantive sentence is 'Python is a programming language that lets you work more quickly and integrate your systems more effectively.' Because the opening text is dominated by bo…
3. **fix [medium/technical]** Add Open Graph image dimensions and a Twitter card. The page declares og:title, og:description, og:image and og:type, but no og:image:width/height and no twitter:card. Social and AI surfaces that render link previews may crop or mis-size the preview image, and X/Twitter will not render a large-image card. Add <meta property="og:image:width" content="200"> and <meta property="og:image:height" content="200"> matching t…
4. **fix [medium/technical]** Publish and reference an XML sitemap. No sitemap was detected during the crawl. A sitemap helps Google, Bing and AI search crawlers discover the full set of documentation, download and community pages, which is valuable on a large site like python.org. Generate an XML sitemap covering the main sections (downloads, docs, community, jobs, news, events) and host it at https://www.python.org/sitemap.xml. Reference it fro…
5. **fix [medium/content]** Tighten the meta description and remove the keyword meta tag. The meta description is 'The official home of the Python Programming Language' — accurate but short, and it does not mention what Python is used for, which reduces click-through and snippet relevance. A legacy keywords meta tag is also present; it is ignored by Google and adds no value. Rewrite the description to roughly 150–160 characters, e.g. 'Python is…
6. **fix [medium/performance]** Reduce layout shift to bring CLS under 0.1. Lab measurement from the auditing host records CLS 0.119, marginally above the 0.1 'good' threshold. This is a lab figure, not field data, but it indicates elements are shifting during load — commonly fonts, images or injected banners. Reserve space for the logo and any above-the-fold images with explicit width and height attributes or CSS aspect-ratio. Preload the primary …
7. **fix [low/technical]** Enforce the Content-Security-Policy. A Content-Security-Policy is present in report-only mode. Report-only does not block anything; it only reports violations. Enforcing it hardens the site against injection and is a trust signal for security-conscious users and crawlers. Review the report-only violation reports, fix any legitimate breakages, then switch the header from Content-Security-Policy-Report-Only to Content-…
8. **fix [low/aeo-geo]** Add a low-priority llms.txt file. No llms.txt file was found. This is an optional convention that is not confirmed to be read by any major engine or assistant, so it should not be treated as a ranking lever. Note: llms.txt is optional and not yet confirmed to be read by the major search engines or assistants, so treat it as low priority. Optionally publish a plain-text /llms.txt at the site root listing the key docum…

Removed by the checker (0): none
Added by the checker: none

## Reviewer verdict

_to be completed by a human reviewer_

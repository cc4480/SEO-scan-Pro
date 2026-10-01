# 16-reddit — https://www.reddit.com

*SPA, bot defences.* Client-heavy app that may block automated access.

Scan: 24.1s · scoreMethod **measured** · scores {"overall":70,"technical":58,"content":80,"aeoGeo":74,"performance":68} · simulated: false · AI used: true

## Measurements vs independent ground truth

| Fact | Scanner | Ground truth | |
|---|---|---|---|
| title | "Reddit - The heart of the internet" | "Reddit - The heart of the internet" | ok |
| meta description present | true | true | ok |
| canonical | https://www.reddit.com/ | https://www.reddit.com/ | ok |
| viewport present | true | true | ok |
| html lang | en-US | en-US | ok |
| H1 count | 0 | 0 | ok |
| H2 count | 1 | 1 | ok |
| images (with src) | 125 | 237 <br><sub>DOM has 301 <img>, 237 with a source</sub> | **MISMATCH** |
| images missing/empty alt | 1 | 129 <br><sub>no alt attr 1, empty alt 128</sub> | **MISMATCH** |
| links (scanner total vs real+hash anchors) | 186 | 292+1 hash | **MISMATCH** |
| JSON-LD types | 0 | 0 | ok |
| visible words (rendered) | 2120 | 3963 <br><sub>innerText vs markup count differ for hidden text; tolerance 30%</sub> | **MISMATCH** |
| hreflang present | false | false | ok |
| raw words (no JS) | 76 | 11 <br><sub>ground truth = real load with JavaScript disabled</sub> | **MISMATCH** |
| raw links (no JS) | 18 | 18 | ok |
| rendered words (facts) | 2120 | 3963 | **MISMATCH** |
| robots.txt blocks all | true | true | ok |
| sitemap found | true | true <br><sub>sitemap.xml HTTP 200, robots directive no</sub> | ok |
| llms.txt found | true | false <br><sub>llms.txt HTTP 200 (HTML, not a real llms.txt)</sub> | **MISMATCH** |
| header hsts | true | true | ok |
| header csp | true | true | ok |
| header xFrameOptions | true | true | ok |
| header xContentTypeOptions | true | true | ok |
| header referrerPolicy | false | false | ok |
| bot GPTBot | 403 blocked | 403 blocked | ok |
| bot ClaudeBot | 429 blocked | 429 blocked | ok |
| bot CCBot | 429 blocked | 429 blocked | ok |
| bot Bytespider | 429 blocked | 429 blocked | ok |
| bot OAI-SearchBot | 200 | 200 | ok |
| bot Claude-SearchBot | 200 | 200 | ok |
| bot PerplexityBot | 200 | 200 | ok |
| bot Googlebot | 403 | 403 blocked <br><sub>bot rules can vary run to run; re-check</sub> | **MISMATCH** |
| bot Bingbot | 403 | 403 blocked <br><sub>bot rules can vary run to run; re-check</sub> | **MISMATCH** |
| bot Applebot | 200 | 200 | ok |
| bot ChatGPT-User | 403 blocked | 403 blocked | ok |
| bot Claude-User | 200 | 200 | ok |
| bot Perplexity-User | 200 | 200 | ok |

## Findings (as shown to the user)

1. **critical** robots.txt disallows every crawler from the entire site, which blocks search engines and AI retrieval systems from indexing any page.
2. **critical** The homepage has no H1 heading, leaving the primary topical signal to the page title alone.
3. **fix [high/content]** Add a single descriptive H1 to the homepage. The rendered homepage contains no H1 element. The only headings present are an H2 reading "Popular Communities". Without an H1, the page gives crawlers and AI systems no explicit primary heading to anchor the page's topic. Add one H1 near the top of the main content that describes the page in plain language, for example a short statement of what Reddit is and what the home…
4. **fix [medium/technical]** Give the homepage a meta robots directive. The homepage carries no meta robots tag. While the absence of the tag defaults to index,follow, an explicit directive removes ambiguity for crawlers and makes the intent auditable. Add a meta robots tag to the homepage head with content="index, follow" (or the intended policy). Confirm the tag appears in the rendered HTML and matches the policy expressed in robots.txt.
5. **fix [low/content]** Add alt text to the image that lacks it. One image on the page has no alt attribute at all. A further 61 images correctly use empty alt text, which is valid for decorative images and needs no change. Locate the single image with no alt attribute and add a concise, descriptive alt value. Leave the 61 decorative images with empty alt text exactly as they are. This is an accessibility and content-quality improvement, no…
   - ⚠ quotes 61 images; page has 301 (129 without useful alt)
6. **fix [medium/performance]** Reduce page weight and request count. The homepage transfers roughly 4.5 MB across 129 requests. The measured load time of 2.76 s is dominated by network transfer rather than server response, since TTFB is only 125 ms. This is a payload and asset-count issue, not a front-end rendering failure. Audit the largest transferred assets and the request list for the homepage. Compress and modernise image formats, defer or la…
7. **fix [medium/content]** Strengthen the social sharing metadata. The Open Graph description is empty and the Open Graph image points to a favicon asset rather than a dedicated share image. The Twitter card is set to summary. Populate the Open Graph description with a concise summary of the site, and replace the Open Graph image with a purpose-built share image at the recommended dimensions. Consider upgrading the Twitter card to summary_larg…
8. **fix [low/aeo-geo]** Consider an llms.txt file as a low-priority enhancement. The crawl indicates an llms.txt file is present. This file is optional and is not confirmed to be read by any major search engine or AI assistant, so it should be treated as a low-priority enhancement only. Note: llms.txt is optional and not yet confirmed to be read by the major search engines or assistants, so treat it as low priority. If the file exists, keep…

Removed by the checker (3): "Resolve the site-wide robots.txt disallow" (robots.txt explicitly disallows OAI-SearchBot: adv); "Introduce Organization and WebSite structured data" (a homepage has no breadcrumb trail to mark up); "Add a referrer policy header" (the site already sends Content-Security-Policy-Rep)
Added by the checker: crawlers disallowed by robots.txt and refused, consistent with the site's policy: GPTBot, ClaudeBot, CCBot, Bytespider, ChatGPT-User

## Reviewer verdict

_to be completed by a human reviewer_

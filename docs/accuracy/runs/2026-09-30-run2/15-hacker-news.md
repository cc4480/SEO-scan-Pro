# 15-hacker-news — https://news.ycombinator.com

*minimal HTML.* Table layout, no images, no meta description, no JSON-LD.

Scan: 19.3s · scoreMethod **measured** · scores {"overall":78,"technical":96,"content":50,"aeoGeo":66,"performance":100} · simulated: false · AI used: true

## Measurements vs independent ground truth

| Fact | Scanner | Ground truth | |
|---|---|---|---|
| title | "Hacker News" | "Hacker News" | ok |
| meta description present | false | false | ok |
| canonical | - | - | ok |
| viewport present | true | true | ok |
| html lang | en | en | ok |
| H1 count | 0 | 0 | ok |
| H2 count | 0 | 0 | ok |
| images (with src) | 3 | 3 <br><sub>DOM has 3 <img>, 3 with a source</sub> | ok |
| images missing/empty alt | 3 | 3 <br><sub>no alt attr 3, empty alt 0</sub> | ok |
| links (scanner total vs real+hash anchors) | 225 | 225+1 hash | ok |
| JSON-LD types | 0 | 0 | ok |
| visible words (rendered) | 660 | 660 <br><sub>innerText vs markup count differ for hidden text; tolerance 30%</sub> | ok |
| hreflang present | false | false | ok |
| raw words (no JS) | 660 | 660 <br><sub>ground truth = real load with JavaScript disabled</sub> | ok |
| raw links (no JS) | 225 | 225 | ok |
| rendered words (facts) | 660 | 660 | ok |
| robots.txt blocks all | false | false | ok |
| sitemap found | false | false <br><sub>sitemap.xml HTTP 419, robots directive no</sub> | ok |
| llms.txt found | false | false <br><sub>llms.txt HTTP 404 (HTML, not a real llms.txt)</sub> | ok |
| header hsts | true | true | ok |
| header csp | true | true | ok |
| header xFrameOptions | true | true | ok |
| header xContentTypeOptions | true | true | ok |
| header referrerPolicy | true | true | ok |
| bot GPTBot | 419 | 419 | ok |
| bot ClaudeBot | 419 | 419 | ok |
| bot CCBot | 200 | 200 | ok |
| bot Bytespider | 200 | 200 | ok |
| bot OAI-SearchBot | 419 | 419 | ok |
| bot Claude-SearchBot | 419 | 419 | ok |
| bot PerplexityBot | 200 | 200 | ok |
| bot Googlebot | 419 | 419 | ok |
| bot Bingbot | 419 | 419 | ok |
| bot Applebot | 419 | 419 | ok |
| bot ChatGPT-User | 419 | 419 | ok |
| bot Claude-User | 200 | 200 | ok |
| bot Perplexity-User | 200 | 200 | ok |

## Findings (as shown to the user)

1. **fix [high/content]** Add a meta description to the homepage. The homepage has a title ("Hacker News") but the meta description is empty. Search engines and AI assistants have no ready-made summary to display or quote, so they must invent one from the raw link list. Add a concise meta description of roughly 140-160 characters that explains what the page is, e.g. "Hacker News: technology and startup news ranked by the community, with discu…
2. **fix [high/technical]** Add a canonical URL to the homepage. No canonical link element is present. Without it, search engines may treat parameterised or alternate URLs of the homepage as duplicates. Add <link rel="canonical" href="https://news.ycombinator.com/" /> to the <head> of the homepage template.
3. **fix [high/content]** Add Open Graph and Twitter Card tags. The page has no Open Graph title, description, image or type, and no Twitter Card. When the homepage is shared on social platforms or surfaced in chat previews, it renders as a bare link. Add og:title, og:description, og:type (website), og:url and og:image, plus twitter:card (summary or summary_large_image), twitter:title and twitter:description to the homepage <head>. Reuse the …
4. **fix [medium/content]** Add a visible H1 heading. The page contains no H1 element. A single descriptive H1 helps search engines and AI systems understand the page's primary topic. Add one H1 near the top of the page, such as "Hacker News", styled to match the existing visual design so it does not disrupt the layout.
5. **fix [medium/content]** Add alt text to images that lack it. Three images on the page have no alt attribute at all. This is an accessibility and content-completeness gap; it is not a critical ranking failure. For each image without an alt attribute, add a short descriptive alt value. If an image is purely decorative, use alt="" so assistive technology skips it.
6. **fix [high/aeo-geo]** Add a short plain-language summary at the top of the page. The first visible text is a raw list of story headlines, point counts and comment counts. There is no sentence that directly answers "what is this page?" for an AI assistant or voice engine to quote. Add one or two sentences immediately below the H1, e.g. "Hacker News is a community-ranked list of the most discussed technology and startup stories right now." …
7. **fix [high/technical]** Investigate HTTP 419 responses to AI and search crawlers. Several crawlers received HTTP 419 responses during testing, including GPTBot, ClaudeBot, OAI-SearchBot, Claude-SearchBot, Googlebot, Bingbot, Applebot and ChatGPT-User. Because the site refuses non-browser clients broadly, these cannot be confirmed as deliberate blocks, but they may reduce AI and search visibility if they persist. Check server logs and Google…
   - ⚠ says GPTBot is blocked but it got HTTP 419
   - ⚠ says ClaudeBot is blocked but it got HTTP 419
   - ⚠ says OAI-SearchBot is blocked but it got HTTP 419
   - ⚠ says Claude-SearchBot is blocked but it got HTTP 419
   - ⚠ says Googlebot is blocked but it got HTTP 419
   - ⚠ says Bingbot is blocked but it got HTTP 419
   - ⚠ says Applebot is blocked but it got HTTP 419
   - ⚠ says ChatGPT-User is blocked but it got HTTP 419
8. **fix [low/aeo-geo]** Consider adding an llms.txt file. No llms.txt file was found. This file is optional and not confirmed to be read by any major engine or assistant, so it offers no guaranteed retrieval or citation benefit. Note: llms.txt is optional and not yet confirmed to be read by the major search engines or assistants, so treat it as low priority. If you want to experiment, publish a plain-text llms.txt at the site root describin…

Removed by the checker (2): "Add Organization and WebSite structured data" (the page has no visible question-and-answer conten); "Review robots.txt and sitemap availability" (the sitemap request was refused or failed, so whet)
Added by the checker: none

## Reviewer verdict

_to be completed by a human reviewer_

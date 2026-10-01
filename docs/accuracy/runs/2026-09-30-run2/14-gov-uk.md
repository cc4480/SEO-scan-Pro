# 14-gov-uk — https://www.gov.uk

*government, minimal.* Lean, accessible markup; very few images.

Scan: 20.7s · scoreMethod **measured** · scores {"overall":88,"technical":100,"content":100,"aeoGeo":72,"performance":73} · simulated: false · AI used: true

## Measurements vs independent ground truth

| Fact | Scanner | Ground truth | |
|---|---|---|---|
| title | "Welcome to GOV.UK" | "Welcome to GOV.UK" | ok |
| meta description present | true | true | ok |
| canonical | https://www.gov.uk/ | https://www.gov.uk/ | ok |
| viewport present | true | true | ok |
| html lang | en | en | ok |
| H1 count | 1 | 1 | ok |
| H2 count | 13 | 13 | ok |
| images (with src) | 4 | 4 <br><sub>DOM has 4 <img>, 4 with a source</sub> | ok |
| images missing/empty alt | 0 | 4 <br><sub>no alt attr 0, empty alt 4</sub> | **MISMATCH** |
| links (scanner total vs real+hash anchors) | 106 | 106+1 hash | ok |
| JSON-LD types | 0 | 0 | ok |
| visible words (rendered) | 582 | 582 <br><sub>innerText vs markup count differ for hidden text; tolerance 30%</sub> | ok |
| hreflang present | false | false | ok |
| raw words (no JS) | 536 | 536 <br><sub>ground truth = real load with JavaScript disabled</sub> | ok |
| raw links (no JS) | 106 | 106 | ok |
| rendered words (facts) | 582 | 582 | ok |
| robots.txt blocks all | false | false | ok |
| sitemap found | true | true <br><sub>sitemap.xml HTTP 200, robots directive yes</sub> | ok |
| llms.txt found | false | false <br><sub>llms.txt HTTP 404 (HTML, not a real llms.txt)</sub> | ok |
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

1. **fix [high/aeo-geo]** Add JSON-LD structured data to define the GOV.UK entity. The homepage contains no JSON-LD structured data at all. Search engines and AI assistants therefore have to infer what GOV.UK is from prose alone. A clear entity graph (Organization/GovernmentOrganization, WebSite, and a SearchAction pointing at the real search URL) gives Google, Bing, Gemini, ChatGPT Search and Perplexity an unambiguous machine-readable identi…
2. **fix [high/aeo-geo]** Add a direct, quotable answer near the top of the page. The first visible words on the page are a list of links and service names ('Popular on GOV.UK', 'HMRC account: sign in', etc.). There is no self-contained sentence that defines what GOV.UK is or what a visitor can do here. Generative engines and voice assistants prefer a short, declarative answer they can lift verbatim. Insert one or two plain sentences immediat…
   - ⚠ quotes 40 words; measured values are 582 rendered / 536 no-JS
3. **fix [medium/performance]** Fix the poor Cumulative Layout Shift (CLS 0.242). Lab measurement shows a CLS of 0.242, well above the 0.1 'good' threshold. This indicates visible elements shift during load, which harms user experience and can affect how search engines assess page experience. Note: TTFB (1167 ms) dominates total load time (1518 ms), so the front-end is not the cause of slow loading — the layout shift is a separate, real defect. (Me…
4. **fix [medium/content]** Add descriptive alt text to the four content images. Four images on the page (find-a-job, national-insurance-featured, cost-of-living-featured, govuk-app-icon) currently carry empty alt text (alt=""). Empty alt is valid for purely decorative images, but these appear to be content images tied to specific services, so a short description would improve accessibility and give search engines additional context. For each o…
5. **fix [medium/technical]** Add Twitter Card metadata. Open Graph tags are present (og:title, og:description, og:image), but no Twitter Card tag is set. When the page is shared on X/Twitter, the platform will fall back to Open Graph, which usually works but can produce inconsistent previews. Add <meta name="twitter:card" content="summary_large_image"> and a matching twitter:title, twitter:description and twitter:image (reuse the existing Open G…
6. **fix [medium/aeo-geo]** Improve internal link discoverability for AI crawlers. The page has 106 links, 105 of which are internal. This is healthy, but the opening text is dominated by link labels rather than explanatory prose. AI retrieval systems that summarise pages benefit from a short, descriptive sentence around key link clusters so they can understand the relationship between the page and its destinations. Add a one-sentence introduct…
7. **fix [low/aeo-geo]** Consider adding an llms.txt file (low priority). No llms.txt file was found at the site root. This file is an emerging, optional convention for giving AI assistants a curated map of key content. It is not confirmed to be read by any major engine or assistant, so treat it as a low-priority experiment, not a requirement. Note: llms.txt is optional and not yet confirmed to be read by the major search engines or assistan…

Removed by the checker (0): none
Added by the checker: none

## Reviewer verdict

_to be completed by a human reviewer_

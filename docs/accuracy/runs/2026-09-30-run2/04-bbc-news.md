# 04-bbc-news — https://www.bbc.com/news

*news portal.* Hundreds of links and images, JSON-LD, hreflang-style editions.

Scan: 24.3s · scoreMethod **measured** · scores {"overall":92,"technical":97,"content":93,"aeoGeo":92,"performance":85} · simulated: false · AI used: true

## Measurements vs independent ground truth

| Fact | Scanner | Ground truth | |
|---|---|---|---|
| title | "BBC News - Breaking news, video and the latest to | "BBC News - Breaking news, video and the latest to | ok |
| meta description present | true | true | ok |
| canonical | https://www.bbc.com/news | https://www.bbc.com/news | ok |
| viewport present | true | true | ok |
| html lang | en-GB | en-GB | ok |
| H1 count | 1 | 1 | ok |
| H2 count | 53 | 53 | ok |
| images (with src) | 30 | 25 <br><sub>DOM has 25 <img>, 25 with a source</sub> | **MISMATCH** |
| images missing/empty alt | 10 | 5 <br><sub>no alt attr 5, empty alt 0</sub> | **MISMATCH** |
| links (scanner total vs real+hash anchors) | 163 | 163+1 hash | ok |
| JSON-LD types | 2 | 2 | ok |
| visible words (rendered) | 1363 | 1362 <br><sub>innerText vs markup count differ for hidden text; tolerance 30%</sub> | ok |
| hreflang present | true | true | ok |
| raw words (no JS) | 1358 | 1328 <br><sub>ground truth = real load with JavaScript disabled</sub> | ok |
| raw links (no JS) | 246 | 246 | ok |
| rendered words (facts) | 1363 | 1362 | ok |
| robots.txt blocks all | false | false | ok |
| sitemap found | true | true <br><sub>sitemap.xml HTTP 200, robots directive yes</sub> | ok |
| llms.txt found | false | false <br><sub>llms.txt HTTP 404 (HTML, not a real llms.txt)</sub> | ok |
| header hsts | true | true | ok |
| header csp | false | false | ok |
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
| bot Perplexity-User | 403 blocked | 403 blocked | ok |

## Findings (as shown to the user)

1. **fix [high/technical]** Add an Open Graph image and a Twitter card. The page's social metadata includes an Open Graph title, description and type, but the Open Graph image field is empty and there is no Twitter card value. When the page is shared on social platforms or in messaging apps, it will render without a preview image, reducing click-through. Set an Open Graph image (og:image) to a representative, correctly sized image for the news …
2. **fix [medium/aeo-geo]** Strengthen the top-of-page answer for AI assistants. The first visible text on the page opens directly with a headline ("US death row inmate Christa Pike taken to hospital...") followed by a one-line summary and a timestamp. There is no short, self-contained sentence that states what BBC News is or what the page offers. AI assistants and answer engines extract such opening statements when summarising or citing a sour…
3. **fix [low/aeo-geo]** Add a low-priority llms.txt file. No llms.txt file was found at the site root. This file is optional and is not confirmed to be read by any major search engine or AI assistant, so it should be treated as a low-priority experiment rather than a fix. Note: llms.txt is optional and not yet confirmed to be read by the major search engines or assistants, so treat it as low priority. If you choose to publish one, place a p…

Removed by the checker (2): "Add alt text to the 10 images that have none" (30 images are said to have no alt attribute, but o); "Consider whether the AI-crawler policy matches you" (replaced by a measured finding on the same topic)
Added by the checker: crawlers disallowed by robots.txt and refused, consistent with the site's policy: Perplexity-User

## Reviewer verdict

_to be completed by a human reviewer_

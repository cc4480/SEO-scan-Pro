# 28-canva — https://www.canva.com

*SaaS marketing, multilingual.* Many locales, heavy imagery.

Scan: 18s · scoreMethod **illustrative** · scores {"overall":77,"technical":95,"content":79,"aeoGeo":70,"performance":62} · simulated: false · AI used: true

## Measurements vs independent ground truth

| Fact | Scanner | Ground truth | |
|---|---|---|---|
| title | "Unsupported client – Canva" | "Canva: Visual Suite for Everyone" | **MISMATCH** |
| meta description present | true | true | ok |
| canonical | - | https://www.canva.com/ | **MISMATCH** |
| viewport present | true | true | ok |
| html lang | en | en | ok |
| H1 count | 1 | 1 | ok |
| H2 count | 0 | 36 | **MISMATCH** |
| images (with src) | 4 | 7 <br><sub>DOM has 7 <img>, 7 with a source</sub> | ok |
| images missing/empty alt | 4 | 5 <br><sub>no alt attr 0, empty alt 5</sub> | ok |
| links (scanner total vs real+hash anchors) | 6 | 411+5 hash | **MISMATCH** |
| JSON-LD types | 0 | 2 <br><sub>differs: ContactPoint, Organization</sub> | **MISMATCH** |
| visible words (rendered) | 54 | 738 <br><sub>innerText vs markup count differ for hidden text; tolerance 30%</sub> | **MISMATCH** |
| hreflang present | false | true | **MISMATCH** |
| raw words (no JS) | 31 | 31 <br><sub>ground truth = real load with JavaScript disabled</sub> | ok |
| raw links (no JS) | 1 | 1 | ok |
| rendered words (facts) | 54 | 738 | **MISMATCH** |
| robots.txt blocks all | false | false | ok |
| sitemap found | true | true <br><sub>sitemap.xml HTTP 403, robots directive yes</sub> | ok |
| llms.txt found | false | false <br><sub>llms.txt HTTP 403 (HTML, not a real llms.txt)</sub> | ok |
| header hsts | true | true | ok |
| header csp | true | true | ok |
| header xFrameOptions | true | true | ok |
| header xContentTypeOptions | true | true | ok |
| header referrerPolicy | true | true | ok |
| bot GPTBot | 403 | 403 | ok |
| bot ClaudeBot | 403 | 403 | ok |
| bot CCBot | 403 | 403 | ok |
| bot Bytespider | 403 | 403 | ok |
| bot OAI-SearchBot | 403 | 403 | ok |
| bot Claude-SearchBot | 403 | 403 | ok |
| bot PerplexityBot | 403 | 403 | ok |
| bot Googlebot | 403 | 403 | ok |
| bot Bingbot | 403 | 403 | ok |
| bot Applebot | 403 | 403 | ok |
| bot ChatGPT-User | 403 | 403 | ok |
| bot Claude-User | 403 | 403 | ok |
| bot Perplexity-User | 403 | 403 | ok |

## Findings (as shown to the user)

1. **critical** The site served a bot challenge (the page title is "Unsupported client – Canva", the wording of a bot-check or blocked page) so the real page could not be audited.
2. **fix [medium/technical]** Check whether bot protection is blocking automated clients. The scanner was shown a challenge page (the page title is "Unsupported client – Canva", the wording of a bot-check or blocked page) instead of canva.com. Bot-protection or CDN rules that challenge headless or automated clients can also stop search engines and AI crawlers from reading the site, though verified crawlers are often exempt. Look at your CDN, WAF …
3. **fix [low/technical]** Re-run the audit once the site is readable. No audit of the real page took place, so there is nothing to fix yet. Confirm https://www.canva.com/ loads in a normal browser and is publicly reachable, then run the scan again.

Removed by the checker (4): "Found 4 images missing alt-text descriptions." (derived from placeholder or challenge-page data, n); "Repair Alt Attributes for Images" (derived from placeholder or challenge-page data, n); "Add Open Graph / Twitter Card tags" (derived from placeholder or challenge-page data, n); "Expand thin page content" (derived from placeholder or challenge-page data, n)
Added by the checker: none

## Reviewer verdict

_to be completed by a human reviewer_

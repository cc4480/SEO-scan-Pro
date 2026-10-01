# 27-notion — https://www.notion.so

*SaaS marketing.* Animated sections, lazy images, hreflang.

Scan: 29.2s · scoreMethod **measured** · scores {"overall":90,"technical":98,"content":99,"aeoGeo":76,"performance":85} · simulated: false · AI used: true

## Measurements vs independent ground truth

| Fact | Scanner | Ground truth | |
|---|---|---|---|
| title | "The AI workspace that works for you. | Notion" | "The AI workspace that works for you. | Notion" | ok |
| meta description present | true | true | ok |
| canonical | https://www.notion.com/ | https://www.notion.com/ | ok |
| viewport present | true | true | ok |
| html lang | en-us | en-us | ok |
| H1 count | 1 | 1 | ok |
| H2 count | 6 | 6 | ok |
| images (with src) | 60 | 60 <br><sub>DOM has 60 <img>, 60 with a source</sub> | ok |
| images missing/empty alt | 2 | 51 <br><sub>no alt attr 2, empty alt 49</sub> | **MISMATCH** |
| links (scanner total vs real+hash anchors) | 94 | 94+0 hash | ok |
| JSON-LD types | 0 | 0 | ok |
| visible words (rendered) | 345 | 345 <br><sub>innerText vs markup count differ for hidden text; tolerance 30%</sub> | ok |
| hreflang present | true | true | ok |
| raw words (no JS) | 329 | 385 <br><sub>ground truth = real load with JavaScript disabled</sub> | ok |
| raw links (no JS) | 92 | 92 | ok |
| rendered words (facts) | 345 | 345 | ok |
| robots.txt blocks all | false | false | ok |
| sitemap found | true | true <br><sub>sitemap.xml HTTP 200, robots directive yes</sub> | ok |
| llms.txt found | true | true <br><sub>llms.txt HTTP 200</sub> | ok |
| header hsts | true | true | ok |
| header csp | true | true | ok |
| header xFrameOptions | true | true | ok |
| header xContentTypeOptions | false | false | ok |
| header referrerPolicy | true | true | ok |
| bot GPTBot | 200 | 200 | ok |
| bot ClaudeBot | 200 | 200 | ok |
| bot CCBot | 200 | 200 | ok |
| bot Bytespider | 403 blocked | 403 blocked | ok |
| bot OAI-SearchBot | 200 | 200 | ok |
| bot Claude-SearchBot | 200 | 200 | ok |
| bot PerplexityBot | 200 | 200 | ok |
| bot Googlebot | 403 | 403 blocked <br><sub>bot rules can vary run to run; re-check</sub> | **MISMATCH** |
| bot Bingbot | 403 | 403 blocked <br><sub>bot rules can vary run to run; re-check</sub> | **MISMATCH** |
| bot Applebot | 200 | 200 | ok |
| bot ChatGPT-User | 200 | 200 | ok |
| bot Claude-User | 200 | 200 | ok |
| bot Perplexity-User | 200 | 200 | ok |

## Findings (as shown to the user)

1. **fix [low/aeo-geo]** Decide, and state, whether AI-training crawlers are welcome. Bytespider (HTTP 403) was refused even though robots.txt does not disallow it. Search and assistant crawlers (OAI-SearchBot, Claude-SearchBot, PerplexityBot, Googlebot, Bingbot, Applebot) were let through, so answer-engine citation is not affected by this. Whether to block AI-training crawlers is the site owner's choice; the problem is only a mismatch betwe…
   - ⚠ says OAI-SearchBot is blocked but it got HTTP 200
   - ⚠ says Claude-SearchBot is blocked but it got HTTP 200
   - ⚠ says PerplexityBot is blocked but it got HTTP 200
   - ⚠ says Applebot is blocked but it got HTTP 200
2. **fix [high/aeo-geo]** Add JSON-LD structured data to the homepage. The homepage returns no JSON-LD at all — no Organization, WebSite, SoftwareApplication or Product entity is declared. This is the single biggest machine-readability gap on the page. Without it, Google, Gemini, ChatGPT Search and Perplexity have to infer what Notion is, what it does and who runs it from prose alone, which weakens entity confidence and citation eligibility. …
3. **fix [low/technical]** Add the missing X-Content-Type-Options header. The site sends HTTPS, HSTS, CSP, X-Frame-Options and Referrer-Policy, but not X-Content-Type-Options. This is a minor hardening gap rather than a ranking factor, but it is a one-line fix and closes a standard security-header checklist item. Configure the web server or CDN to send the response header X-Content-Type-Options: nosniff on all HTML and asset responses. Verify …
4. **fix [medium/aeo-geo]** Strengthen the homepage's direct-answer opening. The opening visible text leads with the tagline 'Where teams and agents Ship together' followed by a short supporting line. It is a positioning statement rather than a self-contained definition of what Notion is. AI answer engines extract concise, declarative definitions from the first visible block, and a one-sentence 'Notion is a ...' formulation is more extractable …
   - ⚠ says meta description is missing but the page has one
   - ⚠ quotes 25 words; measured values are 345 rendered / 385 no-JS
5. **fix [low/technical]** Reduce the .so-to-.com redirect to a single hop. The crawl chain is https://www.notion.so/ → https://www.notion.com/, which is one hop and is already clean. The canonical on the page correctly points to https://www.notion.com/, so the redirect and canonical agree. This is a confirmation item rather than a defect. No change required on the homepage. As a hygiene check, confirm that all internal links and sitemap entri…
6. **fix [low/aeo-geo]** Add a low-priority llms.txt file. The audit reports an llms.txt file is present. llms.txt is an optional, emerging convention and is not confirmed to be read by any major search engine or AI assistant, so it should not be treated as a visibility lever. Note: llms.txt is optional and not yet confirmed to be read by the major search engines or assistants, so treat it as low priority. If the file already exists, keep it…
   - ⚠ says llms.txt is missing but it exists

Removed by the checker (4): "Fix the two images with no alt attribute" (60 images are said to have no alt attribute, but o); "Confirm Googlebot and Bingbot 403 responses in Sea" (the suggestion itself says there is nothing to fix); "Add a visible FAQ block with FAQPage markup" (the page has no visible question-and-answer conten); "Review the genuine 403 refusal to Bytespider" (replaced by a measured finding on the same topic)
Added by the checker: AI-training crawler block

## Reviewer verdict

_to be completed by a human reviewer_

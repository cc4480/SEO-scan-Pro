# 08-vercel — https://vercel.com

*Next.js marketing.* SSR framework site with structured data.

Scan: 25.2s · scoreMethod **measured** · scores {"overall":90,"technical":100,"content":70,"aeoGeo":100,"performance":85} · simulated: false · AI used: true

## Measurements vs independent ground truth

| Fact | Scanner | Ground truth | |
|---|---|---|---|
| title | "Agentic Infrastructure - Vercel" | "Agentic Infrastructure - Vercel" | ok |
| meta description present | true | true | ok |
| canonical | https://vercel.com | https://vercel.com | ok |
| viewport present | true | true | ok |
| html lang | en | en | ok |
| H1 count | 1 | 1 | ok |
| H2 count | 17 | 17 | ok |
| images (with src) | 18 | 18 <br><sub>DOM has 19 <img>, 18 with a source</sub> | ok |
| images missing/empty alt | 0 | 3 <br><sub>no alt attr 0, empty alt 3</sub> | ok |
| links (scanner total vs real+hash anchors) | 166 | 166+1 hash | ok |
| JSON-LD types | 8 | 8 | ok |
| visible words (rendered) | 134 | 356 <br><sub>innerText vs markup count differ for hidden text; tolerance 30%</sub> | **MISMATCH** |
| hreflang present | false | false | ok |
| raw words (no JS) | 137 | 182 <br><sub>ground truth = real load with JavaScript disabled</sub> | ok |
| raw links (no JS) | 166 | 166 | ok |
| rendered words (facts) | 134 | 356 | **MISMATCH** |
| robots.txt blocks all | false | false | ok |
| sitemap found | true | true <br><sub>sitemap.xml HTTP 200, robots directive yes</sub> | ok |
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

1. **fix [medium/content]** Add substantive visible copy to the homepage. The homepage renders only about 134 words of visible text, and the opening text is a sequence of short fragments ('Ship 26 is coming to SF', 'Drop to deploy', 'Agentic Infrastructure') rather than connected sentences. Search engines and AI answer engines have almost nothing on this page to quote, summarise or cite, which caps both classic rankings and AI citation share fo…
   - ⚠ quotes 700 words; measured values are 356 rendered / 182 no-JS
2. **fix [high/aeo-geo]** Open with a one-sentence definitional answer. The first visible words are promotional fragments, so an AI assistant reading the top of the page cannot lift a clean definition of the company or product. Answer engines preferentially quote a short, self-contained statement near the top of the document. Place a single plain sentence in the first visible block, in the form 'Vercel is a [category] that lets [audience] [pr…
   - ⚠ quotes 30 words; measured values are 356 rendered / 182 no-JS
3. **fix [medium/technical]** Give the two alt-less images descriptive alt text. Two images on the page carry no alt attribute at all, so their content is invisible to image search and to assistive technology. The remaining images are correctly handled, including decorative ones with empty alt text. Identify the two images that have no alt attribute and add a short, accurate description of what each one shows. Leave the decorative images with emp…
4. **fix [medium/aeo-geo]** Expand the Organization entity with sameAs and contact detail. The Organization entity is present and already carries name, legal name, URL, logo, founding date, founder, description, sameAs, contact point and address, so the foundation is solid. Entity confidence in knowledge graphs improves when the sameAs list is complete and consistent with the profiles the brand actually controls. Audit the existing sameAs URLs …
5. **fix [low/content]** Add a visible pricing entry point on the homepage. No pricing information is visible on the homepage and no pricing section is present, so a visitor or an AI assistant landing here cannot see what the product costs or how plans are structured without leaving the page. Add a short pricing summary block to the homepage that names the plan tiers and states the entry price exactly as shown on the pricing page, with a lin…
6. **fix [low/technical]** Keep the current crawler posture and re-verify after changes. Every tested crawler — training, search and assistant — receives a 200 with no refusal, and the site's content signal opts out of AI training while allowing search and AI input. That is a deliberate, coherent policy and should be preserved. After shipping the content changes above, re-run a crawler access check to confirm the same crawlers still receive 20…

Removed by the checker (2): "Convert headline claims into extractable Q&A block" (the page has no visible question-and-answer conten); "State the multi-language position explicitly" (no alternate-language versions were found, so href)
Added by the checker: none

## Reviewer verdict

_to be completed by a human reviewer_

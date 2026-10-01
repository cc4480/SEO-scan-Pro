# 22-mozilla — https://www.mozilla.org/en-US/

*nonprofit marketing, multilingual.* hreflang alternates, privacy-forward markup.

Scan: 25.6s · scoreMethod **measured** · scores {"overall":89,"technical":94,"content":100,"aeoGeo":72,"performance":90} · simulated: false · AI used: true

## Measurements vs independent ground truth

| Fact | Scanner | Ground truth | |
|---|---|---|---|
| title | "Mozilla - Internet for people, not profit (US)" | "Mozilla - Internet for people, not profit (US)" | ok |
| meta description present | true | true | ok |
| canonical | https://www.mozilla.org/en-US/ | https://www.mozilla.org/en-US/ | ok |
| viewport present | true | true | ok |
| html lang | en | en | ok |
| H1 count | 1 | 1 | ok |
| H2 count | 30 | 30 | ok |
| images (with src) | 22 | 22 <br><sub>DOM has 22 <img>, 22 with a source</sub> | ok |
| images missing/empty alt | 0 | 17 <br><sub>no alt attr 0, empty alt 17</sub> | **MISMATCH** |
| links (scanner total vs real+hash anchors) | 87 | 87+0 hash | ok |
| JSON-LD types | 0 | 0 | ok |
| visible words (rendered) | 875 | 875 <br><sub>innerText vs markup count differ for hidden text; tolerance 30%</sub> | ok |
| hreflang present | true | true | ok |
| raw words (no JS) | 1312 | 1308 <br><sub>ground truth = real load with JavaScript disabled</sub> | ok |
| raw links (no JS) | 87 | 87 | ok |
| rendered words (facts) | 875 | 875 | ok |
| robots.txt blocks all | false | false | ok |
| sitemap found | false | false <br><sub>sitemap.xml HTTP 404, robots directive no</sub> | ok |
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

1. **fix [low/technical]** Publish an XML sitemap. No sitemap was found at the usual locations or in robots.txt. A sitemap helps crawlers discover every page, especially new or deeply linked ones; this scan deducted a few technical points for it. Generate a sitemap.xml listing your canonical URLs, publish it, and add a "Sitemap: https://your-domain/sitemap.xml" line to robots.txt.
2. **fix [high/aeo-geo]** Add JSON-LD structured data (Organization, WebSite, SoftwareApplication). The page contains no JSON-LD structured data at all (structured data (JSON-LD) is false, types is empty). Generative engines and Google rely on schema.org markup to resolve entity identity, product relationships, and site-level metadata. Without it, Mozilla's products (Firefox, VPN, Monitor, Relay, Thunderbird, MDN Plus) are invisible as struct…
3. **fix [high/aeo-geo]** Add direct-answer summary blocks for AEO extraction. The opening text is a marketing narrative ('Pause animation Play animation Welcome to Mozilla From trustworthy tech to policies that defend your digital rights...') rather than a concise, extractable answer. Generative engines (ChatGPT Search, Perplexity, Gemini) preferentially cite passages that directly answer a question in 40–60 words. The page has no such block…
   - ⚠ quotes 60 words; measured values are 875 rendered / 1308 no-JS
4. **fix [low/aeo-geo]** Add FAQPage markup for the questions already implied on the page. The page has no FAQ section (the faq section is false) and no FAQPage schema. The page's H3s ('You, AI and the internet — what's really going on?', 'Open Source AI Is Winning', 'Nothing Personal') and product H2s imply user questions that are not answered in a structured, extractable format. Add a visible FAQ section near the bottom of the page with 5–…
5. **fix [medium/performance]** Reduce total page transfer weight (983.6 KB). The HTML document is 110.8 KB and total transfer is 983.6 KB across 57 requests. While lab LCP is strong (892 ms), the page weight is high for a landing page and increases time-to-interactive on mobile networks. TTFB (384 ms) accounts for 23% of load time, indicating the measurement is partly network-bound, but the asset payload is a real front-end cost. Audit the 57 requ…
6. **fix [medium/content]** Add customer stories or case studies to support E-E-A-T. customerStoriesOrCaseStudiesOnPage is false and visible customer reviews is false. For a non-profit with a strong mission, real user stories and third-party validation are high-value trust signals for both Google's quality raters and AI citation engines. Add a 'Stories' or 'Impact' section with 2–3 real, attributed user or partner stories (with names and roles)…
7. **fix [medium/content]** Expand thin content (875 rendered words). The rendered page contains 875 words across 22 H2s and 11 H3s — many headings are product names with little supporting prose. This limits topical depth and the number of extractable passages for AI retrieval. Add 1–2 sentences of descriptive copy under each product H2 (Firefox, Mozilla VPN, Mozilla Monitor, Firefox Relay, Thunderbird, MDN Plus) explaining what the product doe…
8. **fix [low/aeo-geo]** Add HowTo markup for the 'Get Involved' and 'Join the movement' sections. The page has 'Get Involved' and 'Join the movement: AI for the people' H2s but no HowTo schema. HowTo rich results were deprecated by Google, but the markup still helps AI assistants parse step-by-step actions. If the 'Get Involved' section contains concrete steps (donate, volunteer, sign a petition), mark it up with HowTo JSON-LD. Do not expec…
9. **fix [low/aeo-geo]** Add llms.txt for AI crawler guidance (optional). llmsTxtFound is false. llms.txt is an emerging, optional convention that gives AI crawlers a curated map of your most important content. It is not confirmed to be read by any major engine or assistant. Note: llms.txt is optional and not yet confirmed to be read by the major search engines or assistants, so treat it as low priority. Create a plain-text /llms.txt at the …

Removed by the checker (1): "Add descriptive alt text to the Mozilla logo varia" (the suggestion itself says there is nothing to fix)
Added by the checker: no sitemap found

## Reviewer verdict

_to be completed by a human reviewer_

# 06-apple — https://www.apple.com

*heavy marketing.* Large pages, many images, strict performance expectations.

Scan: 18.4s · scoreMethod **measured** · scores {"overall":98,"technical":100,"content":100,"aeoGeo":92,"performance":100} · simulated: false · AI used: true

## Measurements vs independent ground truth

| Fact | Scanner | Ground truth | |
|---|---|---|---|
| title | "Apple" | "Apple" | ok |
| meta description present | true | true | ok |
| canonical | https://www.apple.com/ | https://www.apple.com/ | ok |
| viewport present | true | true | ok |
| html lang | en-US | en-US | ok |
| H1 count | 1 | 1 | ok |
| H2 count | 38 | 38 | ok |
| images (with src) | 51 | 51 <br><sub>DOM has 51 <img>, 51 with a source</sub> | ok |
| images missing/empty alt | 0 | 42 <br><sub>no alt attr 0, empty alt 42</sub> | **MISMATCH** |
| links (scanner total vs real+hash anchors) | 353 | 353+10 hash | ok |
| JSON-LD types | 5 | 5 | ok |
| visible words (rendered) | 893 | 893 <br><sub>innerText vs markup count differ for hidden text; tolerance 30%</sub> | ok |
| hreflang present | true | true | ok |
| raw words (no JS) | 893 | 902 <br><sub>ground truth = real load with JavaScript disabled</sub> | ok |
| raw links (no JS) | 133 | 133 | ok |
| rendered words (facts) | 893 | 893 | ok |
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

1. **fix [low/technical]** Add alt text to the Apple Watch Series 12 hero logo image. One image on the page — the hero logo for Apple Watch Series 12 (hero_logo_apple_watch_series_12__eze8r897c5me_large.png) — has no alt attribute at all. The other 50 images are fine: 42 decorative images correctly use empty alt text, and the remaining product images carry descriptive alt text. This is an accessibility and content-completeness improvement, not…
2. **fix [high/aeo-geo]** Add a direct, quotable answer near the top of the page. The first ~120 words of visible text are product slogans and calls to action ("iPhone 18 Pro Pro further. Learn more Buy..."). There is no plain-language sentence that defines what Apple is or what the page offers, which makes it harder for AI assistants and featured-snippet systems to extract a direct answer. Insert a short lead paragraph immediately below the …
   - ⚠ quotes 120 words; measured values are 893 rendered / 902 no-JS
   - ⚠ quotes 40 words; measured values are 893 rendered / 902 no-JS
3. **fix [medium/content]** Expose pricing context on the homepage. No prices are visible on the page and no offer data is present in the structured data. Product cards link out to buy pages, but the homepage itself gives no price anchors, which weakens its usefulness for commercial queries and for AI shopping answers. Add a "Starting at" price line to each product card (using the price shown on the corresponding product page) and, where approp…
   - ⚠ says structured data is missing but the page has 5 type(s)
4. **fix [low/content]** Add a customer-story or case-study element. The page has no customer stories or case studies, and no genuine reviews are visible. This limits trust signals and the kind of first-hand experience content that AI answer engines tend to cite. Add a small "Why people choose Apple" or customer-story module with a real, attributable quote or short case study. Only add Review or aggregateRating markup if the reviews are genu…
5. **fix [low/aeo-geo]** Consider adding an llms.txt file. No llms.txt file was found at the site root. This file is optional and not confirmed to be read by any major search engine or AI assistant, so it is a low-priority, speculative improvement rather than a requirement. Note: llms.txt is optional and not yet confirmed to be read by the major search engines or assistants, so treat it as low priority. Optionally publish a plain-text /llms.…
6. **fix [low/technical]** Add a Twitter card to social metadata. Open Graph tags are present (ogTitle, ogDescription, ogImage, ogType), but no Twitter card type is declared. This affects how links render when shared on X/Twitter. Add a twitter:card meta tag (e.g. summary_large_image) plus twitter:title, twitter:description and twitter:image, mirroring the Open Graph values.

Removed by the checker (1): "Add a visible FAQ section with question-and-answer" (the page has no visible question-and-answer conten)
Added by the checker: none

## Reviewer verdict

_to be completed by a human reviewer_

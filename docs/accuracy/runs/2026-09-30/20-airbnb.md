# 20-airbnb — https://www.airbnb.com

*SPA marketplace.* Script-built page; JSON-LD.

Scan: 46s · scoreMethod **undefined** · scores {"overall":71,"technical":93,"content":30,"aeoGeo":95,"performance":65} · simulated: false · AI used: false

## Measurements vs independent ground truth

| Fact | Scanner | Ground truth | |
|---|---|---|---|
| title | "Airbnb | Vacation rentals, cabins, beach houses,  | "Airbnb | Vacation rentals, cabins, beach houses,  | ok |
| meta description present | true | true | ok |
| canonical | https://www.airbnb.com/ | https://www.airbnb.com/ | ok |
| viewport present | true | true | ok |
| html lang | en | en | ok |
| H1 count | 1 | 1 | ok |
| H2 count | 6 | 6 | ok |
| images (with src) | 51 | 43 <br><sub>DOM has 43 <img>, 43 with a source</sub> | **MISMATCH** |
| images missing/empty alt | 51 | 43 <br><sub>no alt attr 18, empty alt 25</sub> | ok |
| links (scanner total vs real+hash anchors) | 196 | 196+1 hash | ok |
| JSON-LD types | 2 | 2 | ok |
| visible words (rendered) | 1864 | 1529 <br><sub>innerText vs markup count differ for hidden text; tolerance 30%</sub> | ok |
| hreflang present | true | true | ok |
| raw words (no JS) | 107 | 23 <br><sub>ground truth = real load with JavaScript disabled</sub> | **MISMATCH** |
| raw links (no JS) | 10 | 10 | ok |
| rendered words (facts) | 1873 | 1529 | ok |
| robots.txt blocks all | false | false | ok |
| sitemap found | true | true <br><sub>sitemap.xml HTTP 404, robots directive yes</sub> | ok |
| llms.txt found | false | false <br><sub>llms.txt HTTP 404 (HTML, not a real llms.txt)</sub> | ok |
| header hsts | true | true | ok |
| header csp | true | true | ok |
| header xFrameOptions | true | true | ok |
| header xContentTypeOptions | true | true | ok |
| header referrerPolicy | false | false | ok |
| bot GPTBot | 403 blocked | 403 blocked | ok |
| bot ClaudeBot | 403 blocked | 403 blocked | ok |
| bot CCBot | 403 blocked | 403 blocked | ok |
| bot Bytespider | 403 blocked | 403 blocked | ok |
| bot OAI-SearchBot | 403 blocked | 403 blocked | ok |
| bot Claude-SearchBot | 403 blocked | 403 blocked | ok |
| bot PerplexityBot | 403 blocked | 403 blocked | ok |
| bot Googlebot | 403 blocked | 403 blocked | ok |
| bot Bingbot | 403 blocked | 403 blocked | ok |
| bot Applebot | 403 blocked | 403 blocked | ok |
| bot ChatGPT-User | 403 blocked | 403 blocked | ok |
| bot Claude-User | 200 | 200 | ok |
| bot Perplexity-User | 403 blocked | 403 blocked | ok |

## Findings (as shown to the user)

1. **critical** Found 51 images missing alt-text descriptions.
2. **critical** Detected slow page generation delay of 1050ms.
3. **fix [medium/content]** Repair Alt Attributes for Images. Missing alternative texts negatively affect and degrade visual accessibility and Google Image searches. Audit image templates and populate missing [alt] tag values with contextual keywords describing the asset.
4. **fix [medium/performance]** Optimize Core Asset Performance. Response times exceed 2026 search speed standards, creating immediate conversion drop-off. Leverage CDN edge hosting, compress images with dynamic next-gen formats (WebP/AVIF), and defer secondary client scripts.
5. **fix [low/technical]** Add missing security headers. The response is missing: Referrer-Policy. Browsers and search engines treat HTTPS and hardened headers as trust signals. Serve HTTPS with a redirect from HTTP, then add the listed headers at the CDN, reverse proxy or application layer.
6. **fix [medium/performance]** Improve lab Core Web Vitals. Lab-measured from the scanning host (not real-user data): LCP 3880ms, CLS 0.089. Good thresholds are LCP <= 2500ms and CLS <= 0.1. Preload the hero image/LCP resource, set explicit width/height on media, and avoid injecting content above existing content after load.

Removed by the checker (0): none
Added by the checker: none

## Reviewer verdict

Counts: ACCURATE 3, INACCURATE 2, MISLEADING 1, UNSUPPORTED 0, SUBJECTIVE 0.

**Offline fallback confirmed.** The scan's event log says: "DeepSeek failed (Expected ',' or '}' after property value in JSON at position 21655): using the OFFLINE generator instead. This report is NOT AI-written." and `run.log` carries the JSON.parse stack (A-06; the current `lib/deepseek.ts` already has `parseModelJson`, the corpus run predates it). `scoreMethod` is undefined and there is no `scoreBreakdown` or `qa`, so the scores (71 / 93 / 30 / 95 / 65) are the offline formula, not measured scoring: content 30 is the floor of `95 - 4 x 51`, performance 65 is `100 - 1050/30`, aeoGeo 95 is `70 + 15 + 10` although 12 of 13 crawler probes were refused and the page has 107 raw words vs 1,873 rendered. Wrong or unsupported offline claims: "slow page generation delay of 1050ms" and "Response times exceed 2026 search speed standards" (no such standard; 1,050 ms with 208 ms TTFB is fast); executive summary "Introducing Schema.org structured models ... will immediately amplify index ranking" (WebSite/SearchAction already present, the promise is unsupported); aeoAssessment "Excellent. ..." (constant, tied to `hasJsonLd`), generativeFriendlinessScore 85, voiceSearchOptimized true (`h3.length > 1`); competitor text "solid keyword density levels but trails premium competitors who leverage comprehensive structured sitemaps and responsive media compressions" (no competitor or keyword data exists; Airbnb publishes a sitemap index); "populate [alt] with contextual keywords" invites keyword stuffing; the agent prompt repeats all this. Missing real findings: 12 of 13 spoofed crawler UAs refused (A-02), JS-dependent page (107 raw words), hreflang. Details in `issues/R3.md` R3-09.

**Mismatches explained (live: puppeteer 800 and 1366px, curl).** Images 51 vs 43: the live DOM has 51 `<img>` at both widths, so the ground snapshot (43) was taken before hydration (Airbnb never reaches network idle; the scanner itself timed out of idle at 15 s) (R3-02). Alt: 18 no attribute, 33 `alt=""` (the scanner's 51 "missing" lumps both; none has real alt text, so the count is true but the 33 are mostly decorative icons and link-wrapped images) (A-08). Raw words 107 vs 23: scanner counts hidden/script-adjacent text (A-10); both agree the raw page is nearly empty. Words 1,864 vs 1,529: 981-1,506 innerText depending on width (A-09, R3-01). LCP/CLS: scanner 3,880 ms / 0.089; my runs 6,780 ms / 0.085 at 800px and 2,384 ms / 0.045 at 1366px (R3-01). Bots: 403 for 12 of 13 spoofed UAs and 200 for a Chrome UA (A-02).

1. ACCURATE: 51 images with no useful alt (18 without the attribute, 33 empty); wording "missing alt-text descriptions" is fair, the decorative share is not distinguished (A-08).
2. INACCURATE: 1,050 ms load with 208 ms TTFB is not slow, the "slow" threshold is a hard-coded 600 ms in the offline generator, and "critical" is unreasonable.
3. ACCURATE: same facts as 1; remediation "contextual keywords" is poor advice (describe the image, do not stuff keywords).
4. INACCURATE: "Response times exceed 2026 search speed standards" invents a standard; the measured load (1,050 ms) is fast; "immediate conversion drop-off" is unsupported.
5. ACCURATE: Referrer-Policy absent on GET; the other five checks pass.
6. MISLEADING: LCP 3,880 ms is for the scanner's 800px viewport and varies widely (6,780 ms and 2,384 ms in my runs); CLS 0.089 is under the 0.1 "good" limit yet is listed as a problem; the hedge "lab" is stated but the finding still implies failure.

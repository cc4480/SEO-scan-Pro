# 24-craigslist — https://www.craigslist.org

*very old plain HTML.* Minimal, dated markup; few semantic elements.

Scan: 22.5s · scoreMethod **measured** · scores {"overall":86,"technical":89,"content":100,"aeoGeo":86,"performance":65} · simulated: false · AI used: true

## Measurements vs independent ground truth

| Fact | Scanner | Ground truth | |
|---|---|---|---|
| title | "craigslist: laredo jobs, apartments, for sale, se | "craigslist: laredo jobs, apartments, for sale, se | ok |
| meta description present | true | true | ok |
| canonical | https://www.craigslist.org/area/laredo | https://www.craigslist.org/area/laredo | ok |
| viewport present | true | true | ok |
| html lang |  | - | ok |
| H1 count | 1 | 0 | **MISMATCH** |
| H2 count | 1 | 0 | ok |
| images (with src) | 0 | 0 <br><sub>DOM has 0 <img>, 0 with a source</sub> | ok |
| images missing/empty alt | 0 | 0 <br><sub>no alt attr 0, empty alt 0</sub> | ok |
| links (scanner total vs real+hash anchors) | 451 | 258+2 hash | **MISMATCH** |
| JSON-LD types | 2 | 2 | ok |
| visible words (rendered) | 677 | 465 <br><sub>innerText vs markup count differ for hidden text; tolerance 30%</sub> | **MISMATCH** |
| hreflang present | false | false | ok |
| raw words (no JS) | 730 | 703 <br><sub>ground truth = real load with JavaScript disabled</sub> | ok |
| raw links (no JS) | 451 | 451 | ok |
| rendered words (facts) | 687 | 465 | **MISMATCH** |
| robots.txt blocks all | false | false | ok |
| sitemap found | true | true <br><sub>sitemap.xml HTTP 404, robots directive yes</sub> | ok |
| llms.txt found | false | false <br><sub>llms.txt HTTP 404 (HTML, not a real llms.txt)</sub> | ok |
| header hsts | true | true | ok |
| header csp | true | true | ok |
| header xFrameOptions | true | true | ok |
| header xContentTypeOptions | false | false | ok |
| header referrerPolicy | false | false | ok |
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

1. **critical** Redirect chain has three hops (https://www.craigslist.org/ → https://geo.craigslist.org/ → https://www.craigslist.org/area/laredo), adding unnecessary latency and potentially diluting link equity.
2. **critical** The <html> element is missing a lang attribute, which harms accessibility and language targeting for search and AI.
3. **critical** X-Content-Type-Options header is absent, leaving the site open to MIME-type sniffing attacks.
4. **critical** Referrer-Policy header is absent, potentially leaking referrer information.
5. **critical** The page contains no images (imagesCount: 0), which limits visual engagement and image search visibility.
6. **critical** The visible FAQ section has no corresponding FAQPage structured data, missing an opportunity for enhanced machine readability.
   - ⚠ says structured data is missing but the page has 2 type(s)
7. **critical** The meta description is generic and not tailored to the Laredo area page, reducing click-through relevance.
8. **critical** The page has only 677 words of content, which is thin for a local classifieds hub and may limit topical authority.
9. **critical** CLS is measured at 1.263 (lab data), indicating potential layout instability that could affect user experience.
10. **fix [high/technical]** Eliminate redirect hops. The crawl shows a three-hop redirect chain from the root URL to the final Laredo area page. This adds latency and can confuse crawlers. Configure the server to redirect directly from https://www.craigslist.org/ to https://www.craigslist.org/area/laredo in a single 301 response, bypassing the intermediate geo.craigslist.org hop. Update any internal links to point directly to the final URL.
11. **fix [medium/technical]** Add X-Content-Type-Options header. The X-Content-Type-Options header is missing, which can allow browsers to MIME-sniff responses and potentially execute malicious content. Add the header X-Content-Type-Options: nosniff to all server responses.
12. **fix [medium/technical]** Add Referrer-Policy header. The Referrer-Policy header is missing, which may leak referrer information to external sites. Add a Referrer-Policy header with a value such as strict-origin-when-cross-origin or no-referrer-when-downgrade, depending on your privacy requirements.
13. **fix [medium/content]** Customize meta description for local relevance. The meta description is a generic template and does not mention Laredo or local specifics, reducing click-through relevance. Rewrite the meta description to include location-specific terms (e.g., "Find jobs, apartments, for sale items, and services in Laredo, TX on craigslist. Browse local classifieds and community forums.") and keep it under 160 characters.
14. **fix [medium/content]** Expand content depth. The page has only 677 words, which is thin for a local hub and may limit topical authority and AI citation potential. Add unique, valuable content such as a brief introduction to Laredo classifieds, tips for buying/selling locally, or a list of popular categories. Aim for at least 300-500 additional words of substantive text.
15. **fix [medium/performance]** Investigate and reduce CLS. Lab-measured CLS is 1.263, indicating significant layout instability. This is a lab measurement from the auditing host and may not reflect field data, but it warrants investigation. Use Chrome DevTools or Lighthouse to identify elements causing layout shifts. Common fixes include setting explicit width/height on images and ads, avoiding dynamic content injection above existing content, and…
16. **fix [low/performance]** Optimize TTFB if possible. TTFB is 803ms, which accounts for 67% of the total load time (1201ms). This measurement is network-bound from the auditing host, but reducing server response time can improve user experience. Review server-side caching, database queries, and CDN configuration to reduce TTFB. If the site uses a CDN, ensure it is properly configured for the target audience.

Removed by the checker (3): "Add lang attribute to <html>" (no alternate-language versions were found, so href); "Add relevant images with alt text" (the page has no images, so there is no alt text to); "Implement FAQPage structured data" (the page already has a faq section)
Added by the checker: none

## Reviewer verdict

Reviewer R4. Counts: ACCURATE 7, INACCURATE 3, MISLEADING 3, UNSUPPORTED 0, SUBJECTIVE 3.

FAQ: there is no FAQ section. The only occurrence of "faq" in the raw HTML is the footer link "help, faq, abuse, legal" pointing to /about/help/ (verified with curl and in the live DOM; body text never contains "frequently asked"). So "visible FAQ section" (critical 6) is A-05. The checker's own removal ("page already has a faq section") rests on the same false signal.

Redirects: live curl shows www.craigslist.org -> 302 geo.craigslist.org -> 302 /area/laredo -> 200, i.e. TWO redirects (the scan's own event says "2 redirect hop(s)"); the AI counted the 3 URLs in redirectChain as three hops. These are geo-IP 302s by design: a visitor from another city lands on another area page, so the advice "redirect directly to /area/laredo in a single 301" is not possible or sensible.

Measurement mismatches (the site serves different DOMs): scanner H1 1 / links 451 / words 677 equal the static server HTML (curl: 454 anchors, h1 x2 incl. one title-like H1, h2 "laredo, TX", ~703 words). Ground's rendered load got 0 H1, 0 H2, 258 anchors, 465 words, while its JS-off load got 451 anchors and 2 H1s. My own puppeteer loads (JavaScript on, both scanner UA and Chrome UA) now return a third variant: 152 anchors, 64 words, no H1; JS off returns the static page (454 anchors, 703 words). So craigslist rewrites its DOM client-side and the result varies by run (A/B or progressive client rendering); neither scanner nor ground is wrong, the page is unstable. Consequently H1 (A-11), links (A-11) and words (A-09) mismatches are "site served different content", not parser bugs; the plain-HTML parser handled the static HTML correctly (451 vs 454 anchors; the 2nd H1 is presumably visually hidden and skipped).

1. INACCURATE: two redirects, not three hops (3 URLs in the chain, 2 hops); 302 geo-redirect by design.
2. ACCURATE: `<html>` has no lang attribute (raw HTML verified; ground also empty).
3. ACCURATE: no X-Content-Type-Options header (verified with curl). "Critical" is inflated (A-13).
4. ACCURATE: no Referrer-Policy header (verified). Severity inflated (A-13).
5. MISLEADING: 0 <img> is true (curl: 0) but a text classifieds hub does not need images; calling it critical for "image search visibility" is not a defect. The checker removed the alt-text fix for this very reason but left the critical.
6. INACCURATE: no FAQ section exists (only a footer link to /about/help/), A-05. The "no FAQPage" half is true but pointless.
7. SUBJECTIVE: the description is a generic template (verified, no "Laredo") so the observation is true; its CTR impact is a judgement. Reasonable.
8. MISLEADING: 677 is the scanner's own count of a page that is mostly navigation links (ground 465, raw 703); "thin" for a link hub is a poor lens and the number is unstable.
9. ACCURATE: CLS 1.263 is what the scan measured (a 1272 ms LCP also recorded). Could not re-verify since the page now renders differently for me, so treat as a lab figure that varies by variant.
10. INACCURATE: premise (three hops, single 301 to the Laredo page) is wrong; geo-routing on 302 is the design and "update internal links" is meaningless. "high" priority unjustified.
11. ACCURATE: header absent; fix is standard.
12. ACCURATE: header absent; fix is standard.
13. SUBJECTIVE: reasonable local-relevance tip; the example copy is plausible.
14. MISLEADING: "add 300-500 words of text" to a classifieds index is poor advice and rests on an unstable word count (see 8).
15. ACCURATE: CLS figure as measured; advice generic (the page has no images, so "width/height on images" does not apply).
16. SUBJECTIVE: TTFB 803 ms of 1201 ms (67%) matches the data; "reduce TTFB / configure CDN" is generic but reasonable.

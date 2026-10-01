# 22-mozilla — https://www.mozilla.org/en-US/

*nonprofit marketing, multilingual.* hreflang alternates, privacy-forward markup.

Scan: 22s · scoreMethod **measured** · scores {"overall":87,"technical":94,"content":90,"aeoGeo":72,"performance":90} · simulated: false · AI used: true

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
| images missing/empty alt | 17 | 17 <br><sub>no alt attr 0, empty alt 17</sub> | ok |
| links (scanner total vs real+hash anchors) | 87 | 87+0 hash | ok |
| JSON-LD types | 0 | 0 | ok |
| visible words (rendered) | 1512 | 875 <br><sub>innerText vs markup count differ for hidden text; tolerance 30%</sub> | **MISMATCH** |
| hreflang present | true | true | ok |
| raw words (no JS) | 1520 | 1308 <br><sub>ground truth = real load with JavaScript disabled</sub> | ok |
| raw links (no JS) | 87 | 87 | ok |
| rendered words (facts) | 1520 | 875 | **MISMATCH** |
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

1. **critical** No structured data present: structuredData.hasJsonLd is false and structuredData.types is empty — the page emits no JSON-LD, so it is ineligible for Organization, WebSite, SoftwareApplication, FAQ or Breadcrumb rich results and gives AI engines no machine-readable entity graph.
2. **critical** 17 of 22 images (missingAltCount: 17) lack alt text — an accessibility and content-quality failure that also removes image context from AI retrieval systems.
3. **fix [high/aeo-geo]** Add Organization and WebSite JSON-LD. The page has no JSON-LD at all (structuredData.hasJsonLd: false, structuredData.types: []). Without an Organization/WebSite entity graph, search engines and AI assistants cannot reliably resolve Mozilla as a brand entity, its logo, or its site search action. In the <head> of the en-US template, add a JSON-LD @graph containing: (1) Organization with name 'Mozilla', url 'https://ww…
4. **fix [high/content]** Fix missing image alt text. 17 of 22 images on the page have no alt attribute (missingAltCount: 17). This harms screen-reader users and strips context that AI retrieval systems use to understand page imagery. Audit all 22 <img> elements. For every meaningful image (product screenshots, campaign art, portraits), add a concise descriptive alt attribute. For purely decorative images, add alt="" (empty) so assistive tech…
5. **fix [medium/aeo-geo]** Add SoftwareApplication markup for product sections. The page promotes Firefox, Mozilla VPN, Mozilla Monitor, Firefox Relay, MDN Plus and Thunderbird, but emits no SoftwareApplication entities, so AI assistants have no structured product data to cite. For each product block, add a SoftwareApplication JSON-LD entity with name, applicationCategory (e.g. 'BrowserApplication' for Firefox, 'SecurityApplication' for VPN/Mo…
6. **fix [medium/aeo-geo]** Add FAQPage markup for the Q&A-style content. The page contains question-formatted H3s such as 'A Rebel Alliance?', 'You, AI and the internet — what's really going on?' and 'Open Source AI Is Winning', but no FAQPage markup. FAQ rich results no longer appear in Google Search, but the markup still helps machines parse Q&A content. Where an H3 poses a question and the following copy answers it, wrap that pair in FAQPag…
7. **fix [low/technical]** Add BreadcrumbList for site hierarchy. No BreadcrumbList markup is present, so the page's position in the site hierarchy is not machine-readable. Add a BreadcrumbList JSON-LD entity reflecting the real path (Home > en-US). Only include levels that exist as real navigable URLs.
8. **fix [low/aeo-geo]** Publish an llms.txt file. llmsTxtFound is false — the site does not expose an /llms.txt file. This is an emerging convention, not a ranking factor, but it can help AI tools discover canonical content. Create /llms.txt at the domain root listing the site's key canonical URLs (home, product pages, manifesto, blog) with one-line descriptions. Keep it plain Markdown. Treat this as optional and low-impact.
9. **fix [low/technical]** Add a sitemap reference. sitemapFound is false in this crawl, so no XML sitemap was discovered from the root. Confirm whether an XML sitemap exists at /sitemap.xml. If it does, ensure robots.txt declares it with a Sitemap: directive. If it does not, generate one covering the canonical en-US and localised URLs and reference it in robots.txt.
   - ⚠ says canonical is missing but the page has https://www.mozilla.org/en-US/
10. **fix [low/content]** Strengthen social preview metadata. The page uses twitterCard 'summary' while an og:image is present. A summary card renders a small thumbnail and under-uses the available image. Change the Twitter card to 'summary_large_image' so the og:image is displayed at full width in X/Twitter previews. Keep the existing og:title, og:description and og:image values.

Removed by the checker (0): none
Added by the checker: none

## Reviewer verdict

Reviewer R4. Counts: ACCURATE 4, INACCURATE 2, MISLEADING 2, UNSUPPORTED 0, SUBJECTIVE 2.

Main defect: all 17 "missing alt" images carry alt="" (ground: no alt attribute 0, empty alt 17; scanner image list shows alt "" for every one, e.g. product logos, decorative CMS photos). That is valid decorative markup, yet critical issue 2 and fix 4 say "no alt attribute" and rate it high (A-08, A-13). Everything else factual checks out live: no JSON-LD, twitter:card = summary with og:image present, no sitemap (/sitemap.xml 404 even after redirect to /en-US/, no Sitemap directive; robots.txt is 66 bytes), no llms.txt (404).

Measurement mismatches explained: visible words 1512 vs 875 and rendered words 1520 vs 875 = scanner counts markup text including hidden menus/aria-hidden, ground uses innerText (A-09, scanner overcounts). Raw words 1520 vs ground JS-off 1308: same cause (A-09/A-10); raw links agree (87). The "canonical missing" flag on fix 9 is noise (canonical present).

1. ACCURATE: no JSON-LD (scanner, ground and the HTML agree). "Critical" is inflated for a nonprofit homepage (A-13); FAQ rich results are retired so listing FAQ among lost rich results is slightly off.
2. INACCURATE: 0 images lack the alt attribute; all 17 are alt="" (decorative), A-08.
3. ACCURATE: premise true, Organization/WebSite recommendation reasonable.
4. INACCURATE: "17 of 22 images have no alt attribute" is false; the fix text itself says decorative images should use alt="", which is what they already do. "high" priority unjustified.
5. SUBJECTIVE: reasonable; the products named (Firefox, VPN, Monitor, Relay, MDN Plus, Thunderbird) all appear as logos on the page.
6. MISLEADING: the H3s quoted are marketing headings, not Q&A pairs ("Open Source AI Is Winning" is not even a question); FAQPage markup must mirror visible questions with answers, so recommending it here would produce non-compliant markup.
7. MISLEADING: BreadcrumbList "Home > en-US" on the homepage adds nothing (a one-item trail; en-US is the locale of the home itself). Low value, and not a real hierarchy.
8. ACCURATE: /llms.txt 404; correctly labelled optional.
9. ACCURATE: no sitemap found anywhere, hedged properly ("confirm whether one exists").
10. SUBJECTIVE: twitter:card=summary with og:image verified live; changing to summary_large_image is a reasonable, minor suggestion.

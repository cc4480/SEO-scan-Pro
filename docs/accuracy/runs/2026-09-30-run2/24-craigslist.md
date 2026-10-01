# 24-craigslist — https://www.craigslist.org

*very old plain HTML.* Minimal, dated markup; few semantic elements.

Scan: 25.2s · scoreMethod **measured** · scores {"overall":87,"technical":89,"content":100,"aeoGeo":86,"performance":71} · simulated: false · AI used: true

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
| links (scanner total vs real+hash anchors) | 450 | 258+2 hash | **MISMATCH** |
| JSON-LD types | 2 | 2 | ok |
| visible words (rendered) | 439 | 465 <br><sub>innerText vs markup count differ for hidden text; tolerance 30%</sub> | ok |
| hreflang present | false | false | ok |
| raw words (no JS) | 703 | 703 <br><sub>ground truth = real load with JavaScript disabled</sub> | ok |
| raw links (no JS) | 450 | 450 | ok |
| rendered words (facts) | 439 | 465 | ok |
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

1. **fix [medium/content]** Add a meta description to the Laredo area page. The page's meta description field is empty. The title is populated ('craigslist: laredo jobs, apartments, for sale, services, community, and events'), but there is no description, so search engines and AI assistants must synthesize a snippet from page text that is mostly navigation labels. In the template that renders area landing pages, output a unique meta description…
   - ⚠ says meta description is missing but the page has one
2. **fix [medium/technical]** Add an Open Graph image and complete social metadata. Open Graph title and description are present, but the Open Graph image is empty and the Open Graph type is not set. Twitter card is set to 'preview'. Without an image, links shared into chat apps, social platforms and AI answer surfaces render as plain text and are less likely to be surfaced or clicked. Generate a branded 1200x630 Open Graph image per area page (o…
3. **fix [high/aeo-geo]** Add a direct answer block near the top of the page. The first visible text on the page is interface chrome and category labels ('CL laredo post account favorites hidden CL laredo ... new posting my account laredo, TX craigslist post an ad event calendar ...'). There is no sentence that plainly states what this page is or what a visitor can do here. AI assistants and featured-snippet systems extract answers from exact…
4. **fix [high/performance]** Reduce Cumulative Layout Shift. Lab measurement recorded a Cumulative Layout Shift of 1.158, more than ten times the 0.1 threshold generally considered good. This is a lab figure from the auditing host, not field data, but a value that high usually indicates elements moving after initial paint — commonly late-loading ads, banners or fonts without reserved space. Audit the Laredo page in Chrome DevTools Performance an…
5. **fix [low/content]** Add a contact or help entry point to the page content. The page has no visible contact section. The footer links to help, FAQ, abuse and legal pages, but there is no on-page contact or support block, which is a common trust signal for both users and AI systems evaluating a site's usefulness. Add a short 'Need help?' block near the footer that links to the existing help and FAQ pages and states how to report abuse or …
6. **fix [low/aeo-geo]** Consider adding an llms.txt file. No llms.txt file was found at the site root. This is an optional, emerging convention; no major search engine or AI assistant has confirmed that it reads the file, so treat this as a low-priority experiment rather than a fix. Note: llms.txt is optional and not yet confirmed to be read by the major search engines or assistants, so treat it as low priority. If you want to test it, publ…

Removed by the checker (2): "Declare the page language" (no alternate-language versions were found, so href); "Add FAQ content to area landing pages" (the page has no visible question-and-answer conten)
Added by the checker: none

## Reviewer verdict

_to be completed by a human reviewer_

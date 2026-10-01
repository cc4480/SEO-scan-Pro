# 07-stripe — https://stripe.com

*SaaS marketing, JS heavy.* Animated, script-driven marketing page.

Scan: 24.7s · scoreMethod **measured** · scores {"overall":97,"technical":100,"content":100,"aeoGeo":100,"performance":85} · simulated: false · AI used: true

## Measurements vs independent ground truth

| Fact | Scanner | Ground truth | |
|---|---|---|---|
| ground truth | - | Runtime.callFunctionOn timed out. Increase the 'protocolTimeout' setting in launch/connect calls for a higher timeout if needed. <br><sub>ground truth could not be collected</sub> | **MISMATCH** |

## Findings (as shown to the user)

1. **fix [medium/content]** Add descriptive alt text to the 40 content images. The page renders 40 images, and the sample shows that content-bearing files such as bento-terminal.png, payments-electric-kettle.jpg, payments-hoodie.jpg, showflix-streaming.jpg, wave_crop.jpg and ConnectMobileBackground.jpg carry empty alt attributes. Empty alt is valid for purely decorative art, but these filenames indicate product and customer imagery that carries…
2. **fix [high/aeo-geo]** Lead the page with a plain-language definition of Stripe. The opening visible text begins with a live counter ("Global GDP running on Stripe: 1.72468224%") followed by the marketing headline, before any plain statement of what the company does. AI answer engines and voice assistants extract the first clean, self-contained sentence they can find; a numeric ticker is a poor extraction target. Insert one short, declarat…
3. **fix [medium/performance]** Reduce the 1.07 MB of non-HTML transfer weight. The HTML document is 738.6 KB and total transfer is 1,758.1 KB across 144 requests. The gap of roughly 1,020 KB is scripts, styles and images. The measured load time of 1,388 ms is largely network-bound (316 ms TTFB plus transfer from the auditing host), so this is not a confirmed Core Web Vitals failure — but the payload is heavy for a landing page. Profile the 144 req…
4. **fix [low/technical]** Consolidate the repeated Place/PostalAddress blocks. The structured data repeats a Place plus PostalAddress pair roughly twenty times. This bloats the JSON-LD payload without adding new information and makes the graph harder for parsers to reason about. Define each office once as a named Place node and reference it by @id from the Organization's location array, rather than inlining a full PostalAddress for every entr…
5. **fix [low/aeo-geo]** Keep llms.txt as an optional, low-priority experiment. An llms.txt file is present at the root. No major search engine or assistant has confirmed that it reads this file, so it should not be treated as a ranking or retrieval lever. Note: llms.txt is optional and not yet confirmed to be read by the major search engines or assistants, so treat it as low priority. Maintain the file as a lightweight index of your most ci…

Removed by the checker (2): "Add FAQPage structured data for the questions the " (the page has no visible question-and-answer conten); "Give the two Person entities a role and affiliatio" (the Organization/Person markup already has sameAs)
Added by the checker: none

## Reviewer verdict

_to be completed by a human reviewer_

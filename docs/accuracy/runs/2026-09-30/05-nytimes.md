# 05-nytimes — https://www.nytimes.com

*news, paywall, bot defences.* Likely to block or challenge automated requests.

Scan: 24s · scoreMethod **illustrative** · scores {"overall":62,"technical":68,"content":55,"aeoGeo":60,"performance":82} · simulated: true · AI used: true

## Measurements vs independent ground truth

| Fact | Scanner | Ground truth | |
|---|---|---|---|
| page reached | simulated | status 403 <br><sub>scanner used placeholder data</sub> | ok |

## Findings (as shown to the user)

1. **critical** Live crawl could not be completed — isSimulatedData is true, so this payload is placeholder data and cannot support any real finding about nytimes.com.
2. **critical** llmsTxtFound is false: no /llms.txt is present in the sample, so AI answer engines get no curated, machine-readable map of the site's authoritative content.
3. **critical** 3 of 14 images (missingAltCount: 3) carry no alt text, which degrades accessibility and removes image-level context that AI and visual search systems can index.
   - ⚠ mentions alt text but the page has no images
   - ⚠ quotes 14 images; page has 0 (0 without useful alt)
4. **critical** Title and meta description in the sample are generic template copy ('Www | Leading Solutions & Professional Services') that names no real entity, topic, or differentiator — weak for both classic SERP CTR and generative answer extraction.
5. **fix [high/technical]** Re-run the crawl against the live domain before acting. The payload is flagged isSimulatedData:true, meaning the crawler never reached the site. Every metric in it (946 ms load, 45 KB page, 14 images, 28 links, the JSON-LD types) is placeholder data and cannot be used to judge the real site. Re-run the audit from a host with a clean network path to the target, confirm the response is a real 200 with the expected HTML…
   - ⚠ quotes 14 images; page has 0 (0 without useful alt)
6. **fix [high/aeo-geo]** Publish an /llms.txt content map. llmsTxtFound is false in the sample. AI answer engines (ChatGPT Search, Perplexity, Gemini) benefit from a concise, curated index of the pages a site considers authoritative, and there is none here. Create a plain-text /llms.txt at the web root. Use a short H1 with the site name and a one-line description, then a bulleted list of the most important section and article URLs, each with…
7. **fix [medium/content]** Add descriptive alt text to the three images missing it. missingAltCount is 3 out of imagesOnPage 14. Missing alt text is an accessibility defect and removes the only textual signal image search and multimodal AI systems can read. For each of the three images, add an alt attribute that describes the image's content and purpose in one sentence. Leave alt="" only for genuinely decorative images. Do not keyword-stuff; d…
8. **fix [high/content]** Replace generic title and meta description with entity-specific copy. The sample title ('Www | Leading Solutions & Professional Services') and description ('Welcome to Www...') are template placeholders. They name no real entity, topic, or audience, which suppresses click-through in classic SERPs and gives generative engines nothing distinctive to quote. Rewrite the title as '<Primary Topic or Brand> — <Concrete Valu…
9. **fix [medium/aeo-geo]** Extend structured data with page-level and article-level types. structuredData.types lists Organization, WebSite and LocalBusiness. Those are entity-level types and do not describe the individual content on the page, which limits how precisely answer engines can attribute facts. Keep the existing Organization, WebSite and LocalBusiness entities. Add the type that matches the page's actual content — for example Articl…
10. **fix [medium/aeo-geo]** Add a visible FAQ block with direct, extractable answers. The sample headings include a 'Frequently Asked Questions' H2, but the payload gives no evidence of question-and-answer pairs underneath it. Generative engines extract short, self-contained answers most reliably. Under the FAQ heading, write 4–8 real questions phrased the way users type them, each followed by a 40–60 word answer that stands alone without surro…
11. **fix [low/technical]** Strengthen internal linking from the 19 in-body links. The sample shows 28 links, of which 19 are internal and 9 external. Internal links are the crawl paths that distribute authority and help AI crawlers discover related content. Audit the 19 internal links and ensure each uses descriptive anchor text that names the destination topic rather than 'click here' or 'learn more'. Add contextual links from the main body t…
12. **fix [medium/technical]** Confirm crawler access policy for AI and search agents. robotsBlocksAll is false, so the sample does not block all crawlers. However, the payload does not include a per-crawler access test, so it is unknown whether search and assistant crawlers (Googlebot, Bingbot, OAI-SearchBot, PerplexityBot) are allowed alongside training crawlers. Review robots.txt and confirm that search and assistant crawlers are explicitly all…
13. **fix [low/performance]** Treat the 946 ms load as network-bound until re-measured. The sample reports loadTimeMs 946 for a 45 KB document. A 45 KB page is small, so the elapsed time likely reflects the auditing host's network path rather than front-end cost. The payload contains no ttfbMs, so this cannot be separated with certainty. Re-measure from a host close to the target's real users and capture TTFB separately from render time. Only if …

Removed by the checker (0): none
Added by the checker: none

## Reviewer verdict

_to be completed by a human reviewer_

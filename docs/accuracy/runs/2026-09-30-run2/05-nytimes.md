# 05-nytimes — https://www.nytimes.com

*news, paywall, bot defences.* Likely to block or challenge automated requests.

Scan: 4.9s · scoreMethod **illustrative** · scores {"overall":88,"technical":95,"content":83,"aeoGeo":95,"performance":80} · simulated: true · AI used: true

## Measurements vs independent ground truth

| Fact | Scanner | Ground truth | |
|---|---|---|---|
| page reached | simulated | status 403 <br><sub>scanner used placeholder data</sub> | ok |

## Findings (as shown to the user)

1. **critical** The site could not be read, so no findings about its content can be reported.
2. **fix [medium/technical]** Check whether bot protection is blocking automated clients. The scanner could not read nytimes.com. A firewall, CDN or bot-protection rule that refuses automated clients is one possible cause (an outage or a wrong address are others). Look at your CDN, WAF or server logs for the time of the scan. If automated requests were refused or challenged, allow-list the scanner or confirm that verified search crawlers are exem…
3. **fix [low/technical]** Re-run the audit once the site is readable. No audit of the real page took place, so there is nothing to fix yet. Confirm https://www.nytimes.com/ loads in a normal browser and is publicly reachable, then run the scan again.

Removed by the checker (2): "Found 3 images missing alt-text descriptions." (derived from placeholder or challenge-page data, n); "Repair Alt Attributes for Images" (derived from placeholder or challenge-page data, n)
Added by the checker: none

## Reviewer verdict

_to be completed by a human reviewer_

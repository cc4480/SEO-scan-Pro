# 29-tesla — https://www.tesla.com

*brand site, bot defences.* Large hero media, blocks some automated traffic.

Scan: 3s · scoreMethod **illustrative** · scores {"overall":84,"technical":75,"content":83,"aeoGeo":95,"performance":82} · simulated: true · AI used: true

## Measurements vs independent ground truth

| Fact | Scanner | Ground truth | |
|---|---|---|---|
| page reached | simulated | status 403 <br><sub>scanner used placeholder data</sub> | ok |

## Findings (as shown to the user)

1. **critical** The site served a bot challenge (the page title is "Access Denied", the wording of a bot-check or blocked page) so the real page could not be audited.
2. **fix [medium/technical]** Check whether bot protection is blocking automated clients. The scanner was shown a challenge page (the page title is "Access Denied", the wording of a bot-check or blocked page) instead of tesla.com. Bot-protection or CDN rules that challenge headless or automated clients can also stop search engines and AI crawlers from reading the site, though verified crawlers are often exempt. Look at your CDN, WAF or server log…
3. **fix [low/technical]** Re-run the audit once the site is readable. No audit of the real page took place, so there is nothing to fix yet. Confirm https://www.tesla.com/ loads in a normal browser and is publicly reachable, then run the scan again.

Removed by the checker (2): "Found 3 images missing alt-text descriptions." (derived from placeholder or challenge-page data, n); "Repair Alt Attributes for Images" (derived from placeholder or challenge-page data, n)
Added by the checker: none

## Reviewer verdict

_to be completed by a human reviewer_

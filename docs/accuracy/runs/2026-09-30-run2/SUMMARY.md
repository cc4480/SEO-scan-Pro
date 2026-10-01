# Accuracy run summary

Run date: 2026-09-30-run2. 30 sites. Measurement mismatches: 84. Flagged claims: 52. Simulated: 3. Offline (AI failed): 0. Failed: 0.

| Site | Overall | Measurement mismatches | Flagged claims | Notes (first mismatches) |
|---|---|---|---|---|
| 01-example | 54 | 0 | 0 |  |
| 02-wikipedia-seo | 78 | 5 | 3 | images missing/empty alt, sitemap found, bot Googlebot |
| 03-github | 91 | 1 | 2 | images missing/empty alt |
| 04-bbc-news | 92 | 2 | 0 | images (with src), images missing/empty alt |
| 05-nytimes | 88 | 0 | 0 | SIMULATED  |
| 06-apple | 98 | 1 | 3 | images missing/empty alt |
| 07-stripe | 97 | 1 | 0 | ground truth |
| 08-vercel | 90 | 2 | 2 | visible words (rendered), rendered words (facts) |
| 09-react-dev | 89 | 1 | 2 | images missing/empty alt |
| 10-mdn | 93 | 0 | 3 |  |
| 11-shopify | 97 | 2 | 1 | images (with src), images missing/empty alt |
| 12-amazon | 79 | 5 | 1 | images (with src), visible words (rendered), rendered words (facts) |
| 13-nasa | 87 | 2 | 0 | images missing/empty alt, bot ClaudeBot |
| 14-gov-uk | 88 | 1 | 1 | images missing/empty alt |
| 15-hacker-news | 78 | 0 | 8 |  |
| 16-reddit | 70 | 9 | 1 | images (with src), images missing/empty alt, links (scanner total vs real+hash anchors) |
| 17-linkedin | 91 | 3 | 2 | images missing/empty alt, raw words (no JS), robots.txt blocks all |
| 18-nike | 91 | 1 | 0 | SIMULATED page reached |
| 19-ikea | 93 | 1 | 0 | images missing/empty alt |
| 20-airbnb | 88 | 15 | 0 | images (with src), images missing/empty alt, bot GPTBot |
| 21-cloudflare | 96 | 1 | 1 | images (with src) |
| 22-mozilla | 89 | 1 | 1 | images missing/empty alt |
| 23-python | 92 | 0 | 0 |  |
| 24-craigslist | 87 | 2 | 1 | H1 count, links (scanner total vs real+hash anchors) |
| 25-guardian | 83 | 0 | 0 |  |
| 26-stackoverflow | 90 | 5 | 13 | raw words (no JS), raw links (no JS), header hsts |
| 27-notion | 90 | 3 | 7 | images missing/empty alt, bot Googlebot, bot Bingbot |
| 28-canva | 77 | 8 | 0 | title, canonical, H2 count |
| 29-tesla | 84 | 0 | 0 | SIMULATED  |
| 30-w3c | 89 | 12 | 0 | title, meta description present, html lang |

## Run 1 vs run 2 (lead's reading)

- Critical issues across the 30 sites fell from well over 100 to 17, and every remaining one was read against ground truth.
- Fixed and confirmed gone: invented findings on unreachable sites (nytimes, tesla now give one honest "could not read" finding), the Canva and Tesla bot walls audited as the site (now reported as a challenge), alt="" counted as missing, truncated meta descriptions, unreadable robots.txt reported as absent, spoofed crawler requests counted as blocks, offline fallback after a failed AI parse (0 offline in run 2).
- Remaining criticals judged accurate: example.com no H1; nasa and guardian no H1 (ground truth: 0 H1); reddit robots.txt disallows `*`; airbnb 41 words without JavaScript (independent JS-off load: 23).
- Subjective: Guardian "Perplexity-User refused" (site returns 403 and robots.txt names only PerplexityBot).
- Regression found by the re-run and fixed: R6-01 (Nike unreadable when `load` never fires).
- Remaining mismatches (84) are mostly site variance (A/B, geo, lazy feeds) and the ground tool's own definitions; none were scanner errors on the sites re-read.

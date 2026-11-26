[![news-image-20261126](https://make.fun/badge/news-image-20261126.svg)](https://make.fun/bounty/news-image-20261126)
[![rank](https://make.fun/badge/news-image-20261126/kuro1996/news-image-20261126/rank.svg)](https://make.fun/bounty/news-image-20261126)
[![reward](https://make.fun/badge/news-image-20261126/kuro1996/news-image-20261126/reward.svg)](https://make.fun/bounty/news-image-20261126)

# News Image — 26 November 2026

**Competition:** [news-image-20261126](https://make.fun/bounty/news-image-20261126) — *Sum up 26 November's world news in one image* ($100, 50 places paid).

## The image

An editorial newspaper front page, **"THE WORLD TODAY — Thursday 26 November 2026"**, drawn fully procedurally by `main.ts` (Node 22 stdlib only, no network, deterministic — two runs produce byte-identical PNGs).

The page carries 35 stories, all first reported 26 Nov 2026 (Reuters, BBC, AP, Al Jazeera / KCNA, Variety, Sky Sports, ScienceAlert, Mongabay, BCCI, Chess, Behind The Black):

- **Lead:** Tariff fallout — CPTPP, ASEAN and EU trade chiefs meet in Vietnam hours after Trump's new tariff salvo on 14 partners; Seoul vows talks; Hanoi races to close a deal.
- **Lead 2:** Kim Jong Un orders a wider tactical nuclear weapons deployment, KCNA reports.
- **Lead 3:** Oil jumps as Iran claims mine hits on two ships in the Strait of Hormuz; Brent $94.81.
- **More:** Java gold mine (13 dead, 13 trapped), BOJ signals faster hikes, rupee at an 11-month high, Uber names Rakesh Ranjan India chief, judges urge dropping the gravest Netanyahu charges, BBC journalists vote to strike, DART asteroid crater images, a Russian freighter docks with the ISS, Thanksgiving Day in the US amid storms, World Chess Game 3, and 22 more numbered stories — plus a UTC timeline, an 8-region bar, and a DATE CHECK box in the footer.

## Run it

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

This writes `out/entry.png` (1024x1024, under 1 MiB).

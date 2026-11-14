# Store-listing assets

Promotional graphics uploaded to the Chrome Web Store and Microsoft Edge Add-ons listings. Not part of the extension package; not bundled by Chrome or Edge. Tracked here so the SVG sources stay alongside the PNGs and re-rendering is one command.

## Files

| File | Size | Used by |
|---|---|---|
| `promo-small.png` | 440 × 280 | Chrome small promotional tile, Edge small promotional tile |
| `promo-marquee.png` | 1400 × 560 | Chrome marquee promotional tile, Edge large promotional tile |
| `promo-small.svg` | source | rasterized to `promo-small.png` |
| `promo-marquee.svg` | source | rasterized to `promo-marquee.png` |
| `readme-banner.png` | 1400 × 340 | banner heading the repo README; vertical crop of `promo-marquee.png` |
| `screenshots/` | 1280 × 800 | Chrome and Edge listing screenshots; the first also illustrates the repo README |

The SVGs reference `../extension/icons/icon-128.png` as the whale image; that file is the canonical icon and the source for the tile's branded element.

## Re-rendering

Requires Inkscape 1.x.

```
cd store-assets
inkscape promo-small.svg   --export-type=png --export-filename=promo-small.png   --export-width=440
inkscape promo-marquee.svg --export-type=png --export-filename=promo-marquee.png --export-width=1400
```

The README banner is cut from the rendered marquee (ImageMagick):

```
convert promo-marquee.png -crop 1400x340+0+110 +repage readme-banner.png
```

## Design notes

- The tile background is a multi-stop linear gradient sampled from the whale icon's own left-edge water colors, scoped (via `gradientUnits="userSpaceOnUse"`) to start at the whale image's top edge and end at its bottom edge. Above the whale the gradient clamps to the top-stop color, below it clamps to the bottom stop. This makes the whale image's water blend continuously with the tile background instead of looking like a sticker pasted on a different gradient.
- A second linear gradient drives an alpha mask on the whale image so its top edge (where the bubbles sit) fades into the background. Without the mask, the bubble area cut off at a hard horizontal line; with it, the bubbles dissolve into the water above.
- Text uses DejaVu Sans, which is installed on the development machine. If re-rendering on a machine without it, swap to whatever sans-serif is available; Inkscape falls back gracefully.

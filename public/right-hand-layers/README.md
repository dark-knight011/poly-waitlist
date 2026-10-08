# Right-hand layers

Use these two production PNGs in this order:

1. right-hand-rear.png — sleeve, palm and supporting fingers.
2. The HTML card.
3. right-hand-front.png — foreground thumb with a small adjoining hand region.

Both PNGs are 1536 × 1024 RGBA on the same full canvas. They retain the original drawing coordinates and RGB artwork. Do not trim their transparent padding, recenter the thumb, or size either layer to its visible bounds.

Give both image elements identical width, height, position, transform, transform origin and animation timing, in the same stage coordinate system. The card must be between their z-indices; separate transformed parent stacking contexts can prevent that interleaving. Disable pointer events and mark the images decorative.

## Reviewed card placement

In source-image coordinates, the placeholder card's upper-right corner is (550, 210), or (35.8073%, 20.5078%) of this asset canvas. The card extends leftward and downward from this anchor. The foreground thumb crosses the card's right edge near y=370. These coordinates describe placement relative to the hand asset, not the page viewport. Use them to establish the shared hand transform from your actual card bounds.

Translate both hand layers outward together for release. They are an occlusion split, not an independently bending thumb rig.

## Preparation and checks

The PNGs were deterministically masked from one right-hand master, without regenerated linework or changed anatomy. The apparent surrounding halo in the source preview was RGB beneath zero alpha; compositing confirmed that it was transparent. Fully transparent RGB has been cleared, and the generator's nominal solid alpha of 253 has been normalized to 255 so the ivory fill remains opaque.

The rear PNG has a two-source-pixel underlap beneath the opaque thumb boundary to reduce resampling hairlines. Reassembling the PNGs at source size differs from the prepared master by at most 1/255 per RGB or alpha channel because of raster rounding. The pair was visually checked with an intervening card and independently resized and rotated at 40% scale and −4°. No visible separation was observed in those checks. Application animation and responsive placement still need integration verification.

## Included editable material

- right-hand-master.png: prepared full drawing; same canvas as both layers.
- right-hand-front-mask.svg: editable thumb selection. White reveals the foreground; the remaining area is transparent. This SVG is a selection guide, not vector-traced engraving. The final PNG export also uses the alpha compensation and underlap described above; simply inverting this mask is not an identical production export.
- right-hand-layer-check.png: card-overlap and transformed reassembly preview.

No application code was changed.

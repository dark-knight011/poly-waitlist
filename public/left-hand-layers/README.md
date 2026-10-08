# Left hand: aligned layers

Both PNGs are 1536 x 1024 RGBA with transparent backgrounds. Both SVG masters embed the same original raster drawing; they are editable clipping wrappers, not vector-traced engraving.

Stack back to front:
1. left-hand-rear.png — sleeve, palm, supporting fingers.
2. Your actual card.
3. left-hand-front.png — foreground thumb and a small adjoining palm region.

Use identical full-canvas position, rendered width/height, scale, rotation and transform origin for both images. Do not trim transparent padding or size the foreground to its visible bounds. Keep the layers in the same stage coordinate system; avoid separate parent stacking contexts that trap the card outside their z-order.

The reviewed grip uses the card left edge at source x=1030 (67.0573% of asset width), crossing the thumb around y=445 (43.4570% of asset height). These are relative hand-asset coordinates, not page coordinates. Adapt the card placement using this contact point.

Animate both hand layers together when releasing the card. This is an overlap split, not a finger rig; independently moving the thumb can expose the separation. A narrow shared edge reduces raster seams.

Preparation: the built-in image edit was tried but shifted the artwork and was rejected. Delivered assets use deterministic SVG masks on the unchanged original image, rendered to PNG with Inkscape. Canvas dimensions, alpha channels and a rendered card-overlap composition were checked. No application code was modified.

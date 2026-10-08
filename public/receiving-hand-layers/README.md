# Receiving hand: aligned envelope grip

Production images:
- receiving-hand-rear.png: supporting fingers, palm, wrist and sleeve behind the envelope.
- receiving-hand-front.png: foreground thumb and adjoining base in front of the envelope.

Both files are 1024 × 1536 RGBA, portrait 2:3. They share the same source coordinates and transparent padding. Do not independently crop or recenter either file.

Stacking order: rear hand → envelope → foreground thumb. During insertion, the envelope itself needs separate back and front layers with the moving card between them. Keep the thumb in front of the envelope front and below the flap. The hand maintains one grip throughout the receiving sequence.

Use identical full-canvas dimensions, position, scale, rotation and transform origin for both hand images. Animate both hand layers and the envelope as one receiver assembly, while retaining the card's independent z-order. The images are decorative and should not intercept pointer events.

## Reviewed placement

Coordinates below are in the 1024 × 1536 hand asset's coordinate system, before scaling:
- Envelope body: x=-360, y=0, width=1360, height=600.
- Envelope lower edge: y=600.
- Foreground thumb tip: approximately x=635, y=330.
- Grip anchor on the envelope's lower edge: approximately x=660, y=600.
- The envelope extends outside the hand canvas; this is intentional.

For an envelope rendered at width E, use the common scale s=E/1360 and display both hand canvases at width 1024*s and height 1536*s. If the envelope's top-left is (Ex,Ey), both hand image top-left positions are (Ex+360*s,Ey). This restores the reviewed overlap without separate thumb offsets.

Example: a 544-pixel-wide envelope uses s=0.4; each hand PNG displays at 409.6 × 614.4 pixels and begins 144 pixels to the right of the envelope's left edge, at the same y-coordinate. Envelope body height is 240 pixels.

## Sleeve clipping

The prepared master ends the patterned sleeve at source y=1360, before the generated artwork reaches the right edge. Everything below that is transparent. In the webpage, position the sleeve end below the scene's clipping boundary. The bottom of the visible stage must be above handTop+1360*s to hide the straight termination. Recalculate this when the receiver is resized; transparent canvas edges are not sleeve edges. Do not independently stretch one layer.

## How these were made

The complete hand was isolated with the built-in image-generation tool from the approved final-frame mockup. Fingers hidden by the envelope were reconstructed, and the sleeve was extended. This is a generated reconstruction, not a pixel-exact extraction of every visible reference line.

Extraction brief: one matching copperplate engraved hand rising from below, ivory opaque fill, complete supporting fingers behind the envelope, distinct foreground thumb on the viewer's right, ornate lace cuff and patterned sleeve, portrait transparent canvas, no envelope, page, lettering, external shadows or decorations.

Both delivered layers were then derived deterministically from that ONE master using the supplied thumb mask. No separate thumb generation was used. The generator's nominal opaque alpha values were normalized, invisible RGB was cleared, and the lower sleeve was trimmed as described above.

At the shared thumb boundary the rear layer contains a narrow two-source-pixel underlap beneath opaque foreground pixels. Alpha compensation preserves the master when the layers reunite. Direct reassembly differs from the prepared master by at most 1/255 in RGB or alpha due to integer raster rounding.

## Checks and editable material

- receiving-hand-layer-check.png: closed-envelope grip, open-envelope clearance and 32% scale/−3° reassembly checks. Envelope drawings are placement guides, not production envelope assets.
- receiving-hand-master.png: prepared full drawing from which both layers were derived.
- receiving-hand-front-mask.svg: editable foreground selection; white shows the thumb region. This is a mask, not a vector tracing of the engraving. A simple inverse-mask export will not reproduce the production PNG's alpha compensation and underlap exactly.
- verification.json: canvas dimensions, placement coordinates and reassembly error values.

Visual checks found no visible separation in the reviewed compositions. Website animation and responsive placement still need integration checks. No application code was changed.

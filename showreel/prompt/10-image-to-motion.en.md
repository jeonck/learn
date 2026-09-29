# 10. Image first, motion second

🇰🇷 [한국어](10-image-to-motion.md)

| Item | Details |
| --- | --- |
| Source & video | ▶ [@ssaengcho thread](https://www.threads.com/@ssaengcho/post/Dd1QcoSGr_9) (249 likes) — two videos: a flat single-layer image, and a Photoshop PSD |
| Tool | Claude Opus 5.5 (motion graphics generated as code) |
| Output | Motion graphics that keep the composition, colours and type of a designed image |

## What it looks like

Instead of "obviously AI" motion graphics piled with flashy effects, the image design you finished first comes to life as it is.
Even a flat, unlayered image is rebuilt in code as closely as possible; give it a PSD and it animates layer by layer, more precisely.

## Prompt to reproduce

Step 1: make the image design for the important scene first (an image model or Photoshop).

Step 2, the video:

```
Turn the attached [image / PSD file] into a [length]-second motion-graphics piece.
- Keep the composition, colours, text and element placement as close to the image as possible
- If it isn't layered, redraw the elements in code so each can move on its own
- Use motion only as far as it serves what this scene says, [key message]; no effects for their own sake
- Time the music and sound effects to the motion beats
- After rendering, compare side by side with the original image and fix the differences
```

## What to change

- The attachment, length and key message. For several scenes, make one image per scene and give them in order.
- If you have a PSD, give the PSD. Its layers become the moving elements and the result is the tightest.

## Why it works

- **Design and motion are separated**: composition, colour and type are already decided in the image, so the model focuses only on motion. It avoids AI motion graphics that all look alike.
- **The image is the style guide**: the same principle as the material sheet in [05](05-material-sheet.en.md), applied to finished scenes.
- **Content first**: deciding what the scene says at the image stage keeps the video from becoming effects only.

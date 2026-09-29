# 05. Lock the style with a material sheet

🇰🇷 [한국어](05-material-sheet.md)

| Item | Details |
| --- | --- |
| Source & video | ▶ [@prompt_what thread](https://www.threads.com/@prompt_what/post/DdOAI1cis07) (73K views, 413 likes) |
| Tool | ChatGPT Astra (image generation → motion graphics) |
| Output | Illustrated motion-graphics demo with moving characters and props (art style can vary, e.g. paper texture) |

## What it looks like

A cute demo where the characters, props and letters on one material sheet break away and move on their own.

## Prompt to reproduce

Step 1, the material sheet image:

```
Make a material sheet for a [topic] motion-graphics piece.
- A 6 × 6 grid
- Characters, props, type and ornaments that fit the topic, in one consistent art style and colour scheme
- Art style: [e.g. paper collage / flat vector / crayon]
- Space every element apart so each can be cut out and animated, with nothing overlapping or cropped
```

Step 2, the video:

```
Make a [length]-second motion-graphics demo video from these materials, with music.
```

## Refining notes

Expect two or three rounds of revision requests to match exactly what you want.

## Why it works

- The style is locked **by an image**, not words; no need to keep saying "make it pretty and stylish".
- **Spaced, separated elements** are easy to animate one by one.
- Fewer revision rounds save tokens and credits.

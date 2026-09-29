# 12. Motion-graphics MV with finished cards as keyframes

🇰🇷 [한국어](12-card-keyframe-mv.md)

| Item | Details |
| --- | --- |
| Source & video | ▶ [@crome.ai thread](https://www.threads.com/@crome.ai/post/DcdiT0uDUcf) "Love's consonants and vowels" — workflow in reply 2, the first 15 s prompt in reply 3 |
| Tool | Claude Code (Opus 5) for planning and images → MiniMax H3 video → Gemini for lyrics and timeline → Suno music |
| Output | 30 s, 16:9, glassmorphism Korean-letter title sequence that doubles as a music video |

## What it looks like

Candy-coloured 2.5D motion graphics where two characters move through glass Hangul letter strokes, hearts and a ribbon track, transforming seamlessly. The music was added after the video, fitted to the plan.

## Prompt to reproduce

Step 1, plan and cards (Claude Code):

```
Plan a 30-second [topic] motion-graphics piece in [style: glassmorphism, diffuse mood].
- [6] sections; for each, make one finished card image that is the scene the section arrives at (on-screen lettering included)
- If there are characters, also make turnaround sheets to lock faces, hair and outfits
- After I confirm, write the prompt for the video model
```

Step 2, skeleton of the video-model prompt (rewritten following the original's structure):

```
[15]-second 16:9 title sequence as ONE CONTINUOUS TRANSFORMATION.
REFERENCES: Picture 1–[6] are finished cards and the authority on layout, type and colour; each is the state its section arrives at.
Picture [7–8] are character sheets for faces, hair and wardrobe only; never copy their backgrounds or poses.
ORDER: the closing object of each card physically becomes the opening object of the next: [heart → letters → strokes → track → strip → bowl].
TEXT: all lettering already exists on the cards; reveal it with light or glass sweeps, then freeze it. Never redraw, add or misspell letters.
CONTINUITY: the characters' motion carries across transitions; a reach begun at one card's end completes at the next.
TIMING: anticipation, fast launch, overshoot, one elastic settle; something changes every third of a second; each card lands sooner than the last.
STYLE: glossy candy-coloured 2.5D glass, rim light, soft bevels, [palette]. Static camera. No subtitles or extra text.
Then a timecoded beat list: [0s–0.9s] …, [0.9s–1.8s] …
```

Step 3, music: give the plan and ask "extract lyrics and a music prompt that fit the 30-second timeline" → generate a 30 s track with a music tool → sync in post.

## What to change

- Topic, the six cards' content, characters, palette and the transformation chain. Fewer cards means each scene lingers longer.

## Why it works

- **Finished cards = keyframes**: pinning each section's arrival scene as an image keeps composition and lettering stable (the same principle as [10](10-image-to-motion.en.md)).
- **Text-lock rule**: letters are only revealed, never redrawn, which stops video-model typos.
- **Named rules** (continuity, tension, morph, style, framing): even a long prompt gets followed clause by clause.
- **Video first, music from the plan**: lyrics and music come from the same timeline, so cuts and music line up.

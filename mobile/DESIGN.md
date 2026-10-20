# Chess Coach design notes

The app should feel like a coach's notebook next to a wooden board, not like a generic dashboard.
These are the rules the screens follow, and the defaults they deliberately avoid.

## Direction

- **Material:** warm paper, ink and walnut. Backgrounds are tinted paper, never pure white or black.
- **Voice:** a coach talking to one player about their games. Specific numbers and moves, never "Welcome back!".
- **Chess-native marks instead of generic icons:** `??` for a blunder, `?` for a mistake, `!` for a good find,
  piece silhouettes in the tab bar. No thin-line icon set, no emoji.

## Type

| Role | Face | Use |
| --- | --- | --- |
| Display | Fraunces SemiBold | Screen titles, big numbers, annotation marks |
| Text | IBM Plex Sans 400 / 500 / 600 | Everything else |

Inter and Roboto are avoided on purpose: they read as "nobody picked a font". Moves (`Nxe5`) are set in the text face
with tabular figures so move lists line up like a scoresheet.

## Colour

| Token | Light | Dark | Meaning |
| --- | --- | --- | --- |
| `paper` | #F2ECE1 | #171411 | background |
| `sheet` | #FAF6EE | #211D18 | raised surface (used sparingly) |
| `ink` | #1F1A15 | #EEE6D8 | text |
| `inkSoft` | #6A6054 | #A99E8F | secondary text |
| `rule` | #DCD1BF | #3A332B | hairlines |
| `walnutLight` / `walnutDark` | #E8D6B5 / #A97C50 | #C9B08A / #7D5A38 | board squares |
| `blunder` | #A8392A | #E07A68 | `??`, losses |
| `mistake` | #A86B12 | #DDA24A | `?` |
| `good` | #2F6A4C | #7FC29B | `!`, wins, primary action |

One accent at a time: green for the primary action, red only for real blunders. No gradients, no purple, no glow.

## Layout

- Left-aligned, single column. Each screen has **one** dominant element and **one** primary button.
  Today's dominant element is the next real position you'll train, not a stat card.
- Hairline rules and spacing separate groups. Cards only where something is a distinct object (a drill result).
- Spacing rhythm: 4 / 8 / 12 / 20 / 32. Tight inside a group, wide between groups.
- Radius 6 for buttons and the board. No pills except tiny status tags.
- Empty states say exactly what to do next ("Import your last 10 rapid games").

## Motion and feedback

- Short ease-out only, no bounce. Haptic tick on a correct answer, a heavier one on a wrong answer.

## Sources

- [Anti-patterns that make interfaces look generated](https://mintlify.wiki/pbakaus/impeccable/concepts/anti-patterns)
- [Why SaaS UI looks AI-generated](https://www.saasui.design/blog/saas-ui-looks-ai-generated)
- [AI slop design tells](https://www.925studios.co/blog/ai-slop-design-tells)

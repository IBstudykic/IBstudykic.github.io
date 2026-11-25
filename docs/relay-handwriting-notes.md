# Relay changes for handwriting and Notes

This is a handoff for whoever updates the Cloudflare Worker relay (`RELAY` in `index.html`, routes `POST /ib/<op>`). The front end is finished and already sends everything below. Until the worker supports it, the app fails safely: handwriting marking shows an error and saves nothing, and notes stay on the device.

Every request body still carries the usual fields: `{pass, user, name, uid, ...}`.

## 1. `ask` with `mode: "mark"`: accept images

The front end now sends the user message `content` either as a **string** (as before) or as an **array of Anthropic content blocks**:

```json
{
  "mode": "mark",
  "rubric": "<system prompt: marking instructions + JSON format>",
  "book": "math",
  "pages": [61],
  "hw": 2,
  "messages": [{
    "role": "user",
    "content": [
      {"type": "text", "text": "Question (Exam practice, 4 marks): ... The student's handwritten working is in the 2 attached images."},
      {"type": "text", "text": "Image 1 of 2:"},
      {"type": "image", "source": {"type": "base64", "media_type": "image/png", "data": "iVBORw0..."}},
      {"type": "text", "text": "Image 2 of 2:"},
      {"type": "image", "source": {"type": "base64", "media_type": "image/jpeg", "data": "/9j/4AAQ..."}}
    ]
  }]
}
```

What the worker needs to do:

- **Pass array content through unchanged** to the Messages API. Don't stringify or concatenate it.
- If the worker adds textbook page text (from `book`/`pages`) to the user message: when `content` is an array, add the pages as a **new leading `{"type":"text"}` block**. Doing `pagesText + content` turns the array into `"[object Object]"`.
- `hw` = number of images (0 or missing = text only). Use it to:
  - pick a vision-capable model (any current Claude model works);
  - raise `max_tokens` when `hw > 0`. The reply now includes a full transcription of the working (`read`) and a per-mark breakdown, so allow **at least 4000**. The page-sorting call and Notes calls (below) also benefit from 4000+;
  - optionally rate-limit separately, since image calls cost more.
- **Validate**: `media_type` must be `image/png` or `image/jpeg`; at most 30 images per request; each base64 `data` up to about 7 MB (5 MB decoded); total body up to about 30 MB (the Anthropic request limit is 32 MB). The front end already scales every image to 1568 px or less on the long edge, so real requests are typically 100–400 KB per image.
- Cloudflare request body limits are 100 MB on Free/Pro, so the size isn't a problem there. Just don't buffer the body twice.
- Response: unchanged, `{"text": "<model reply>"}`.

The prompts ask Claude to reply with JSON. Fields the front end now reads (all optional):

| field | where | meaning |
|---|---|---|
| `read` | handwritten marking | transcription of the working (markdown + LaTeX). **If images were sent and `read` is empty, the front end treats it as "Claude couldn't see the images" and saves nothing**, so make sure the images really reach the model. |
| `illegible` | handwritten marking | parts it couldn't read |
| `marks` | maths/science marking | `[{code:"M1", ok:true, why, at}]` |
| `wrong` | maths/science marking | first wrong line, quoted |
| `slip` | maths/science marking | error category for the mistake log |

These calls also use `mode:"mark"` with images. Nothing extra is needed beyond the above:

- **Exam page sorting**: the rubric starts "You are sorting a student's handwritten exam script". It sends up to 30 page photos and expects `{"pages": {"1": [1], "2a": [1,2]}}`.
- **Notes organise** (rubric starts "You organise a student's study notes"), **tidy** ("You turn a student's rough study notes…") and **flashcards** (`CARD_SYS`). Text and/or images.

## 2. New ops: note store (ink and photos for Notes)

A note's text and metadata already sync through the existing `sync` op (they live in `S.prog.notes`). Ink strokes and photos are too big for that, so the app stores them locally (IndexedDB) and backs them up through three new ops. All are scoped to the signed-in `user` key, the same as `sync`.

### `POST /ib/noteput`
```json
{"user": "finn", "id": "lx3k9a2b1", "t": 1764000000000,
 "data": {"mode": "ink", "ink": {"h": 1400, "strokes": [{"c":"ink","w":2.1,"pr":1,"p":[x,y,pressure, ...]}]}, "photos": ["data:image/jpeg;base64,..."], "t": 1764000000000}}
```
Store `data` under `(user, id)`, last write wins on `t`. Reply `{"ok":1}`.
Sizes: ink is usually 20–300 KB of JSON. Photos are data URLs of about 150–400 KB each, up to 8 per note. **Use R2** (or KV split per photo): a note with photos can exceed KV's 25 MB value limit only in extreme cases, but R2 is the safer choice. Suggested key: `notes/<user>/<id>.json`.

### `POST /ib/noteget`
`{"user": "...", "id": "..."}` → `{"data": <what was put>, "t": 1764...}`, or `{"data": null}` if there isn't one.

### `POST /ib/notedel`
`{"user": "...", "id": "..."}` → `{"ok":1}`. Deletes the stored object. Also called when a note ends up with no ink and no photos.

Errors: reply `{"err": "..."}` as other ops do. If the worker returns an error containing "unknown", "unsupported", "not found", "no such", "bad op" or "404", the app stops calling the note store for 24 hours and keeps notes on the device only. So an un-updated worker should reply `{"err":"unknown op"}` (or 404) for these ops.

Guest users (no `user` key) never call these ops.

## 3. `sync`: nothing new, but payload size grows

`S.prog.notes` adds, per note: title, subject, topic, tags, summary, typed text, Claude's transcript (up to 30 k chars) and revision sheet (up to 30 k chars). A heavy note-taker could add a few MB to the sync blob over a year. If `sync` uses KV, that's fine up to 25 MB. Worth logging the payload size.

## Quick test checklist

1. Practice → a maths question → **Write** → draw → **Mark with Claude**. You should get a score, a "Marks" breakdown, and "How Claude read your handwriting" matching what was drawn.
2. Same with **Photo** (photo of handwritten working).
3. Exam mode → paper → **Sit it on paper** → Submit → add page photos → **Mark my paper**. Each question should be marked from the right page.
4. Notes → New note → write → **Organise**. The note should get a title, be filed under the right subject and topic, and show a transcript. Then sign in on a second browser and open the note: the ink should load (via `noteget`).

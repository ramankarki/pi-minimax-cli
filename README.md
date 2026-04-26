# pi-minimax-cli

A [pi](https://pi.dev/) extension that integrates MiniMax's `mmx` CLI as callable tools.

> **Note:** This package consumes maximum of **5k tokens** of the context window when loaded, as it registers all mmx CLI commands as tools in the pi agent.

## Purpose

This package demonstrates a **self-evolving architecture** where the extension can rebuild itself when MiniMax releases a new `mmx` CLI version. Instead of manually updating the extension code, you simply approve the rebuild and pi reconstructs it from scratch.

## How It Works

```
┌─────────────────────────────────────────────────────────────────────┐
│                           Self-Evolution Loop                       │
└─────────────────────────────────────────────────────────────────────┘

   User runs mmx tool
         │
         ▼
   ┌─────────────┐    ┌─────────────┐    ┌───────────────┐
   │  Check mmx  │───►│  Version    │───►│  If mismatch  │
   │  version    │    │  compare    │    │  → warn user  │
   └─────────────┘    └─────────────┘    └───────────────┘
                                          │             │
                                   ┌──────┘             └──────┐
                                   │ User says "yes"           │
                                   ▼                           ▼
                        ┌─────────────────┐         ┌─────────────────┐
                        │ Run skill that  │         │ Continue with   │
                        │ triggers prompt │         │ current version │
                        └────────┬────────┘         └─────────────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │ Prompt template │
                        │ scrapes mmx -h  │
                        │ and rebuilds    │
                        │ extension.ts    │
                        └─────────────────┘
```

### The Components

| Component     | File                                    | Role                                  |
| ------------- | --------------------------------------- | ------------------------------------- |
| **Extension** | `extensions/pi-minimax-cli.ts`          | Wraps `mmx` commands as pi tools      |
| **Prompt**    | `prompts/build-pi-minimax-cli.md`       | Instructions to rebuild the extension |
| **Skill**     | `skills/update-pi-minimax-cli/SKILL.md` | Triggers the rebuild workflow         |

## Project Structure

```
pi-minimax-cli/
├── extensions/
│   └── pi-minimax-cli.ts    # Tool wrappers (auto-regenerated)
├── prompts/
│   └── build-pi-minimax-cli.md  # Rebuild instructions
├── skills/
│   └── update-pi-minimax-cli/
│       └── SKILL.md         # Trigger for rebuild
└── AGENTS.md                # Agent context
```

## Generated Tools

After the prompt rebuilds the extension, you get access to these tool categories:

### 🖼️ Image Generation

| Tool                 | Description                                |
| -------------------- | ------------------------------------------ |
| `mmx_image_generate` | Generate images (image-01 / image-01-live) |

```typescript
// Example: Generate an image
mmx_image_generate({
  prompt: 'A cozy coffee shop interior with warm lighting',
  aspect_ratio: '16:9',
  n: 2,
});
// Returns: [{ url: "..." }, { url: "..." }]
```

### 🎬 Video Generation

| Tool                 | Description                |
| -------------------- | -------------------------- |
| `mmx_video_generate` | Text-to-video (Hailuo-2.3) |
| `mmx_video_task_get` | Poll video task status     |
| `mmx_video_download` | Download completed video   |

```typescript
// Example: Generate a video
mmx_video_generate({
  prompt: 'A drone shot flying over misty mountains at sunrise',
  model: 'MiniMax-Hailuo-2.3',
  download: './output/drone-shot.mp4',
});
// Returns: { task_id: "v_abc123", status: "processing" }
```

### 🎵 Music Generation

| Tool                 | Description                |
| -------------------- | -------------------------- |
| `mmx_music_generate` | Generate songs (music-2.6) |
| `mmx_music_cover`    | Generate cover versions    |

```typescript
// Example: Generate background music
mmx_music_generate({
  prompt: 'Ambient lo-fi hip hop for study sessions',
  mood: 'chill and relaxed',
  instruments: 'piano, lo-fi beats',
  out: './output/study-beats.mp3',
});
```

### 🗣️ Speech Synthesis

| Tool                    | Description                    |
| ----------------------- | ------------------------------ |
| `mmx_speech_synthesize` | Text-to-speech (speech-2.8-hd) |
| `mmx_speech_voices`     | List available voices          |

```typescript
// Example: Synthesize narration
mmx_speech_synthesize({
  text: 'Welcome to the future of AI creativity',
  voice: 'English_expressive_narrator',
  speed: 1.0,
  out: './output/narration.mp3',
});
```

### 🔍 Web Search

| Tool               | Description                |
| ------------------ | -------------------------- |
| `mmx_search_query` | Search the web via MiniMax |

### 👁️ Vision

| Tool                  | Description               |
| --------------------- | ------------------------- |
| `mmx_vision_describe` | Describe images using VLM |

```typescript
// Example: Analyze an image
mmx_vision_describe({
  image: './photos/product.png',
  prompt: 'Describe this product photo for an e-commerce listing',
});
// Returns: "A sleek wireless headphone on a white background..."
```

---

## Example: Using the Tools Inside pi Agent

Here's what a typical conversation looks like when using these tools:

### User Prompt

```
Generate a short video of a cat playing piano in a jazz bar, then
create some moody background music for it, and add narration saying
"Ladies and gentlemen, witness the future of music."
```

### pi Agent Response

> **Generating video...**
>
> `mmx_video_generate` → `{ task_id: "v_k9x2m" }`

> **Creating background music...**
>
> `mmx_music_generate` → Saved to `./jazz-cat-music.mp3`

> **Polling video status...**
>
> `mmx_video_task_get` → status: "processing"

> **Video ready!** Downloading...
>
> `mmx_video_download` → Saved to `./jazz-cat.mp4`

> **Adding narration...**
>
> `mmx_speech_synthesize` → Saved to `./narration.mp3`

**Done!** Created three files:

- `./jazz-cat.mp4` (12 second video)
- `./jazz-cat-music.mp3` (30 second ambient jazz)
- `./narration.mp3` (dramatic voiceover)

---

### User Prompt

```
Analyze the attached product photo and write a short e-commerce
description, then generate a promotional image in a different style.
```

### pi Agent Response

> **Analyzing image...**
>
> `mmx_vision_describe` → "A minimalist ceramic vase with...
> Sage green glaze, matte finish, approximately 25cm tall.
> Set against a concrete background with soft natural lighting."

> **Writing e-commerce description...**
>
> Generated:
> _"Handcrafted sage green ceramic vase with a matte glaze finish.
> Perfect for minimalists seeking to add a touch of nature to their
> space. Each piece is unique with natural color variations."_

> **Generating promotional image...**
>
> `mmx_image_generate` → Saved to `./promo-vase.jpg`

**Done!** Analyzed your photo and created a promotional variant.

---

## Links

- [MiniMax Platform](https://platform.minimax.io)
- [mmx CLI Docs](https://platform.minimax.io/docs/token-plan/minimax-cli)
- [pi coding agent](https://pi.dev/)

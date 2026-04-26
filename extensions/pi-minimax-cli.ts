import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Type } from "typebox";

const SUPPORTED_MMX_VERSION = "1.0.11";

interface MmxVersionResult {
  version: string;
  isMatch: boolean;
  needsUpdate: boolean;
  warningMessage?: string;
}

async function getMmxVersion(): Promise<MmxVersionResult> {
  try {
    const proc = await new Promise<{ stdout: string; code: number }>((resolve) => {
      const { exec } = require("node:child_process");
      exec("mmx -v", { timeout: 10000 }, (err: Error | null, stdout: string, stderr: string) => {
        resolve({ stdout: stdout.trim(), code: 0 });
      });
    });

    const version = proc.stdout.replace(/^mmx\s*/i, "").trim();
    const isMatch = version === SUPPORTED_MMX_VERSION;
    const needsUpdate = !isMatch;

    let warningMessage: string | undefined;
    if (needsUpdate) {
      warningMessage = `⚠️ mmx CLI version mismatch: found ${version}, expected ${SUPPORTED_MMX_VERSION}. Please allow the pi agent to update the pi-minimax-cli extension by saying "yes" or "update".`;
    }

    return { version, isMatch, needsUpdate, warningMessage };
  } catch {
    return {
      version: "unknown",
      isMatch: false,
      needsUpdate: true,
      warningMessage: `⚠️ Could not detect mmx CLI version. The pi-minimax-cli extension may need to be updated.`,
    };
  }
}

async function runMmxCommand(args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const { exec } = require("node:child_process");
    const command = `mmx ${args.join(" ")}`;
    exec(command, { timeout: 300000 }, (err: Error | null, stdout: string, stderr: string) => {
      if (err) {
        reject(new Error(stderr || err.message));
      } else {
        resolve(stdout + stderr);
      }
    });
  });
}

export default async function (pi: ExtensionAPI) {
  // Auth tools
  pi.registerTool({
    name: "mmx_auth_login",
    label: "MiniMax Auth Login",
    description: "Authenticate to MiniMax via OAuth or API key",
    parameters: Type.Object({
      method: Type.Optional(Type.Union([Type.Literal("oauth"), Type.Literal("api-key")])),
      api_key: Type.Optional(Type.String({ description: "API key to store" })),
      no_browser: Type.Optional(Type.Boolean({ description: "Use device-code flow instead of browser" })),
    }),
    async execute(_toolCallId, params) {
      const version = await getMmxVersion();
      if (version.warningMessage) {
        return {
          content: [{ type: "text", text: version.warningMessage }],
          details: { warning: true },
        };
      }

      const args: string[] = ["auth login"];
      if (params.method) args.push(`--method ${params.method}`);
      if (params.api_key) args.push(`--api-key ${params.api_key}`);
      if (params.no_browser) args.push("--no-browser");

      const output = await runMmxCommand(args);
      return { content: [{ type: "text", text: output }] };
    },
  });

  pi.registerTool({
    name: "mmx_auth_status",
    label: "MiniMax Auth Status",
    description: "Show current authentication state and quota snapshot",
    parameters: Type.Object({}),
    async execute(_toolCallId, _params) {
      const version = await getMmxVersion();
      if (version.warningMessage) {
        return {
          content: [{ type: "text", text: version.warningMessage }],
          details: { warning: true },
        };
      }

      const output = await runMmxCommand(["auth status"]);
      return { content: [{ type: "text", text: output }] };
    },
  });

  pi.registerTool({
    name: "mmx_auth_refresh",
    label: "MiniMax Auth Refresh",
    description: "Manually refresh OAuth token",
    parameters: Type.Object({}),
    async execute(_toolCallId, _params) {
      const version = await getMmxVersion();
      if (version.warningMessage) {
        return {
          content: [{ type: "text", text: version.warningMessage }],
          details: { warning: true },
        };
      }

      const output = await runMmxCommand(["auth refresh"]);
      return { content: [{ type: "text", text: output }] };
    },
  });

  pi.registerTool({
    name: "mmx_auth_logout",
    label: "MiniMax Auth Logout",
    description: "Revoke tokens and clear stored credentials",
    parameters: Type.Object({
      yes: Type.Optional(Type.Boolean({ description: "Skip confirmation prompt" })),
    }),
    async execute(_toolCallId, params) {
      const version = await getMmxVersion();
      if (version.warningMessage) {
        return {
          content: [{ type: "text", text: version.warningMessage }],
          details: { warning: true },
        };
      }

      const args: string[] = ["auth logout"];
      if (params.yes) args.push("--yes");

      const output = await runMmxCommand(args);
      return { content: [{ type: "text", text: output }] };
    },
  });

  // Speech tools
  pi.registerTool({
    name: "mmx_speech_synthesize",
    label: "MiniMax Speech Synthesize",
    description: "Synchronous TTS, up to 10k chars (speech-2.8-hd / 2.6 / 02)",
    parameters: Type.Object({
      model: Type.Optional(Type.String({ description: "Model ID (default: speech-2.8-hd)" })),
      text: Type.Optional(Type.String({ description: "Text to synthesize" })),
      text_file: Type.Optional(Type.String({ description: "Read text from file (use - for stdin)" })),
      voice: Type.Optional(Type.String({ description: "Voice ID (default: English_expressive_narrator)" })),
      speed: Type.Optional(Type.Number({ description: "Speech speed multiplier" })),
      volume: Type.Optional(Type.Number({ description: "Volume level" })),
      pitch: Type.Optional(Type.Number({ description: "Pitch adjustment" })),
      format: Type.Optional(Type.String({ description: "Audio format (default: mp3)" })),
      sample_rate: Type.Optional(Type.Number({ description: "Sample rate (default: 32000)" })),
      bitrate: Type.Optional(Type.Number({ description: "Bitrate (default: 128000)" })),
      channels: Type.Optional(Type.Number({ description: "Audio channels (default: 1)" })),
      language: Type.Optional(Type.String({ description: "Language boost" })),
      subtitles: Type.Optional(Type.Boolean({ description: "Include subtitle timing data" })),
      pronunciation: Type.Optional(Type.Array(Type.String({ description: "Custom pronunciation (from/to)" }))),
      out: Type.Optional(Type.String({ description: "Save audio to file" })),
      stream: Type.Optional(Type.Boolean({ description: "Stream raw audio to stdout" })),
    }),
    async execute(_toolCallId, params) {
      const version = await getMmxVersion();
      if (version.warningMessage) {
        return {
          content: [{ type: "text", text: version.warningMessage }],
          details: { warning: true },
        };
      }

      const args: string[] = ["speech synthesize"];
      if (params.model) args.push(`--model ${params.model}`);
      if (params.text) args.push(`--text "${params.text.replace(/"/g, '\\"')}"`);
      if (params.text_file) args.push(`--text-file ${params.text_file}`);
      if (params.voice) args.push(`--voice ${params.voice}`);
      if (params.speed !== undefined) args.push(`--speed ${params.speed}`);
      if (params.volume !== undefined) args.push(`--volume ${params.volume}`);
      if (params.pitch !== undefined) args.push(`--pitch ${params.pitch}`);
      if (params.format) args.push(`--format ${params.format}`);
      if (params.sample_rate !== undefined) args.push(`--sample-rate ${params.sample_rate}`);
      if (params.bitrate !== undefined) args.push(`--bitrate ${params.bitrate}`);
      if (params.channels !== undefined) args.push(`--channels ${params.channels}`);
      if (params.language) args.push(`--language ${params.language}`);
      if (params.subtitles) args.push("--subtitles");
      if (params.pronunciation) params.pronunciation.forEach((p) => args.push(`--pronunciation ${p}`));
      if (params.out) args.push(`--out ${params.out}`);
      if (params.stream) args.push("--stream");

      const output = await runMmxCommand(args);
      return { content: [{ type: "text", text: output }] };
    },
  });

  pi.registerTool({
    name: "mmx_speech_generate",
    label: "MiniMax Speech Generate",
    description: "Synchronous TTS, up to 10k chars (speech-2.8-hd / 2.6 / 02) - alias for synthesize",
    parameters: Type.Object({
      model: Type.Optional(Type.String({ description: "Model ID (default: speech-2.8-hd)" })),
      text: Type.Optional(Type.String({ description: "Text to synthesize" })),
      text_file: Type.Optional(Type.String({ description: "Read text from file (use - for stdin)" })),
      voice: Type.Optional(Type.String({ description: "Voice ID (default: English_expressive_narrator)" })),
      speed: Type.Optional(Type.Number({ description: "Speech speed multiplier" })),
      volume: Type.Optional(Type.Number({ description: "Volume level" })),
      pitch: Type.Optional(Type.Number({ description: "Pitch adjustment" })),
      format: Type.Optional(Type.String({ description: "Audio format (default: mp3)" })),
      sample_rate: Type.Optional(Type.Number({ description: "Sample rate (default: 32000)" })),
      bitrate: Type.Optional(Type.Number({ description: "Bitrate (default: 128000)" })),
      channels: Type.Optional(Type.Number({ description: "Audio channels (default: 1)" })),
      language: Type.Optional(Type.String({ description: "Language boost" })),
      subtitles: Type.Optional(Type.Boolean({ description: "Include subtitle timing data" })),
      pronunciation: Type.Optional(Type.Array(Type.String({ description: "Custom pronunciation (from/to)" }))),
      out: Type.Optional(Type.String({ description: "Save audio to file" })),
      stream: Type.Optional(Type.Boolean({ description: "Stream raw audio to stdout" })),
    }),
    async execute(_toolCallId, params) {
      const version = await getMmxVersion();
      if (version.warningMessage) {
        return {
          content: [{ type: "text", text: version.warningMessage }],
          details: { warning: true },
        };
      }

      const args: string[] = ["speech generate"];
      if (params.model) args.push(`--model ${params.model}`);
      if (params.text) args.push(`--text "${params.text.replace(/"/g, '\\"')}"`);
      if (params.text_file) args.push(`--text-file ${params.text_file}`);
      if (params.voice) args.push(`--voice ${params.voice}`);
      if (params.speed !== undefined) args.push(`--speed ${params.speed}`);
      if (params.volume !== undefined) args.push(`--volume ${params.volume}`);
      if (params.pitch !== undefined) args.push(`--pitch ${params.pitch}`);
      if (params.format) args.push(`--format ${params.format}`);
      if (params.sample_rate !== undefined) args.push(`--sample-rate ${params.sample_rate}`);
      if (params.bitrate !== undefined) args.push(`--bitrate ${params.bitrate}`);
      if (params.channels !== undefined) args.push(`--channels ${params.channels}`);
      if (params.language) args.push(`--language ${params.language}`);
      if (params.subtitles) args.push("--subtitles");
      if (params.pronunciation) params.pronunciation.forEach((p) => args.push(`--pronunciation ${p}`));
      if (params.out) args.push(`--out ${params.out}`);
      if (params.stream) args.push("--stream");

      const output = await runMmxCommand(args);
      return { content: [{ type: "text", text: output }] };
    },
  });

  pi.registerTool({
    name: "mmx_speech_voices",
    label: "MiniMax Speech Voices",
    description: "List available system voices",
    parameters: Type.Object({
      language: Type.Optional(Type.String({ description: "Filter voices by language (e.g. english, korean, japanese)" })),
    }),
    async execute(_toolCallId, params) {
      const version = await getMmxVersion();
      if (version.warningMessage) {
        return {
          content: [{ type: "text", text: version.warningMessage }],
          details: { warning: true },
        };
      }

      const args: string[] = ["speech voices"];
      if (params.language) args.push(`--language ${params.language}`);

      const output = await runMmxCommand(args);
      return { content: [{ type: "text", text: output }] };
    },
  });

  // Image tools
  pi.registerTool({
    name: "mmx_image_generate",
    label: "MiniMax Image Generate",
    description: "Generate images (image-01 / image-01-live)",
    parameters: Type.Object({
      prompt: Type.String({ description: "Image description" }),
      aspect_ratio: Type.Optional(Type.String({ description: "Aspect ratio (e.g. 16:9, 1:1)" })),
      n: Type.Optional(Type.Number({ description: "Number of images to generate (default: 1)" })),
      seed: Type.Optional(Type.Number({ description: "Random seed for reproducible generation" })),
      width: Type.Optional(Type.Number({ description: "Custom width in pixels. Range [512, 2048], must be multiple of 8" })),
      height: Type.Optional(Type.Number({ description: "Custom height in pixels. Range [512, 2048], must be multiple of 8" })),
      prompt_optimizer: Type.Optional(Type.Boolean({ description: "Automatically optimize the prompt before generation" })),
      aigc_watermark: Type.Optional(Type.Boolean({ description: "Embed AI-generated content watermark in the output image" })),
      subject_ref: Type.Optional(Type.String({ description: "Subject reference for character consistency. Format: type=character,image=path-or-url" })),
      out_dir: Type.Optional(Type.String({ description: "Download images to directory" })),
      out_prefix: Type.Optional(Type.String({ description: "Filename prefix (default: image)" })),
    }),
    async execute(_toolCallId, params) {
      const version = await getMmxVersion();
      if (version.warningMessage) {
        return {
          content: [{ type: "text", text: version.warningMessage }],
          details: { warning: true },
        };
      }

      const args: string[] = ["image generate"];
      args.push(`--prompt "${params.prompt.replace(/"/g, '\\"')}"`);
      if (params.aspect_ratio) args.push(`--aspect-ratio ${params.aspect_ratio}`);
      if (params.n !== undefined) args.push(`--n ${params.n}`);
      if (params.seed !== undefined) args.push(`--seed ${params.seed}`);
      if (params.width !== undefined) args.push(`--width ${params.width}`);
      if (params.height !== undefined) args.push(`--height ${params.height}`);
      if (params.prompt_optimizer) args.push("--prompt-optimizer");
      if (params.aigc_watermark) args.push("--aigc-watermark");
      if (params.subject_ref) args.push(`--subject-ref ${params.subject_ref}`);
      if (params.out_dir) args.push(`--out-dir ${params.out_dir}`);
      if (params.out_prefix) args.push(`--out-prefix ${params.out_prefix}`);

      const output = await runMmxCommand(args);
      return { content: [{ type: "text", text: output }] };
    },
  });

  // Video tools
  pi.registerTool({
    name: "mmx_video_generate",
    label: "MiniMax Video Generate",
    description: "Generate a video (T2V: Hailuo-2.3 / 2.3-Fast / Hailuo-02 | I2V: I2V-01 / I2V-01-Director / I2V-01-live | S2V: S2V-01)",
    parameters: Type.Object({
      model: Type.Optional(Type.String({ description: "Model ID (default: MiniMax-Hailuo-2.3)" })),
      prompt: Type.String({ description: "Video description" }),
      first_frame: Type.Optional(Type.String({ description: "First frame image (local path or URL)" })),
      last_frame: Type.Optional(Type.String({ description: "Last frame image (local path or URL)" })),
      subject_image: Type.Optional(Type.String({ description: "Subject reference image for character consistency" })),
      callback_url: Type.Optional(Type.String({ description: "Webhook URL for completion notification" })),
      download: Type.Optional(Type.String({ description: "Save video to file on completion" })),
      no_wait: Type.Optional(Type.Boolean({ description: "Return task ID immediately without waiting" })),
      async: Type.Optional(Type.Boolean({ description: "Return task ID immediately (agent/CI mode)" })),
      poll_interval: Type.Optional(Type.Number({ description: "Polling interval when waiting (default: 5)" })),
    }),
    async execute(_toolCallId, params) {
      const version = await getMmxVersion();
      if (version.warningMessage) {
        return {
          content: [{ type: "text", text: version.warningMessage }],
          details: { warning: true },
        };
      }

      const args: string[] = ["video generate"];
      if (params.model) args.push(`--model ${params.model}`);
      args.push(`--prompt "${params.prompt.replace(/"/g, '\\"')}"`);
      if (params.first_frame) args.push(`--first-frame ${params.first_frame}`);
      if (params.last_frame) args.push(`--last-frame ${params.last_frame}`);
      if (params.subject_image) args.push(`--subject-image ${params.subject_image}`);
      if (params.callback_url) args.push(`--callback-url ${params.callback_url}`);
      if (params.download) args.push(`--download ${params.download}`);
      if (params.no_wait) args.push("--no-wait");
      if (params.async) args.push("--async");
      if (params.poll_interval !== undefined) args.push(`--poll-interval ${params.poll_interval}`);

      const output = await runMmxCommand(args);
      return { content: [{ type: "text", text: output }] };
    },
  });

  pi.registerTool({
    name: "mmx_video_task_get",
    label: "MiniMax Video Task Get",
    description: "Query video task status",
    parameters: Type.Object({
      task_id: Type.String({ description: "Video generation task ID" }),
    }),
    async execute(_toolCallId, params) {
      const version = await getMmxVersion();
      if (version.warningMessage) {
        return {
          content: [{ type: "text", text: version.warningMessage }],
          details: { warning: true },
        };
      }

      const args: string[] = ["video task get", `--task-id ${params.task_id}`];
      const output = await runMmxCommand(args);
      return { content: [{ type: "text", text: output }] };
    },
  });

  pi.registerTool({
    name: "mmx_video_download",
    label: "MiniMax Video Download",
    description: "Download a completed video by file ID",
    parameters: Type.Object({
      file_id: Type.String({ description: "File ID to download" }),
      out: Type.String({ description: "Output file path" }),
    }),
    async execute(_toolCallId, params) {
      const version = await getMmxVersion();
      if (version.warningMessage) {
        return {
          content: [{ type: "text", text: version.warningMessage }],
          details: { warning: true },
        };
      }

      const args: string[] = ["video download", `--file-id ${params.file_id}`, `--out ${params.out}`];
      const output = await runMmxCommand(args);
      return { content: [{ type: "text", text: output }] };
    },
  });

  // Music tools
  pi.registerTool({
    name: "mmx_music_generate",
    label: "MiniMax Music Generate",
    description: "Generate a song (music-2.6 / music-2.6-free / music-2.5+ / music-2.5)",
    parameters: Type.Object({
      prompt: Type.Optional(Type.String({ description: "Music style description (max 2000 chars)" })),
      lyrics: Type.Optional(Type.String({ description: "Song lyrics with structure tags" })),
      lyrics_file: Type.Optional(Type.String({ description: "Read lyrics from file (use - for stdin)" })),
      lyrics_optimizer: Type.Optional(Type.Boolean({ description: "Auto-generate lyrics from prompt" })),
      instrumental: Type.Optional(Type.Boolean({ description: "Generate instrumental music (no vocals)" })),
      vocals: Type.Optional(Type.String({ description: "Vocal style (e.g. warm male baritone)" })),
      genre: Type.Optional(Type.String({ description: "Music genre (e.g. folk, pop, jazz)" })),
      mood: Type.Optional(Type.String({ description: "Mood or emotion (e.g. warm, melancholic)" })),
      instruments: Type.Optional(Type.String({ description: "Instruments to feature (e.g. acoustic guitar, piano)" })),
      tempo: Type.Optional(Type.String({ description: "Tempo description (e.g. fast, slow)" })),
      bpm: Type.Optional(Type.Number({ description: "Exact tempo in beats per minute" })),
      key: Type.Optional(Type.String({ description: "Musical key (e.g. C major, A minor)" })),
      avoid: Type.Optional(Type.String({ description: "Elements to avoid in the generated music" })),
      use_case: Type.Optional(Type.String({ description: "Use case context (e.g. background music for video)" })),
      structure: Type.Optional(Type.String({ description: "Song structure (e.g. verse-chorus-verse-bridge-chorus)" })),
      references: Type.Optional(Type.String({ description: "Reference tracks or artists" })),
      extra: Type.Optional(Type.String({ description: "Additional fine-grained requirements" })),
      model: Type.Optional(Type.String({ description: "Model: music-2.6, music-2.6-free, music-2.5+, or music-2.5" })),
      output_format: Type.Optional(Type.String({ description: "Return format: hex (default) or url" })),
      aigc_watermark: Type.Optional(Type.Boolean({ description: "Embed AI-generated content watermark" })),
      format: Type.Optional(Type.String({ description: "Audio format (default: mp3)" })),
      sample_rate: Type.Optional(Type.Number({ description: "Sample rate (default: 44100)" })),
      bitrate: Type.Optional(Type.Number({ description: "Bitrate (default: 256000)" })),
      stream: Type.Optional(Type.Boolean({ description: "Stream raw audio to stdout" })),
      out: Type.Optional(Type.String({ description: "Save audio to file" })),
    }),
    async execute(_toolCallId, params) {
      const version = await getMmxVersion();
      if (version.warningMessage) {
        return {
          content: [{ type: "text", text: version.warningMessage }],
          details: { warning: true },
        };
      }

      const args: string[] = ["music generate"];
      if (params.prompt) args.push(`--prompt "${params.prompt.replace(/"/g, '\\"')}"`);
      if (params.lyrics) args.push(`--lyrics "${params.lyrics.replace(/"/g, '\\"')}"`);
      if (params.lyrics_file) args.push(`--lyrics-file ${params.lyrics_file}`);
      if (params.lyrics_optimizer) args.push("--lyrics-optimizer");
      if (params.instrumental) args.push("--instrumental");
      if (params.vocals) args.push(`--vocals "${params.vocals.replace(/"/g, '\\"')}"`);
      if (params.genre) args.push(`--genre ${params.genre}`);
      if (params.mood) args.push(`--mood ${params.mood}`);
      if (params.instruments) args.push(`--instruments "${params.instruments.replace(/"/g, '\\"')}"`);
      if (params.tempo) args.push(`--tempo ${params.tempo}`);
      if (params.bpm !== undefined) args.push(`--bpm ${params.bpm}`);
      if (params.key) args.push(`--key ${params.key}`);
      if (params.avoid) args.push(`--avoid "${params.avoid.replace(/"/g, '\\"')}"`);
      if (params.use_case) args.push(`--use-case "${params.use_case.replace(/"/g, '\\"')}"`);
      if (params.structure) args.push(`--structure ${params.structure}`);
      if (params.references) args.push(`--references "${params.references.replace(/"/g, '\\"')}"`);
      if (params.extra) args.push(`--extra "${params.extra.replace(/"/g, '\\"')}"`);
      if (params.model) args.push(`--model ${params.model}`);
      if (params.output_format) args.push(`--output-format ${params.output_format}`);
      if (params.aigc_watermark) args.push("--aigc-watermark");
      if (params.format) args.push(`--format ${params.format}`);
      if (params.sample_rate !== undefined) args.push(`--sample-rate ${params.sample_rate}`);
      if (params.bitrate !== undefined) args.push(`--bitrate ${params.bitrate}`);
      if (params.stream) args.push("--stream");
      if (params.out) args.push(`--out ${params.out}`);

      const output = await runMmxCommand(args);
      return { content: [{ type: "text", text: output }] };
    },
  });

  pi.registerTool({
    name: "mmx_music_cover",
    label: "MiniMax Music Cover",
    description: "Generate a cover version of a song based on reference audio",
    parameters: Type.Object({
      model: Type.Optional(Type.String({ description: "Model: music-cover or music-cover-free" })),
      prompt: Type.String({ description: "Target cover style (e.g. Indie folk, acoustic guitar)" }),
      audio: Type.Optional(Type.String({ description: "URL of the reference audio" })),
      audio_file: Type.Optional(Type.String({ description: "Local reference audio file" })),
      lyrics: Type.Optional(Type.String({ description: "Cover lyrics" })),
      lyrics_file: Type.Optional(Type.String({ description: "Read lyrics from file (use - for stdin)" })),
      seed: Type.Optional(Type.Number({ description: "Random seed 0-1000000 for reproducible results" })),
      format: Type.Optional(Type.String({ description: "Audio format: mp3, wav, pcm (default: mp3)" })),
      sample_rate: Type.Optional(Type.Number({ description: "Sample rate (default: 44100)" })),
      bitrate: Type.Optional(Type.Number({ description: "Bitrate (default: 256000)" })),
      channel: Type.Optional(Type.Number({ description: "Channels: 1 (mono) or 2 (stereo, default)" })),
      stream: Type.Optional(Type.Boolean({ description: "Stream raw audio to stdout" })),
      out: Type.Optional(Type.String({ description: "Save audio to file" })),
    }),
    async execute(_toolCallId, params) {
      const version = await getMmxVersion();
      if (version.warningMessage) {
        return {
          content: [{ type: "text", text: version.warningMessage }],
          details: { warning: true },
        };
      }

      const args: string[] = ["music cover"];
      if (params.model) args.push(`--model ${params.model}`);
      args.push(`--prompt "${params.prompt.replace(/"/g, '\\"')}"`);
      if (params.audio) args.push(`--audio ${params.audio}`);
      if (params.audio_file) args.push(`--audio-file ${params.audio_file}`);
      if (params.lyrics) args.push(`--lyrics "${params.lyrics.replace(/"/g, '\\"')}"`);
      if (params.lyrics_file) args.push(`--lyrics-file ${params.lyrics_file}`);
      if (params.seed !== undefined) args.push(`--seed ${params.seed}`);
      if (params.format) args.push(`--format ${params.format}`);
      if (params.sample_rate !== undefined) args.push(`--sample-rate ${params.sample_rate}`);
      if (params.bitrate !== undefined) args.push(`--bitrate ${params.bitrate}`);
      if (params.channel !== undefined) args.push(`--channel ${params.channel}`);
      if (params.stream) args.push("--stream");
      if (params.out) args.push(`--out ${params.out}`);

      const output = await runMmxCommand(args);
      return { content: [{ type: "text", text: output }] };
    },
  });

  // Search tools
  pi.registerTool({
    name: "mmx_search_query",
    label: "MiniMax Search Query",
    description: "Search the web via MiniMax",
    parameters: Type.Object({
      q: Type.String({ description: "Search query string" }),
    }),
    async execute(_toolCallId, params) {
      const version = await getMmxVersion();
      if (version.warningMessage) {
        return {
          content: [{ type: "text", text: version.warningMessage }],
          details: { warning: true },
        };
      }

      const args: string[] = ["search query", `--q "${params.q.replace(/"/g, '\\"')}"`];
      const output = await runMmxCommand(args);
      return { content: [{ type: "text", text: output }] };
    },
  });

  pi.registerTool({
    name: "mmx_search_web",
    label: "MiniMax Search Web",
    description: "Search the web via MiniMax - alias for query",
    parameters: Type.Object({
      q: Type.String({ description: "Search query string" }),
    }),
    async execute(_toolCallId, params) {
      const version = await getMmxVersion();
      if (version.warningMessage) {
        return {
          content: [{ type: "text", text: version.warningMessage }],
          details: { warning: true },
        };
      }

      const args: string[] = ["search web", `--q "${params.q.replace(/"/g, '\\"')}"`];
      const output = await runMmxCommand(args);
      return { content: [{ type: "text", text: output }] };
    },
  });

  // Vision tools
  pi.registerTool({
    name: "mmx_vision_describe",
    label: "MiniMax Vision Describe",
    description: "Describe an image using MiniMax VLM",
    parameters: Type.Object({
      image: Type.Optional(Type.String({ description: "Local image path or URL" })),
      file_id: Type.Optional(Type.String({ description: "Pre-uploaded file ID" })),
      prompt: Type.Optional(Type.String({ description: "Question about the image (default: Describe the image.)" })),
    }),
    async execute(_toolCallId, params) {
      const version = await getMmxVersion();
      if (version.warningMessage) {
        return {
          content: [{ type: "text", text: version.warningMessage }],
          details: { warning: true },
        };
      }

      const args: string[] = ["vision describe"];
      if (params.image) args.push(`--image ${params.image}`);
      if (params.file_id) args.push(`--file-id ${params.file_id}`);
      if (params.prompt) args.push(`--prompt "${params.prompt.replace(/"/g, '\\"')}"`);

      const output = await runMmxCommand(args);
      return { content: [{ type: "text", text: output }] };
    },
  });

  // Quota tools
  pi.registerTool({
    name: "mmx_quota_show",
    label: "MiniMax Quota Show",
    description: "Display Token Plan usage and remaining quotas",
    parameters: Type.Object({}),
    async execute(_toolCallId, _params) {
      const version = await getMmxVersion();
      if (version.warningMessage) {
        return {
          content: [{ type: "text", text: version.warningMessage }],
          details: { warning: true },
        };
      }

      const output = await runMmxCommand(["quota show"]);
      return { content: [{ type: "text", text: output }] };
    },
  });

  // Config tools
  pi.registerTool({
    name: "mmx_config_show",
    label: "MiniMax Config Show",
    description: "Display current configuration",
    parameters: Type.Object({}),
    async execute(_toolCallId, _params) {
      const version = await getMmxVersion();
      if (version.warningMessage) {
        return {
          content: [{ type: "text", text: version.warningMessage }],
          details: { warning: true },
        };
      }

      const output = await runMmxCommand(["config show"]);
      return { content: [{ type: "text", text: output }] };
    },
  });

  pi.registerTool({
    name: "mmx_config_set",
    label: "MiniMax Config Set",
    description: "Set a config value",
    parameters: Type.Object({
      key: Type.String({ description: "Config key (region, base_url, output, timeout, api_key, default_text_model, default_speech_model, default_video_model, default_music_model)" }),
      value: Type.String({ description: "Value to set" }),
    }),
    async execute(_toolCallId, params) {
      const version = await getMmxVersion();
      if (version.warningMessage) {
        return {
          content: [{ type: "text", text: version.warningMessage }],
          details: { warning: true },
        };
      }

      const args: string[] = ["config set", `--key ${params.key}`, `--value ${params.value}`];
      const output = await runMmxCommand(args);
      return { content: [{ type: "text", text: output }] };
    },
  });

  pi.registerTool({
    name: "mmx_config_export_schema",
    label: "MiniMax Config Export Schema",
    description: "Export CLI command(s) as Anthropic/OpenAI-compatible JSON tool schemas",
    parameters: Type.Object({
      command: Type.Optional(Type.String({ description: "Export schema for a specific command (e.g. image generate)" })),
    }),
    async execute(_toolCallId, params) {
      const version = await getMmxVersion();
      if (version.warningMessage) {
        return {
          content: [{ type: "text", text: version.warningMessage }],
          details: { warning: true },
        };
      }

      const args: string[] = ["config export-schema"];
      if (params.command) args.push(`--command "${params.command.replace(/"/g, '\\"')}"`);

      const output = await runMmxCommand(args);
      return { content: [{ type: "text", text: output }] };
    },
  });

  // Update tool
  pi.registerTool({
    name: "mmx_update",
    label: "MiniMax Update",
    description: "Update mmx to a newer version",
    parameters: Type.Object({}),
    async execute(_toolCallId, _params) {
      const version = await getMmxVersion();
      if (version.warningMessage) {
        return {
          content: [{ type: "text", text: version.warningMessage }],
          details: { warning: true },
        };
      }

      const output = await runMmxCommand(["update"]);
      return { content: [{ type: "text", text: output }] };
    },
  });
}
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Type, StringEnum } from "@mariozechner/pi-ai";

// Supported mmx CLI version
const SUPPORTED_MMX_VERSION = "1.0.11";

/**
 * Get the current mmx CLI version
 */
async function getMmxVersion(): Promise<string | null> {
  try {
    const { exec } = await import("node:child_process");
    const { promisify } = await import("node:util");
    const execAsync = promisify(exec);
    const { stdout } = await execAsync("mmx -v", { timeout: 10000 });
    const match = stdout.match(/mmx\s+(\S+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

/**
 * Execute mmx command and return result
 */
async function execMmx(args: string[], signal?: AbortSignal): Promise<{ stdout: string; stderr: string; code: number }> {
  const { exec } = await import("node:child_process");
  const { promisify } = await import("node:util");
  const execAsync = promisify(exec);
  const cmd = `mmx ${args.join(" ")}`;
  try {
    const { stdout, stderr } = await execAsync(cmd, { 
      timeout: 300000,
      signal 
    });
    return { stdout, stderr, code: 0 };
  } catch (error: unknown) {
    const err = error as { stdout?: string; stderr?: string; code?: number };
    return {
      stdout: err.stdout || "",
      stderr: err.stderr || "",
      code: err.code || 1
    };
  }
}

/**
 * Check mmx version and return warning message if mismatch
 */
async function checkVersionAndGetWarning(pi: ExtensionAPI): Promise<string | null> {
  const currentVersion = await getMmxVersion();
  if (currentVersion && currentVersion !== SUPPORTED_MMX_VERSION) {
    return `⚠️ mmx CLI version mismatch detected! Found ${currentVersion}, expected ${SUPPORTED_MMX_VERSION}. Please run "/update-pi-minimax-cli" to rebuild the extension with the new version.`;
  }
  return null;
}

// Tool definitions
const mmxTools = [
  // Speech tools
  {
    name: "mmx_speech_synthesize",
    label: "Speech Synthesize",
    description: "Synchronous TTS, up to 10k chars (speech-2.8-hd / 2.6 / 02)",
    promptSnippet: "Generate speech from text using MiniMax TTS",
    parameters: Type.Object({
      text: Type.Optional(Type.String({ description: "Text to synthesize" })),
      textFile: Type.Optional(Type.String({ description: "Read text from file (use - for stdin)" })),
      model: Type.Optional(Type.String({ description: "Model ID (default: speech-2.8-hd)" })),
      voice: Type.Optional(Type.String({ description: "Voice ID (default: English_expressive_narrator)" })),
      speed: Type.Optional(Type.Number({ description: "Speech speed multiplier" })),
      volume: Type.Optional(Type.Number({ description: "Volume level" })),
      pitch: Type.Optional(Type.Number({ description: "Pitch adjustment" })),
      format: Type.Optional(Type.String({ description: "Audio format (default: mp3)" })),
      sampleRate: Type.Optional(Type.Number({ description: "Sample rate (default: 32000)" })),
      bitrate: Type.Optional(Type.Number({ description: "Bitrate (default: 128000)" })),
      channels: Type.Optional(Type.Number({ description: "Audio channels (default: 1)" })),
      language: Type.Optional(Type.String({ description: "Language boost" })),
      subtitles: Type.Optional(Type.Boolean({ description: "Include subtitle timing data" })),
      out: Type.Optional(Type.String({ description: "Save audio to file" })),
      stream: Type.Optional(Type.Boolean({ description: "Stream raw audio to stdout" })),
      quiet: Type.Optional(Type.Boolean({ description: "Suppress non-essential output" })),
      output: Type.Optional(StringEnum(["text", "json"] as const)),
    }),
  },
  {
    name: "mmx_speech_voices",
    label: "Speech Voices",
    description: "List available system voices",
    promptSnippet: "List available MiniMax TTS voices",
    parameters: Type.Object({
      language: Type.Optional(Type.String({ description: "Filter voices by language (e.g. english, korean, japanese)" })),
      quiet: Type.Optional(Type.Boolean({ description: "Suppress non-essential output" })),
      output: Type.Optional(StringEnum(["text", "json"] as const)),
    }),
  },
  {
    name: "mmx_speech_generate",
    label: "Speech Generate",
    description: "Synchronous TTS, up to 10k chars (speech-2.8-hd / 2.6 / 02)",
    promptSnippet: "Generate speech from text using MiniMax TTS",
    parameters: Type.Object({
      text: Type.Optional(Type.String({ description: "Text to synthesize" })),
      textFile: Type.Optional(Type.String({ description: "Read text from file (use - for stdin)" })),
      model: Type.Optional(Type.String({ description: "Model ID (default: speech-2.8-hd)" })),
      voice: Type.Optional(Type.String({ description: "Voice ID (default: English_expressive_narrator)" })),
      speed: Type.Optional(Type.Number({ description: "Speech speed multiplier" })),
      volume: Type.Optional(Type.Number({ description: "Volume level" })),
      pitch: Type.Optional(Type.Number({ description: "Pitch adjustment" })),
      format: Type.Optional(Type.String({ description: "Audio format (default: mp3)" })),
      sampleRate: Type.Optional(Type.Number({ description: "Sample rate (default: 32000)" })),
      bitrate: Type.Optional(Type.Number({ description: "Bitrate (default: 128000)" })),
      channels: Type.Optional(Type.Number({ description: "Audio channels (default: 1)" })),
      language: Type.Optional(Type.String({ description: "Language boost" })),
      subtitles: Type.Optional(Type.Boolean({ description: "Include subtitle timing data" })),
      out: Type.Optional(Type.String({ description: "Save audio to file" })),
      stream: Type.Optional(Type.Boolean({ description: "Stream raw audio to stdout" })),
      quiet: Type.Optional(Type.Boolean({ description: "Suppress non-essential output" })),
      output: Type.Optional(StringEnum(["text", "json"] as const)),
    }),
  },
  // Image tools
  {
    name: "mmx_image_generate",
    label: "Image Generate",
    description: "Generate images (image-01 / image-01-live)",
    promptSnippet: "Generate images from text prompts using MiniMax",
    parameters: Type.Object({
      prompt: Type.String({ description: "Image description" }),
      aspectRatio: Type.Optional(Type.String({ description: "Aspect ratio (e.g. 16:9, 1:1)" })),
      n: Type.Optional(Type.Number({ description: "Number of images to generate (default: 1)" })),
      seed: Type.Optional(Type.Number({ description: "Random seed for reproducible generation" })),
      width: Type.Optional(Type.Number({ description: "Custom width in pixels (512-2048, multiple of 8)" })),
      height: Type.Optional(Type.Number({ description: "Custom height in pixels (512-2048, multiple of 8)" })),
      promptOptimizer: Type.Optional(Type.Boolean({ description: "Automatically optimize the prompt" })),
      aigcWatermark: Type.Optional(Type.Boolean({ description: "Embed AI-generated content watermark" })),
      subjectRef: Type.Optional(Type.String({ description: "Subject reference (format: type=character,image=path-or-url)" })),
      outDir: Type.Optional(Type.String({ description: "Download images to directory" })),
      outPrefix: Type.Optional(Type.String({ description: "Filename prefix (default: image)" })),
      quiet: Type.Optional(Type.Boolean({ description: "Suppress non-essential output" })),
      output: Type.Optional(StringEnum(["text", "json"] as const)),
    }),
  },
  // Video tools
  {
    name: "mmx_video_generate",
    label: "Video Generate",
    description: "Generate a video (T2V: Hailuo-2.3 / 2.3-Fast / Hailuo-02 | I2V: I2V-01 / I2V-01-Director / I2V-01-live | S2V: S2V-01)",
    promptSnippet: "Generate videos from text or images using MiniMax",
    parameters: Type.Object({
      model: Type.Optional(Type.String({ description: "Model ID (default: MiniMax-Hailuo-2.3)" })),
      prompt: Type.String({ description: "Video description" }),
      firstFrame: Type.Optional(Type.String({ description: "First frame image (local path or URL)" })),
      lastFrame: Type.Optional(Type.String({ description: "Last frame image for SEF interpolation" })),
      subjectImage: Type.Optional(Type.String({ description: "Subject reference image for character consistency" })),
      callbackUrl: Type.Optional(Type.String({ description: "Webhook URL for completion notification" })),
      download: Type.Optional(Type.String({ description: "Save video to file on completion" })),
      noWait: Type.Optional(Type.Boolean({ description: "Return task ID immediately without waiting" })),
      async: Type.Optional(Type.Boolean({ description: "Return task ID immediately (agent/CI mode)" })),
      pollInterval: Type.Optional(Type.Number({ description: "Polling interval when waiting (default: 5)" })),
      quiet: Type.Optional(Type.Boolean({ description: "Suppress non-essential output" })),
      output: Type.Optional(StringEnum(["text", "json"] as const)),
    }),
  },
  {
    name: "mmx_video_task_get",
    label: "Video Task Get",
    description: "Query video task status",
    promptSnippet: "Check video generation task status",
    parameters: Type.Object({
      taskId: Type.String({ description: "Task ID to query" }),
      quiet: Type.Optional(Type.Boolean({ description: "Suppress non-essential output" })),
      output: Type.Optional(StringEnum(["text", "json"] as const)),
    }),
  },
  {
    name: "mmx_video_download",
    label: "Video Download",
    description: "Download a completed video by file ID",
    promptSnippet: "Download a completed MiniMax video",
    parameters: Type.Object({
      fileId: Type.String({ description: "File ID to download" }),
      out: Type.String({ description: "Output file path" }),
      quiet: Type.Optional(Type.Boolean({ description: "Suppress non-essential output" })),
      output: Type.Optional(StringEnum(["text", "json"] as const)),
    }),
  },
  // Music tools
  {
    name: "mmx_music_generate",
    label: "Music Generate",
    description: "Generate a song (music-2.6 / music-2.6-free / music-2.5+ / music-2.5)",
    promptSnippet: "Generate music from text or lyrics using MiniMax",
    parameters: Type.Object({
      prompt: Type.Optional(Type.String({ description: "Music style description" })),
      lyrics: Type.Optional(Type.String({ description: "Song lyrics with structure tags" })),
      lyricsFile: Type.Optional(Type.String({ description: "Read lyrics from file (use - for stdin)" })),
      lyricsOptimizer: Type.Optional(Type.Boolean({ description: "Auto-generate lyrics from prompt" })),
      instrumental: Type.Optional(Type.Boolean({ description: "Generate instrumental music" })),
      vocals: Type.Optional(Type.String({ description: "Vocal style (e.g. warm male baritone)" })),
      genre: Type.Optional(Type.String({ description: "Music genre" })),
      mood: Type.Optional(Type.String({ description: "Mood or emotion" })),
      instruments: Type.Optional(Type.String({ description: "Instruments to feature" })),
      tempo: Type.Optional(Type.String({ description: "Tempo description (fast, slow, moderate)" })),
      bpm: Type.Optional(Type.Number({ description: "Exact tempo in beats per minute" })),
      key: Type.Optional(Type.String({ description: "Musical key (e.g. C major, A minor)" })),
      avoid: Type.Optional(Type.String({ description: "Elements to avoid" })),
      useCase: Type.Optional(Type.String({ description: "Use case context" })),
      structure: Type.Optional(Type.String({ description: "Song structure" })),
      references: Type.Optional(Type.String({ description: "Reference tracks or artists" })),
      extra: Type.Optional(Type.String({ description: "Additional fine-grained requirements" })),
      model: Type.Optional(Type.String({ description: "Model (music-2.6, music-2.6-free, music-2.5+, music-2.5)" })),
      outputFormat: Type.Optional(StringEnum(["hex", "url"] as const)),
      aigcWatermark: Type.Optional(Type.Boolean({ description: "Embed AI-generated content watermark" })),
      format: Type.Optional(Type.String({ description: "Audio format (default: mp3)" })),
      sampleRate: Type.Optional(Type.Number({ description: "Sample rate (default: 44100)" })),
      bitrate: Type.Optional(Type.Number({ description: "Bitrate (default: 256000)" })),
      stream: Type.Optional(Type.Boolean({ description: "Stream raw audio to stdout" })),
      out: Type.Optional(Type.String({ description: "Save audio to file" })),
      quiet: Type.Optional(Type.Boolean({ description: "Suppress non-essential output" })),
      output: Type.Optional(StringEnum(["text", "json"] as const)),
    }),
  },
  {
    name: "mmx_music_cover",
    label: "Music Cover",
    description: "Generate a cover version of a song based on reference audio (music-cover / music-cover-free)",
    promptSnippet: "Generate a cover version of a song using MiniMax",
    parameters: Type.Object({
      model: Type.Optional(Type.String({ description: "Model (music-cover, music-cover-free)" })),
      prompt: Type.Optional(Type.String({ description: "Target cover style" })),
      audio: Type.Optional(Type.String({ description: "URL of the reference audio" })),
      audioFile: Type.Optional(Type.String({ description: "Local reference audio file" })),
      lyrics: Type.Optional(Type.String({ description: "Cover lyrics" })),
      lyricsFile: Type.Optional(Type.String({ description: "Read lyrics from file" })),
      seed: Type.Optional(Type.Number({ description: "Random seed 0-1000000" })),
      format: Type.Optional(Type.String({ description: "Audio format (default: mp3)" })),
      sampleRate: Type.Optional(Type.Number({ description: "Sample rate (default: 44100)" })),
      bitrate: Type.Optional(Type.Number({ description: "Bitrate (default: 256000)" })),
      channel: Type.Optional(Type.Number({ description: "Channels: 1 (mono) or 2 (stereo)" })),
      stream: Type.Optional(Type.Boolean({ description: "Stream raw audio to stdout" })),
      out: Type.Optional(Type.String({ description: "Save audio to file" })),
      quiet: Type.Optional(Type.Boolean({ description: "Suppress non-essential output" })),
      output: Type.Optional(StringEnum(["text", "json"] as const)),
    }),
  },
  // Search tools
  {
    name: "mmx_search_query",
    label: "Search Query",
    description: "Search the web via MiniMax",
    promptSnippet: "Search the web using MiniMax search",
    parameters: Type.Object({
      q: Type.String({ description: "Search query string" }),
      quiet: Type.Optional(Type.Boolean({ description: "Suppress non-essential output" })),
      output: Type.Optional(StringEnum(["text", "json"] as const)),
    }),
  },
  // Vision tools
  {
    name: "mmx_vision_describe",
    label: "Vision Describe",
    description: "Describe an image using MiniMax VLM",
    promptSnippet: "Describe or analyze images using MiniMax vision",
    parameters: Type.Object({
      image: Type.Optional(Type.String({ description: "Local image path or URL" })),
      fileId: Type.Optional(Type.String({ description: "Pre-uploaded file ID" })),
      prompt: Type.Optional(Type.String({ description: "Question about the image" })),
      quiet: Type.Optional(Type.Boolean({ description: "Suppress non-essential output" })),
      output: Type.Optional(StringEnum(["text", "json"] as const)),
    }),
  },
  // Quota tools
  {
    name: "mmx_quota_show",
    label: "Quota Show",
    description: "Display Token Plan usage and remaining quotas",
    promptSnippet: "Show MiniMax Token Plan usage and quotas",
    parameters: Type.Object({
      quiet: Type.Optional(Type.Boolean({ description: "Suppress non-essential output" })),
      output: Type.Optional(StringEnum(["text", "json"] as const)),
    }),
  },
];

// Command mapping for each tool
const toolCommandMap: Record<string, string[]> = {
  mmx_speech_synthesize: ["speech", "synthesize"],
  mmx_speech_voices: ["speech", "voices"],
  mmx_speech_generate: ["speech", "generate"],
  mmx_image_generate: ["image", "generate"],
  mmx_video_generate: ["video", "generate"],
  mmx_video_task_get: ["video", "task", "get"],
  mmx_video_download: ["video", "download"],
  mmx_music_generate: ["music", "generate"],
  mmx_music_cover: ["music", "cover"],
  mmx_search_query: ["search", "query"],
  mmx_vision_describe: ["vision", "describe"],
  mmx_quota_show: ["quota", "show"],
};

export default async function (pi: ExtensionAPI) {
  // Register update command
  pi.registerCommand("update-pi-minimax-cli", {
    description: "Rebuild the pi-minimax-cli extension when mmx CLI version changes",
    handler: async (_args, ctx) => {
      ctx.ui.notify("Please use '/reload' after updating - the extension will auto-rebuild on first use", "info");
      ctx.ui.setStatus("pi-minimax-cli", "Waiting for reload...");
    },
  });

  // Register each mmx tool
  for (const tool of mmxTools) {
    const commandParts = toolCommandMap[tool.name];

    pi.registerTool({
      name: tool.name,
      label: tool.label,
      description: tool.description,
      promptSnippet: tool.promptSnippet,
      parameters: tool.parameters,
      async execute(_toolCallId, params, signal, onUpdate, ctx) {
        // Check version and get warning if mismatch
        const versionWarning = await checkVersionAndGetWarning(pi);

        // Build mmx command arguments
        const args: string[] = [...commandParts];

        // Global flags
        if (params.output) {
          args.push("--output", params.output);
        }
        if (params.quiet) {
          args.push("--quiet");
        }

        // Remove global flags from params
        const { output, quiet, ...toolParams } = params as Record<string, unknown>;

        // Build tool-specific arguments
        for (const [key, value] of Object.entries(toolParams)) {
          if (value === undefined || value === null) continue;

          // Convert camelCase to kebab-case
          const flagKey = key.replace(/([A-Z])/g, "-$1").toLowerCase();

          if (typeof value === "boolean") {
            if (value) {
              // Handle boolean flags - use the correct mmx flag format
              if (key === "promptOptimizer") {
                args.push("--prompt-optimizer");
              } else if (key === "aigcWatermark") {
                args.push("--aigc-watermark");
              } else if (key === "subtitles") {
                args.push("--subtitles");
              } else if (key === "stream") {
                args.push("--stream");
              } else if (key === "instrumental") {
                args.push("--instrumental");
              } else if (key === "lyricsOptimizer") {
                args.push("--lyrics-optimizer");
              } else if (key === "noWait") {
                args.push("--no-wait");
              } else {
                args.push(`--${flagKey}`);
              }
            }
          } else if (typeof value === "number") {
            args.push(`--${flagKey}`, String(value));
          } else if (typeof value === "string") {
            args.push(`--${flagKey}`, value);
          }
        }

        // Stream progress
        onUpdate?.({ content: [{ type: "text", text: `Running: mmx ${args.join(" ")}` }] });

        // Execute mmx command
        const result = await execMmx(args, signal);

        // Build output
        let outputText = "";
        if (result.stdout) {
          outputText += result.stdout;
        }
        if (result.stderr && result.code !== 0) {
          outputText += (outputText ? "\n" : "") + `Error: ${result.stderr}`;
        }

        if (result.code !== 0 && !outputText) {
          outputText = `Command failed with exit code ${result.code}`;
        }

        // Inject version warning as a message
        if (versionWarning) {
          pi.sendMessage({
            customType: "pi-minimax-cli-warning",
            content: versionWarning,
            display: true,
          }, { deliverAs: "steer" });
        }

        return {
          content: [{ type: "text", text: outputText || "Command completed" }],
          details: { exitCode: result.code },
        };
      },
    });
  }
}

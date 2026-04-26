# pi-minimax-cli

A [pi](https://pi.dev/) extension that integrates MiniMax's `mmx` CLI as callable tools.

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

## Links

- [MiniMax Platform](https://platform.minimax.io)
- [mmx CLI Docs](https://platform.minimax.io/docs/token-plan/minimax-cli)
- [pi coding agent](https://pi.dev/)

Build the `pi-minimax-cli` extension.

## CRITICAL Guardrails

1. Always follow all the steps in order.
2. Do not create or modify any other file except `extensions/pi-minimax-cli.ts` file.
3. Do not install any packages on your own.

## How to create extension.

1. Check if `mmx` cli exists. if not ask user to install and login by following minimax guide and exit. Here is the resource link https://platform.minimax.io/docs/token-plan/minimax-cli.
2. Run `mmx -h`. Recursively scrap all the commands and options.
3. Read the current `pi-minimax-cli` extension code for reference.
   1. Check if `pi-minimax-cli` is installed as a pi package (via pi packages list)
   2. If installed as package, read the package source for reference.
   3. Otherwise, check if `./extensions/pi-minimax-cli.ts` exists and read it.
   4. If neither exists, proceed to next step.
4. If not found build from scratch
5. Delete `pi-minimax-cli.ts` file inside `extensions/` if exists.
6. Create new file with same name as `pi-minimax-cli.ts` inside `extensions/`.
7. Create a new extension by following pi coding agent extension guidelines. Register all the commands as tools except 'text' since pi agent is already doing that.
8. Store the `mmx` cli version in `SUPPORTED_MMX_VERSION` constant.
9. Ask the user to reload pi session with `/reload` at the end.

## How the extension should work

1. Every time the `pi-minimax-cli` extension is used, it should get the current mmx version by `mmx -v` and check if it matches version.
2. If yes, just continue the tool.
3. If no, It should:
   1. Run `mmx -h`. scrap all the commands and options.
   2. Complete users task by directly using the updated cli.
   3. Inject a prompt in the context to warn user that new mmx cli version has been found and ask user to allow pi agent to update the `pi-minimax-cli` extension.

## Success criteria

The extension build passes if,

1. The extension compliances with pi agent extension guidelines.
2. It works.

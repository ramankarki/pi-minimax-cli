Build the `pi-minimax-cli` extension.

## CRITICAL Guardrails

1. Strictly follow the steps below in order.
2. Do not create or modify any other file except `extensions/pi-minimax-cli.ts` file.
3. Do not install any packages on your own.

## How to create extension.

1. Check if `mmx` cli exists. if not ask user to install and login by following minimax guide and exit. Here is the resource link https://platform.minimax.io/docs/token-plan/minimax-cli.
2. Run `mmx -h`. Recursively scrap all the commands and options. Ignore these commands:
   1. text
   2. auth
   3. update
   4. config
3. Read the current `pi-minimax-cli` extension code for reference.
   1. Check if `./extensions/pi-minimax-cli.ts` exists, if yes read it.
   2. Check if `pi-minimax-cli` is installed as a pi package (via pi packages list).
   3. If installed as package, read the package source for reference.
   4. If neither exists, proceed to next step.
4. Check the current version with `mmx -v`.
5. If not found or the existing extension version `SUPPORTED_MMX_VERSION` is different from the current version, build from scratch.
6. Delete `pi-minimax-cli.ts` file inside `extensions/` if exists.
7. Create new file with same name as `pi-minimax-cli.ts` inside `extensions/`.
8. Create a new extension by following pi coding agent extension guidelines. Register the commands that you read earlier as tools.
9. Store the `mmx` cli version in `SUPPORTED_MMX_VERSION` constant.
10. Ask the user to reload pi session with `/reload` at the end.

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

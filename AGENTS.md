# What is this

A pi coding agent extension that wraps the MiniMax `mmx` CLI as callable tools.

## How it works

It contains a prompt template and a skill. The prompt template contains all the instruction to build the extension from scratch. The skill just calls the prompt template when user allows pi agent to build or rebuild the extension if `mmx` found with new version which creates a self evolving architecture.

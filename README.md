# CodeGPT (CURRENTLY NOT WORKING)

Update (Dec 14): OpenAI made the unofficial API for ChatGPT harder to access and I need to upgrade the the NPM module this extension uses to bypass the latest protections. Should be fixed by Dec 16. Check back then. - Abi

This is very much an alpha. The error handling needs to be significantly improved.

An extension that allows you to use ChatGPT right within VSCode.

The goal is to make interaction with the AI seamless via deep integration with VS Code.

**Install via the [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=AbiRaja.codegpt)**.

## Demo

Here, we code the popular game, [Wordle](https://www.nytimes.com/games/wordle/index.html), in 2 minutes.

https://user-images.githubusercontent.com/23818/206836012-d394570a-854a-4fec-9e08-9f406a96451e.mp4

## Setup

The first time you try to ask ChatGPT a question, you'll be asked for your session token.

Here's how you get the session token:

1. Go to [ChatGPT](https://chat.openai.com/chat) and log in or sign up.
1. Open Dev Tools (Cmd + Opt + C on Mac/Chrome).
1. Go to Application > Cookies
1. Copy the value for \_\_Secure-next-auth.session-token

![](demos/session-token.png)

Periodically, the token might expire and you will be prompted for a new session token.

You can also modify this session token at any time by editing `chatgpt.token` in settings.

## Features

- Streaming, fast responses from ChatGPT
- Send generated code directly to text or terminal buffers
- Comes with useful prompt presets:
  - Explain code
  - Diagnose error message
- Feed your current selection or active tab into the prompt

### Planned (please submit PRs)

- Support for large responses that span multiple messages (using the "continue" prompt trick)
- Workspace detection (tell GPT that you use Yarn, Tailwind, etc. so it generates the most relevant code snippets)
- Full history
- Refactor code and see diff

## How it works

Forked from [chatgpt-vscode](https://github.com/mpociot/chatgpt-vscode).

We use the unofficial API endpoints that power the ChatGPT website. Thanks to Travis Fischer for the [ChatGPT package](https://github.com/transitive-bullshit/chatgpt-api).

While this approach is more robust than earlier UI automation approaches, the endpoints are subject to change as well as rate limits. They might break at any point.

## License

MIT

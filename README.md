# ChatGPT for VSCode (ALPHA)

This is very much an alpha. The error handling needs to be significantly improved.

VSCode extension that allows you to use ChatGPT right within VSCode. The goal is to make the interaction with the AI seamless and boost your programming productivity significantly.

## Demo

Here, we code a Discord bot iteratively mostly using ChatGPT.

## Features

- Send generated code directly to text or terminal buffers
- Comes with useful prompt presets:
  - Explain code
  - Diagnose error message
  - Identify bugs
- Feed your current selection or active tab into the prompt

### Planned (please submit PRs)

- Support for large responses that span multiple messages (using the "continue" prompt trick)
- Workspace detection (tell GPT that you use Yarn, Tailwind, etc. so it generates the most relevant code snippets)
- Full history

## Configuration

Copy your access token from your ChatGPT browser tab like so:

1. Go to https://chat.openai.com/chat and log in or sign up.
1. Open browser Dev Tools (cmd + opt + c on Mac/Chrome).
1. Open Application > Cookies.
1. Copy the value for \_\_Secure-next-auth.session-token
1. \*\*Open VSCode settings
1. Search for ChatGPT token and paste it in there

[session-token.png]

## How it works

We use the unofficial API endpoints that power the ChatGPT website. Thanks to transitive bullshit for the [ChatGPT package](https://github.com/transitive-bullshit/chatgpt-api).

While this approach is more robust than earlier UI automation approaches, the endpoints are subject to change as well as rate limits. They might break at any point.

## License

MIT

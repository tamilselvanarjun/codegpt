# ChatGPT for VSCode (ALPHA)

This is very much an alpha. The error handling needs to be significantly improved.

VSCode extension that allows you to use ChatGPT right within VSCode. The goal is to make the interaction with the AI seamless and boost your programming productivity significantly.

Forked from [chatgpt-vscode](https://github.com/mpociot/chatgpt-vscode). Watch [his great demo here](https://twitter.com/marcelpociot/status/1599180144551526400).

## Demo

Here, we code a Discord bot iteratively mostly using ChatGPT.

## Features

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

## Configuration

Add your access token from your ChatGPT browser tab like so:

1. Go to [ChatGPT](https://chat.openai.com/chat) and log in or sign up.
1. Open browser Dev Tools (cmd + opt + c on Mac/Chrome).
1. Open Application > Cookies.
1. Copy the value for \_\_Secure-next-auth.session-token
1. In VS Code, Cmd+Shift+P and search for "Preferences: Open User Settings (JSON)"
1. Add the chatGPT token by adding a new top-level propertly: `"chatgpt": {"token": "TOKEN GOES HERE"}"`

![](demos/session-token.png)

## How it works

We use the unofficial API endpoints that power the ChatGPT website. Thanks to Travis Fischer for the [ChatGPT package](https://github.com/transitive-bullshit/chatgpt-api).

While this approach is more robust than earlier UI automation approaches, the endpoints are subject to change as well as rate limits. They might break at any point.

## License

MIT

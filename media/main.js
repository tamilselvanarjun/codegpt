// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.
(function () {
  const vscode = acquireVsCodeApi();

  let response = "";

  // Handle messages sent from the extension to the webview
  window.addEventListener("message", (event) => {
    const message = event.data;
    switch (message.type) {
      case "addResponse": {
        response = message.value;
        setResponse();
        break;
      }
      case "clearResponse": {
        response = "";
        break;
      }
      case "setLoading": {
        isLoading = message.value;
        document.getElementById("response").classList.remove("hidden");
        if (isLoading) {
          // DEBUG
          document.getElementById("response-text").innerHTML = "";
          document.getElementById("loading-spinner").classList.remove("hidden");
          document.getElementById("loading-spinner").classList.add("flex");
        } else {
          document.getElementById("loading-spinner").classList.add("hidden");
          document.getElementById("loading-spinner").classList.remove("flex");
        }
      }
      case "updateSelection": {
        document.getElementById("selection").innerHTML = message.value;
      }
    }
  });

  function getCurrentPrompt() {
    return document.getElementById("prompt-input").value.trim();
  }

  function setResponse() {
    var converter = new showdown.Converter();
    document.getElementById("response-text").innerHTML = converter.makeHtml(response);

    // DEBUG
    // html = converter.makeHtml(
    //   `Sure, here's a simple Discord bot written in Python using the \`discord.py\` library:` +
    //     "\n```\n" +
    //     `
    // import discord

    // client = discord.Client()

    // @client.event
    // async def on_message(message):
    //     if message.author == client.user:
    //         return

    //     if message.content.startswith('!hello'):
    //         await message.channel.send('Hello!')

    // client.run('your-bot-token-here')` +
    //     "\n```\n\n" +
    //     `

    // To use this bot, you'll need to create a new bot on the Discord developer portal and obtain a bot token. Then, replace \`'your-bot-token-here'\` with your bot's token and run the script.

    // The bot will respond to any message that starts with \`!hello\` by sending the message \`Hello!\` back to the channel. You can customize the bot's behavior by modifying the \`on_message()\` event handler.

    // I hope this helps! Let me know if you have any other questions.`
    // );

    var preCodeBlocks = document.querySelectorAll("pre code");
    for (var i = 0; i < preCodeBlocks.length; i++) {
      $(preCodeBlocks[i]).parent().addClass("pt-2 rounded-sm");
      $(preCodeBlocks[i]).addClass("p-1 block w-full rounded-sm font-mono");

      const codeContents = $(preCodeBlocks[i]).text();

      // Top bar
      const insertBtn = $(
        `<button class="hover:cursor-pointer flex items-center gap-x-[3px]">
          <i data-feather="plus-square" class="w-3 h-3"></i>insert</button>`
      );
      insertBtn.click(function (e) {
        e.preventDefault();
        vscode.postMessage({
          type: "codeSelected",
          value: codeContents,
        });
      });

      const terminalBtn = $(
        '<button class="hover:cursor-pointer flex items-center gap-x-[3px]"><i data-feather="play" class="w-3 h-3"></i>execute in terminal</button>      '
      );
      terminalBtn.click(function (e) {
        e.preventDefault();
        vscode.postMessage({
          type: "feedTerminal",
          value: codeContents,
        });
      });

      const copyBtn = $(
        '<button class="hover:cursor-pointer flex items-center gap-x-[3px]"><i data-feather="clipboard" class="w-3 h-3"></i>copy</button>'
      );
      copyBtn.click(function (e) {
        e.preventDefault();
        vscode.postMessage({
          type: "copy",
          value: codeContents,
        });
      });

      $(preCodeBlocks[i])
        .parent()
        .prepend(
          $(
            `<div class='flex items-center justify-end font-sans gap-x-3 px-2 py-1 text-[0.7em] text-gray-400 bg-gray-800'></div>`
          )
            .append(insertBtn)
            .append(terminalBtn)
            .append(copyBtn)
        );
    }

    // Highlight things
    hljs.highlightAll();

    // Set up all feather icons
    feather.replace();

    // just <code> is inline
    var codeBlocks = document.querySelectorAll("code");
    for (var i = 0; i < codeBlocks.length; i++) {
      // Remove copy code
      if (codeBlocks[i].innerText.startsWith("Copy code")) {
        codeBlocks[i].innerText = codeBlocks[i].innerText.replace("Copy code", "");
      }

      codeBlocks[i].classList.add(
        "p-1",
        "inline-flex",
        "max-w-full",
        "overflow-hidden",
        "text-xs",
        "cursor-pointer"
      );

      codeBlocks[i].addEventListener("click", function (e) {
        e.preventDefault();
        vscode.postMessage({
          type: "codeSelected",
          value: this.innerText,
        });
      });
    }
  }

  document.getElementById("prompt-input").addEventListener("keypress", function (e) {
    if (e.keyCode === 13 && !e.shiftKey) {
      const value = getCurrentPrompt();
      vscode.postMessage({
        type: "prompt",
        value: value,
      });
      e.preventDefault();
    }
  });
  document.getElementById("submit-btn").addEventListener("click", function () {
    const value = getCurrentPrompt();
    vscode.postMessage({
      type: "prompt",
      value: value,
    });
    // DEBUG
    // setResponse();
  });

  const elementIds = ["explain-code-btn", "explain-error-btn", "fix-bugs-btn"];
  const prompts = [
    "Explain this code:",
    "I am getting this error: ",
    "Fix bugs in this code. Don't suggest any other code quality improvements. If there are no bugs, then say there are no bugs.",
  ];

  for (const id of elementIds) {
    document.getElementById(id).addEventListener("click", function () {
      const value = getCurrentPrompt();
      vscode.postMessage({
        type: "prompt",
        value: value,
        presetPrompt: prompts[elementIds.indexOf(id)],
      });
    });
  }
})();

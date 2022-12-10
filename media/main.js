// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.
(function () {
  const vscode = acquireVsCodeApi();

  function hasUnclosedBlockCodeTag(str) {
    const count = str.match(/```/g)?.length ?? 0;
    // If the number of backtick blocks is odd, there's an unclosed code tag
    return count % 2 === 1;
  }

  // Handle messages sent from the extension to the webview
  window.addEventListener("message", (event) => {
    const message = event.data;
    switch (message.type) {
      case "addResponse": {
        setResponse(message.value);
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

  function setResponse(response) {
    var converter = new showdown.Converter();
    // Close unclosed code tags if needed
    document.getElementById("response-text").innerHTML = converter.makeHtml(
      hasUnclosedBlockCodeTag(response ?? "") ? response + "\n```" : response
    );

    var preCodeBlocks = document.querySelectorAll("pre code");
    for (var i = 0; i < preCodeBlocks.length; i++) {
      $(preCodeBlocks[i]).parent().addClass("pt-2 rounded-sm my-2");
      $(preCodeBlocks[i]).addClass("p-1 block w-full rounded-sm font-mono");

      const codeContents = $(preCodeBlocks[i]).text();

      // Top bar
      const insertBtn = $(
        `<button class="hover:cursor-pointer flex items-center">
          <i data-feather="plus" class="w-3 h-3 mr-1"></i>insert</button>`
      );
      insertBtn.click(function (e) {
        e.preventDefault();
        vscode.postMessage({
          type: "codeSelected",
          value: codeContents,
        });
      });

      const terminalBtn = $(
        `<button class="hover:cursor-pointer flex items-center">
          <i data-feather="play" class="w-3 h-3 mr-[2px]"></i>execute in terminal</button>`
      );
      terminalBtn.click(function (e) {
        e.preventDefault();
        vscode.postMessage({
          type: "feedTerminal",
          value: codeContents,
        });
      });

      const copyBtn = $(
        `<button class="hover:cursor-pointer flex items-center">
          <i data-feather="clipboard" class="w-3 h-3 mr-[2px]"></i>copy</button>`
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
            `<div class='flex items-center justify-end font-sans gap-x-3 px-2 py-1 text-[0.85em] text-gray-400 bg-gray-800'></div>`
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
        "!whitespace-pre-wrap",
        "inline-flex",
        "max-w-full",
        "overflow-hidden",
        "text-xs",
        "cursor-pointer"
      );
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

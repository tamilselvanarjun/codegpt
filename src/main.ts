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
    html = converter.makeHtml(response);
    document.getElementById("response-text").innerHTML =
      "<div>someting <pre><code>document.innerHTML</code></pre> <code>test()</code> long and winding here</div>";

    // pre code is a block
    var preCodeBlocks = document.querySelectorAll("pre code");
    for (var i = 0; i < preCodeBlocks.length; i++) {
      preCodeBlocks[i].classList.add(
        "p-1",
        "my-2",
        "block",
        "w-full",
        "rounded-sm",
        "border",
        "border-sky-900",
        "font-mono"
      );

      $(preCodeBlocks[i]).appendChild(
        $(
          ```<div class='flex justify-end'>
            <button>copy</button>
            <button>insert</button>
            <button>execute in terminal</button>
          </div>```
        )
      );
    }

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
    setResponse();
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

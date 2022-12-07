import * as vscode from "vscode";
import { ChatGPTAPI, ChatGPTConversation } from "chatgpt";
import sidebarHTML from "./sidebar.html";

// Test this
// undefined > undefined
// "" > undefined
// "a" > "a"
function undefinedIfEmpty(str: string | undefined) {
  return (str ?? "").length > 0 ? str : undefined;
}

function createPrompt(
  userInput?: string,
  preset?: string,
  currentSelection?: string,
  currentBuffer?: string
): string {
  if (preset) {
    return preset + "\n" + (userInput ?? currentSelection ?? currentBuffer ?? "");
  }
  // If preset is not set, return selection + userInput or just user input if no selection
  else {
    // (textarea can be empty - like for an error message)
    if (currentSelection) {
      return `${currentSelection}

    ${userInput}`;
    } else {
      // We don't allow current file because otherwise, there would be no way to do just
      // do prompts directly like "Generate a discord bot that tells funny jokes"
      // TODO: Check out OG demo to see what they do
      return userInput ?? "";
    }
  }
  return "";
}

function runTests() {
  // console.log("start tests....");
  // const presetNoInputActual = createPrompt(undefined, "explain this code: ", "main()");
  // const presetNoInputExpect = "explain this code: \nmain()";
  // console.log("actual", presetNoInputActual, "expected", presetNoInputExpect);
  // console.log(presetNoInputActual === presetNoInputExpect);
  // const presetNoInputNoSelectionActual = createPrompt(undefined, "explain this code: ");
  // const presetNoInputNoSelection = "explain this code: \n";
  // console.log("actual", presetNoInputNoSelectionActual, "expected", presetNoInputNoSelection);
  // console.log(presetNoInputNoSelectionActual === presetNoInputNoSelection);
  // prompt = "Explain this code:", currentBuffer = "long file"
  // output = "Explain this code: long file"
  // userInput = "how do you create a new class in Javascript"?
  // output = same
  // userInput = "change const to let", selection = "const a = 5;"
  // output = "const a = 5;\nchange const to let"
}

// Command palette
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  const provider = new ChatGPTViewProvider(context.extensionUri);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(ChatGPTViewProvider.viewType, provider)
  );

  let disposable2 = vscode.commands.registerCommand("chatgpt.ask", () => {
    vscode.window.showInputBox({ prompt: "What do you want to do?" }).then((value) => {
      provider.search(value ?? "");
    });
  });
  context.subscriptions.push(disposable2);
}

class ChatGPTViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "chatgpt.chatView";

  private _view?: vscode.WebviewView;

  /**
   * You can set this to "true" once you have authenticated within the headless chrome.
   */
  private _chatGPTAPI: ChatGPTAPI | null = null;

  private conversation: ChatGPTConversation | null = null;

  constructor(private readonly _extensionUri: vscode.Uri) {
    runTests();
  }

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    if (!this._chatGPTAPI) {
      try {
        this._chatGPTAPI = new ChatGPTAPI({
          sessionToken: vscode.workspace.getConfiguration("chatgpt").get("token") ?? "", // SESSION_TOKEN, // process.env.SESSION_TOKEN || "",
        });
      } catch (e) {
        console.log(e);
      }
    }

    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    };

    const scriptUri = webviewView.webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "main.js")
    );
    webviewView.webview.html = sidebarHTML
      .replace("${mainScriptUri}", scriptUri.toString())
      .replace(
        "${jqueryScriptUri}",
        webviewView.webview
          .asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "media", "jquery.min.js"))
          .toString()
      )
      .replace(
        "${showdownUri}",
        webviewView.webview
          .asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "media", "showdown.min.js"))
          .toString()
      )
      .replace(
        "${tailwindUri}",
        webviewView.webview
          .asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "media", "tailwind.min.js"))
          .toString()
      );

    webviewView.webview.onDidReceiveMessage((data) => {
      if (data.type === "codeSelected") {
        let code = data.value;
        code = code.replace(/([^\\])(\$)([^{0-9])/g, "$1\\$$$3");
        vscode.window.activeTextEditor?.insertSnippet(new vscode.SnippetString(code));
      } else if (data.type === "feedTerminal") {
        // Send text to the active terminal
        const terminal = vscode.window.activeTerminal;
        if (terminal) {
          terminal.sendText(data.value);
        }
      } else if (data.type === "copy") {
        vscode.env.clipboard.writeText(data.value);
      } else if (data.type === "prompt") {
        this.search(data.value ?? "", data.presetPrompt ?? "");
      }
    });

    // Listen to current selection and send it to main.js
    vscode.window.onDidChangeTextEditorSelection((event) => {
      const selection = event.selections[0];
      const selectionText = vscode.window.activeTextEditor?.document.getText(selection);
      webviewView.webview.postMessage({
        type: "updateSelection",
        value: selectionText,
      });
    });
  }

  public async search(userInput: string, preset?: string) {
    this._view?.webview.postMessage({
      type: "setLoading",
      value: true,
    });

    const activeEditor = vscode.window.activeTextEditor;
    const languageId = activeEditor?.document.languageId;
    const currentSelection = activeEditor?.document.getText(activeEditor?.selection);
    const currentBuffer = activeEditor?.document.getText();

    const prompt = createPrompt(
      undefinedIfEmpty(userInput),
      undefinedIfEmpty(preset),
      undefinedIfEmpty(currentSelection),
      currentBuffer && currentBuffer.length > 0
        ? `This is the ${languageId} file I'm working on:\n${currentBuffer}`
        : undefined
    );

    console.log("Prompt: ", prompt);

    try {
      await this._chatGPTAPI?.ensureAuth();

      // Start a convo if it doesn't exist
      if (!this.conversation) {
        this.conversation = this._chatGPTAPI?.getConversation() ?? null;
      }

      const gptResponse = await this.conversation?.sendMessage(prompt);
      if (this._view) {
        this._view.show?.(true);
        this._view?.webview.postMessage({
          type: "setLoading",
          value: false,
        });
        this._view.webview.postMessage({ type: "addResponse", value: gptResponse });
      }
      console.log("Response: ", gptResponse);
    } catch (e: any) {
      this._view?.webview.postMessage({
        type: "setLoading",
        value: false,
      });
      await vscode.window.showErrorMessage("Error sending request to ChatGPT", e?.message);
      console.error(e);
    }
  }
}

// This method is called when your extension is deactivated
export function deactivate() {}

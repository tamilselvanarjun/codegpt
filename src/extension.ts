import * as vscode from "vscode";
import { ChatGPTAPI } from "chatgpt";
import sidebarHTML from "./sidebar.html";

// const IS_HEADLESS = true;
const IS_HEADLESS = false;

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
  private _chatGPTAPI = new ChatGPTAPI({
    sessionToken: SESSION_TOKEN, // process.env.SESSION_TOKEN || "",
  });

  constructor(private readonly _extensionUri: vscode.Uri) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    };

    const scriptUri = webviewView.webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "main.js")
    );

    webviewView.webview.html = sidebarHTML.replace("${scriptUri}", scriptUri.toString());

    webviewView.webview.onDidReceiveMessage((data) => {
      if (data.type === "codeSelected") {
        let code = data.value;
        code = code.replace(/([^\\])(\$)([^{0-9])/g, "$1\\$$$3");

        vscode.window.activeTextEditor?.insertSnippet(new vscode.SnippetString(code));
      } else if (data.type === "sendToTerminal") {
        // Send text to the active terminal
        // const terminal = vscode.window.activeTerminal;
        // terminal?.sendText("pwd");
        const terminal = vscode.window.activeTerminal;
        if (terminal) {
          terminal.sendText(data.value);
        }
      } else if (data.type === "prompt") {
        this.search(data.value ?? "");
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

  public async search(prompt: string) {
    this._view?.webview.postMessage({
      type: "setLoading",
      value: true,
    });

    await this._chatGPTAPI.ensureAuth();

    // Get the active document's text
    const languageId = vscode.window.activeTextEditor?.document.languageId;
    const surroundingText = vscode.window.activeTextEditor?.document.getText();

    // get the selected text
    const selection = vscode.window.activeTextEditor?.selection;
    const selectedText = vscode.window.activeTextEditor?.document.getText(selection);
    let searchPrompt = "";

    if (selection && selectedText) {
      searchPrompt = `${selectedText}

	${prompt}`;
    } else {
      //     searchPrompt = `This is the ${languageId} file I'm working on:
      // ${surroundingText}

      // ${prompt}`;
      searchPrompt = prompt;
    }

    console.log(searchPrompt);

    let response = "";
    try {
      response = await this._chatGPTAPI.sendMessage(searchPrompt);
    } catch (e) {
      console.error(e);
    }

    if (this._view) {
      this._view.show?.(true);
      this._view?.webview.postMessage({
        type: "setLoading",
        value: false,
      });
      this._view.webview.postMessage({ type: "addResponse", value: response });
    }
  }
}

// This method is called when your extension is deactivated
export function deactivate() {}

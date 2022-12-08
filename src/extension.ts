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

// Main function when starting the extension
export function activate(context: vscode.ExtensionContext) {
  const provider = new ChatGPTViewProvider(context);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(ChatGPTViewProvider.viewType, provider, {
      webviewOptions: {
        retainContextWhenHidden: true,
      },
    })
  );

  const disposable = vscode.commands.registerCommand("chatgpt.ask", () => {
    vscode.window.showInputBox({ prompt: "What do you want to do?" }).then((value) => {
      provider.search(value ?? "");
    });
  });
  context.subscriptions.push(disposable);
}

class ChatGPTViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "chatgpt.chatView";

  private _view?: vscode.WebviewView;

  private conversation: ChatGPTConversation | null = null;

  constructor(private context: vscode.ExtensionContext) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      retainContextWhenHidden: true,
      localResourceRoots: [this.context.extensionUri],
    };

    const scriptUri = webviewView.webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, "media", "main.js")
    );
    webviewView.webview.html = sidebarHTML
      .replace("${mainScriptUri}", scriptUri.toString())
      .replace(
        "${jqueryScriptUri}",
        webviewView.webview
          .asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, "media", "jquery.min.js"))
          .toString()
      )
      .replace(
        "${showdownUri}",
        webviewView.webview
          .asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, "media", "showdown.min.js"))
          .toString()
      )
      .replace(
        "${tailwindUri}",
        webviewView.webview
          .asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, "media", "tailwind.min.js"))
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
    let sessionToken = vscode.workspace.getConfiguration("chatgpt").get("token") as
      | string
      | null
      | undefined;

    // Prompt for session token if one is not set.
    if (!sessionToken || sessionToken.length === 0) {
      const value = await vscode.window.showInputBox({
        title: "Add your Session Token",
        prompt:
          "Please grab your token and paste it here. See the Marketplace extension page for instructions.",
      });
      if (!value) {
        return;
      }

      await vscode.workspace.getConfiguration("chatgpt").update("token", value, true);
      sessionToken = value;
    }

    const api = new ChatGPTAPI({
      sessionToken: sessionToken ?? "",
    });

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
      await api.ensureAuth();

      // Start a convo if it doesn't exist
      if (!this.conversation) {
        this.conversation = api.getConversation() ?? null;
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
      const errorMsg: string = e?.message;
      this._view?.webview.postMessage({
        type: "setLoading",
        value: false,
      });

      if (
        errorMsg.includes("session token may have expired") ||
        errorMsg.includes("ChatGPT failed to refresh auth token")
      ) {
        const value = await vscode.window.showInputBox({
          title: "Expired Session Token",
          prompt: "Please enter a new token. See the Marketplace extension page for instructions.",
        });
        if (!value) {
          return;
        }
        await vscode.workspace.getConfiguration("chatgpt").update("token", value, true);
        // TODO: Should re-try the query
      } else {
        await vscode.window.showErrorMessage("Error sending request to ChatGPT", e?.message);
      }
      console.error(e);
    }
  }
}

// This method is called when your extension is deactivated
export function deactivate() {}

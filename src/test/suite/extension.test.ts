import * as assert from "assert";

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from "vscode";
import { createPrompt } from "../../utils";

suite("Extension Test Suite", () => {
  vscode.window.showInformationMessage("Start all tests.");

  test("Sample test", () => {
    assert.strictEqual(-1, [1, 2, 3].indexOf(5));
    assert.strictEqual(-1, [1, 2, 3].indexOf(0));

    // Presets
    assert.strictEqual(
      createPrompt(undefined, "explain this code: ", "main()"),
      "explain this code: \nmain()"
    );
    assert.strictEqual(createPrompt(undefined, "explain this code: "), "explain this code: \n");
    assert.strictEqual(
      createPrompt(undefined, "explain this code: ", undefined, "long file"),
      "explain this code: \nlong file"
    );

    // User input
    assert.strictEqual(
      createPrompt("how do you create a new class in Javascript"),
      "how do you create a new class in Javascript"
    );
    assert.strictEqual(
      createPrompt("change const to let", "const a = 5;"),
      "const a = 5;\nchange const to let"
    );
  });
});

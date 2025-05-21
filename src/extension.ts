import * as vscode from "vscode";

let highlightEnabled = true; // Toggle state

export function activate(context: vscode.ExtensionContext) {
  console.log("🔥 Line Highlighter activated: Keeping it sharp and simple.");

  let activeEditor = vscode.window.activeTextEditor;
  let decorationType = getDecorationTypeFromConfig();
  let numberDecorationType = getNumberDecorationType();

  function updateHighlighting() {
    if (!activeEditor || !highlightEnabled) {
      return;
    }

    const selections = activeEditor.selections;
    const ranges: vscode.Range[] = [];
    const lineDecorations: vscode.DecorationOptions[] = [];

    for (const sel of selections) {
      for (let i = sel.start.line; i <= sel.end.line; i++) {
        const range = new vscode.Range(i, 0, i, 0);
        ranges.push(range);

        lineDecorations.push({
          range,
          renderOptions: {
            after: {
              contentText: ` ← ${i + 1}`,
              color: "rgba(150,150,150,0.4)",
              margin: "0 0 0 1rem",
              fontStyle: "italic",
            },
          },
        });
      }
    }

    activeEditor.setDecorations(decorationType, ranges);
    activeEditor.setDecorations(numberDecorationType, lineDecorations);
  }

  function getDecorationTypeFromConfig(): vscode.TextEditorDecorationType {
    const config = vscode.workspace.getConfiguration("vscode-line-highlighter");
    return vscode.window.createTextEditorDecorationType({
      backgroundColor: config.get(
        "backgroundColor",
        "rgba(100, 219, 255, 0.07)"
      ),
      borderColor: config.get("borderColor", "rgba(100, 245, 255, 0.85)"),
      borderWidth: config.get("borderWidth", "0 0 0 3px"),
      borderStyle: "solid",
      isWholeLine: config.get("isWholeLine", true),
    });
  }

  function getNumberDecorationType(): vscode.TextEditorDecorationType {
    return vscode.window.createTextEditorDecorationType({
      after: {
        margin: "0 0 0 1rem",
      },
    });
  }

  function refreshDecorationType() {
    decorationType.dispose();
    numberDecorationType.dispose();
    decorationType = getDecorationTypeFromConfig();
    numberDecorationType = getNumberDecorationType();
    updateHighlighting();
  }

  function clearHighlights() {
    if (activeEditor) {
      activeEditor.setDecorations(decorationType, []);
      activeEditor.setDecorations(numberDecorationType, []);
    }
  }

  vscode.window.onDidChangeTextEditorSelection(
    updateHighlighting,
    null,
    context.subscriptions
  );
  vscode.window.onDidChangeActiveTextEditor(
    (editor) => {
      activeEditor = editor;
      updateHighlighting();
    },
    null,
    context.subscriptions
  );

  vscode.workspace.onDidChangeConfiguration(
    (e) => {
      if (e.affectsConfiguration("vscode-line-highlighter")) {
        refreshDecorationType();
      }
    },
    null,
    context.subscriptions
  );

  context.subscriptions.push(decorationType);
  context.subscriptions.push(numberDecorationType);

  updateHighlighting();

  // 👇 Add a status bar toggle
  const statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100
  );
  statusBarItem.command = "vscode-line-highlighter.toggleHighlight";

  function updateStatusBar() {
    statusBarItem.text = highlightEnabled
      ? "🟢 Highlight ON"
      : "🔴 Highlight OFF";
    statusBarItem.tooltip = "Toggle Line Highlighter";
    statusBarItem.show();
  }

  context.subscriptions.push(statusBarItem);

  // Update both status bar and highlights together
  const enhancedToggleCommand = vscode.commands.registerCommand(
    "vscode-line-highlighter.toggleHighlight",
    () => {
      highlightEnabled = !highlightEnabled;
      vscode.window.showInformationMessage(
        `Line highlighting ${highlightEnabled ? "enabled ✅" : "disabled ❌"}`
      );
      updateStatusBar();
      highlightEnabled ? updateHighlighting() : clearHighlights();
    }
  );

  context.subscriptions.push(enhancedToggleCommand);

  // Initial render
  updateStatusBar();
}

export function deactivate() {}

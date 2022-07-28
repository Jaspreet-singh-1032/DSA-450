// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");
const {
  syncQuestions,
  listTopics,
  listQuestions,
  getQuestionContent,
} = require("./utils");

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
async function activate(context) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "DSA450" is now active!');

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with  registerCommand
  // The commandId parameter must match the command field in package.json

  let disposable = vscode.commands.registerCommand(
    "DSA450.showTopicsList",
    async function () {
      // The code you place here will be executed every time your command is executed

      async function showTopics() {
        // show list of topics
        const topics = await listTopics(context);
        topics.push("Sync New Questions");
        const topic = await vscode.window.showQuickPick(topics, {
          matchOnDetail: true,
          placeHolder: "Search for topics",
        });
        if (topic === "Sync New Questions") {
          vscode.window.withProgress(
            {
              location: vscode.ProgressLocation.Notification,
              title: "Syncing new questions",
            },
            () => {
              const p = new Promise(async (resolve) => {
                try {
                  await syncQuestions(context);
                  vscode.window.showInformationMessage(
                    "Syncing questions completed",
                    "Success"
                  );
                } catch (exception) {
                  vscode.window.showErrorMessage(
                    "Couldn't sync new questions",
                    "Failed"
                  );
                }
                resolve();
              });
              return p;
            }
          );
        } else if (topic) {
          showQuestions(topic);
        }
      }

      async function showQuestions(topic) {
        // Show list of questions for selected topic
        const questions = await listQuestions(context, topic);
        const question = await vscode.window.showQuickPick(questions, {
          matchOnDetail: true,
          placeHolder: "Search for questions",
        });
        await renderQuestion(topic, question);
      }
      showTopics();
    }
  );

  async function renderQuestion(topic, question) {
    // render question selected by user in new webview
    const content = await getQuestionContent(context, topic, question);
    const questionPanel = vscode.window.createWebviewPanel(
      "question",
      question, // title for new webview
      vscode.ViewColumn.One,
      {}
    );
    questionPanel.webview.html = content;
  }

  context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
function deactivate() {}

module.exports = {
  activate,
  deactivate,
};

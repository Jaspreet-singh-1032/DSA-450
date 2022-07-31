const vscode = require("vscode");
const MarkdownIt = require("markdown-it");
const axios = require("axios");
const { posix } = require("path");
const { ROOT_URL } = require("./constants");

async function fetch(url) {
  return await axios.get(url);
}

async function getTree(url) {
  const response = await fetch(url);
  if (response.status == 200) {
    return response.data.tree;
  }
  return [];
}

async function getTopics() {
  const response = await getTree(ROOT_URL);
  if (response.length > 0) {
    return response.filter((obj) => obj.type === "tree");
  }
  return [];
}

async function saveQuestion(topic, fileName, content, globalStorageUri) {
  // save question in to the file system
  const folderUri = globalStorageUri.with({
    path: posix.join(globalStorageUri.path, `${topic}/${fileName}`),
  });
  const writeData = Buffer.from(content, "utf8");
  await vscode.workspace.fs.writeFile(folderUri, writeData);
}

async function syncQuestions(context) {
  // Sync questions from the github repo and save into the file system
  const globalStorageUri = await context.globalStorageUri;
  const topics = await getTopics();
  for (let topic of topics) {
    const questionsTree = await getTree(topic.url); // questions of a particular topic
    for (let question of questionsTree) {
      const questionData = await fetch(question.url);
      const content = Buffer.from(questionData.data.content, "base64").toString(
        "utf-8"
      );

      // .path is used as the name of question or topic
      saveQuestion(topic.path, question.path, content, globalStorageUri);
    }
  }
}

async function listTopics(context) {
  // Return the synced topics list from the fs
  const globalStorageUri = await context.globalStorageUri;
  const topics = [];
  for (const [name, type] of await vscode.workspace.fs.readDirectory(
    globalStorageUri
  )) {
    if (type === vscode.FileType.Directory) {
      topics.push(name);
    }
  }
  return topics;
}

async function listQuestions(context, topic) {
  // List questions of selected topic from the fs
  const globalStorageUri = await context.globalStorageUri;
  const topicUri = globalStorageUri.with({
    path: posix.join(globalStorageUri.path, topic),
  });
  const questions = [];
  for (const [name, type] of await vscode.workspace.fs.readDirectory(
    topicUri
  )) {
    if (type === vscode.FileType.File) {
      questions.push(name);
    }
  }
  return questions;
}

async function getQuestionContent(context, topic, question) {
  // return the content of selected question
  const globalStorageUri = await context.globalStorageUri;
  const questionUri = globalStorageUri.with({
    path: posix.join(globalStorageUri.path, `${topic}/${question}`),
  });
  const content = await vscode.workspace.fs.readFile(questionUri);
  const contentStr = Buffer.from(content).toString("utf-8");
  return mdToHtml(contentStr);
}

async function mdToHtml(mdStr) {
  const md = MarkdownIt();
  return md.render(mdStr);
}

async function createDataDir(context) {
  // create directory to save topics and questions if not already exists
  const globalStorageUri = await context.globalStorageUri;
  try {
    await vscode.workspace.fs.stat(globalStorageUri);
  } catch (error) {
    await vscode.workspace.fs.createDirectory(globalStorageUri);
  }
}

module.exports = {
  syncQuestions,
  listTopics,
  listQuestions,
  getQuestionContent,
  createDataDir
};

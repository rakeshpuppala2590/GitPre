import { NextResponse } from "next/server";
import { exec } from "child_process";
import fs from "fs";
import path from "path";
import util from "util";
import { createVectorStore } from "../../utils/vectorstore";

const execPromise = util.promisify(exec);

const SUPPORTED_EXTENSIONS = new Set([
  ".py",
  ".js",
  ".tsx",
  ".jsx",
  ".ipynb",
  ".java",
  ".cpp",
  ".ts",
  ".go",
  ".rs",
  ".vue",
  ".swift",
  ".c",
  ".h",
]);

const IGNORED_DIRS = new Set([
  "node_modules",
  "venv",
  "env",
  "dist",
  "build",
  ".git",
  "__pycache__",
  ".next",
  ".vscode",
  "vendor",
]);

const isBinary = (filePath: string): boolean => {
  try {
    const buffer = fs.readFileSync(filePath);
    return buffer.includes(0);
  } catch {
    return false;
  }
};

const getFileContent = (filePath: string, repoPath: string) => {
  try {
    if (isBinary(filePath)) return null;

    const content = fs.readFileSync(filePath, "utf-8");
    const relPath = path.relative(repoPath, filePath);
    return { name: relPath, content };
  } catch (e) {
    console.error(`Error reading file ${filePath}: ${e}`);
    return null;
  }
};

const getMainFilesContent = (repoPath: string) => {
  const filesContent: { name: string; content: string }[] = [];

  const walkSync = (dir: string) => {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        if (!IGNORED_DIRS.has(file)) {
          walkSync(filePath);
        }
      } else {
        if (SUPPORTED_EXTENSIONS.has(path.extname(file))) {
          const fileContent = getFileContent(filePath, repoPath);
          if (fileContent) {
            filesContent.push(fileContent);
          }
        }
      }
    }
  };

  walkSync(repoPath);
  return filesContent;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const repoUrl = searchParams.get("repoUrl");

  if (!repoUrl) {
    return NextResponse.json(
      { error: "Invalid repository URL" },
      { status: 400 }
    );
  }

  const repoName = repoUrl.split("/").pop();
  if (!repoName) {
    return NextResponse.json(
      { error: "Invalid repository URL" },
      { status: 400 }
    );
  }

  const repoPath = path.join("/tmp", repoName);

  try {
    await execPromise(`rm -rf ${repoPath}`);
    await execPromise(`git clone ${repoUrl} ${repoPath}`);

    const filesContent = getMainFilesContent(repoPath);
    await createVectorStore(filesContent, repoUrl);
    return NextResponse.json({ files: filesContent, namespace: repoUrl });
  } catch (e) {
    console.error(`Error: ${e}`);
    return NextResponse.json(
      { error: "Failed to process repository" },
      { status: 500 }
    );
  }
}

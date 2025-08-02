import * as dotenv from "dotenv";
import { Octokit } from "@octokit/rest";

dotenv.config();

// Configure Octokit
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

const owner = process.env.GITHUB_OWNER as string;
const repo = process.env.GITHUB_REPO as string;

export { octokit, owner, repo };

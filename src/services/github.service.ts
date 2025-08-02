import { Octokit } from "@octokit/rest";
import { z } from "zod";
import type { Word } from "../word.js";
import { GitHubApiError } from "../errors.js";

export class GitHubService {
  private octokit: Octokit;

  constructor(
    private owner: string,
    private repo: string,
    private githubToken: string
  ) {
    this.octokit = new Octokit({
      auth: this.githubToken,
    });
  }

  async createWordIssue(word: Word): Promise<any> {
    try {
      const response = await this.octokit.issues.create({
        owner: this.owner,
        repo: this.repo,
        title: word.word,
        body: JSON.stringify(word, null, 2),
        labels: ["word"],
      });

      console.log("Created GitHub issue:", response.data.number);
      return response.data;
    } catch (error) {
      console.error("Failed to create GitHub issue:", error);
      throw new GitHubApiError(
        "Failed to create GitHub issue",
        (error as any)?.status
      );
    }
  }

  async listWordIssues(): Promise<Word[]> {
    try {
      const response = await this.octokit.issues.listForRepo({
        owner: this.owner,
        repo: this.repo,
        labels: "word",
        state: "all",
      });

      const words = response.data
        .map((issue) => {
          try {
            const wordData = JSON.parse(issue.body || "{}");
            return {
              ...wordData,
              id: issue.number,
            };
          } catch (error) {
            console.error("Failed to parse issue body:", issue.body);
            return null;
          }
        })
        .filter((word): word is Word => word !== null);

      return words;
    } catch (error) {
      console.error("Failed to list GitHub issues:", error);
      throw new GitHubApiError(
        "Failed to list GitHub issues",
        (error as any)?.status
      );
    }
  }

  async getWordIssue(issueNumber: number): Promise<Word | null> {
    try {
      const response = await this.octokit.issues.get({
        owner: this.owner,
        repo: this.repo,
        issue_number: issueNumber,
      });

      const wordData = JSON.parse(response.data.body || "{}");
      return {
        ...wordData,
        id: response.data.number,
      };
    } catch (error) {
      console.error(`Failed to get GitHub issue ${issueNumber}:`, error);
      return null;
    }
  }
}

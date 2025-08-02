import fastify from "fastify";
import { Octokit } from "@octokit/rest";
import * as dotenv from "dotenv";

dotenv.config();
const server = fastify({ logger: true });
interface Word {
  body: string;
  pronunciation: string;
  meaning: string;
  samples: string[];
}
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
const owner = process.env.GITHUB_OWNER;
const repo = process.env.GITHUB_REPO;
server.post("/issue", async (request, reply) => {
  try {
    if (!owner || !repo) {
      throw new Error(
        "GITHUB_OWNER and GITHUB_REPO environment variables must be set."
      );
    }
    const word = request.body as Word;
    const title = `New Word: ${word.body}`;
    const issueBody = `Pronunciation: ${word.pronunciation}Meaning: ${
      word.meaning
    }Samples:${word.samples.map((sample) => `- ${sample}`).join("\n")}`;
    const response = await octokit.issues.create({
      owner,
      repo,
      title,
      body: issueBody,
    });
    reply.code(201).send(response.data);
  } catch (error) {
    server.log.error(error);
    reply.code(500).send({ error: "Failed to create issue" });
  }
});
server.get("/issues", async (request, reply) => {
  try {
    if (!owner || !repo) {
      throw new Error(
        "GITHUB_OWNER and GITHUB_REPO environment variables must be set."
      );
    }
    const response = await octokit.issues.listForRepo({ owner, repo });
    const words = response.data.map((issue) => {
      const wordInfo = JSON.parse(issue.body || "{}");
      return wordInfo;
    });
    reply.send(words);
  } catch (error) {
    server.log.error(error);
    reply.code(500).send({ error: "Failed to list issues" });
  }
});
const start = async () => {
  try {
    await server.listen({ port: 3000 });
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};
start();

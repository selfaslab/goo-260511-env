import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { scanGithubRepo, parseGithubUrl } from "../services/githubCloneService.js";

const githubScanSchema = z.object({
  repoUrl: z
    .string({ required_error: "repoUrl is required" })
    .min(1, "repoUrl is required")
    .max(512, "repoUrl is too long"),
});

const router = Router();

router.post("/scan/github", async (req: Request, res: Response) => {
  const parsed = githubScanSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid request body",
      details: parsed.error.flatten(),
    });
  }
  // Validate URL early so we can return a 400 (vs. 500) for shape errors.
  try {
    parseGithubUrl(parsed.data.repoUrl);
  } catch (err) {
    return res.status(400).json({
      error: err instanceof Error ? err.message : "Invalid GitHub URL.",
    });
  }
  try {
    const result = await scanGithubRepo(parsed.data.repoUrl);
    return res.status(200).json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    // eslint-disable-next-line no-console
    console.error("[github-scan]", err);
    return res.status(500).json({ error: message });
  }
});

export default router;

import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { scanProject } from "../services/scanService.js";

const scanSchema = z.object({
  projectPath: z.string().min(1, "projectPath is required"),
});

const router = Router();

router.post("/scan", async (req: Request, res: Response) => {
  const parsed = scanSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid request body",
      details: parsed.error.flatten(),
    });
  }
  try {
    const result = await scanProject(parsed.data.projectPath);
    return res.status(200).json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return res.status(500).json({ error: message });
  }
});

export default router;

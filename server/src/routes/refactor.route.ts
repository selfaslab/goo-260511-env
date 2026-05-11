import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { generateSecureRefactor } from "../refactor/secureRefactor.js";
import { aggregatePatch } from "../refactor/patchGenerator.js";
import { getLastResult } from "../services/scanService.js";

const findingSchema = z.object({
  id: z.string(),
  type: z.string(),
  risk: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  valueMasked: z.string(),
  filePath: z.string(),
  lineNumber: z.number().int().nonnegative(),
  snippet: z.string().optional(),
  variableName: z.string().optional(),
  hardcoded: z.boolean(),
  clientExposed: z.boolean(),
  category: z.enum(["secret", "config", "env"]).optional(),
});

const refactorSchema = z.object({
  finding: findingSchema,
  currentCode: z.string().optional(),
  projectPath: z.string().optional(),
});

const exportSchema = z.object({
  projectPath: z.string().optional(),
});

const router = Router();

router.post("/refactor", (req: Request, res: Response) => {
  const parsed = refactorSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid request body",
      details: parsed.error.flatten(),
    });
  }
  try {
    const result = generateSecureRefactor({
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      finding: parsed.data.finding as Parameters<typeof generateSecureRefactor>[0]["finding"],
      currentCode: parsed.data.currentCode,
    });
    return res.status(200).json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return res.status(500).json({ error: message });
  }
});

router.post("/refactor/export", (req: Request, res: Response) => {
  const parsed = exportSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid request", details: parsed.error.flatten() });
  }
  const report = getLastResult(parsed.data.projectPath);
  if (!report) {
    return res.status(404).json({ error: "No scan available to export" });
  }

  const patches = report.findings.map((finding) =>
    generateSecureRefactor({ finding }).patch,
  );

  const exportFile = aggregatePatch(report.projectPath, patches);
  return res.status(200).json(exportFile);
});

export default router;

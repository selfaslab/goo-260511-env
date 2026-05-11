import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { getLastResult } from "../services/scanService.js";
import { renderReport } from "../services/reportService.js";
import type { ReportFormat } from "../types/index.js";

const querySchema = z.object({
  projectPath: z.string().optional(),
});

const exportQuerySchema = z.object({
  projectPath: z.string().optional(),
  format: z.enum(["json", "markdown", "txt"]).default("json"),
  download: z
    .union([z.literal("true"), z.literal("false")])
    .optional()
    .transform((v) => v === "true"),
});

const router = Router();

router.get("/report", (req: Request, res: Response) => {
  const parsed = querySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid query", details: parsed.error.flatten() });
  }
  const report = getLastResult(parsed.data.projectPath);
  if (!report) {
    return res.status(404).json({ error: "No scan has been run yet" });
  }
  return res.status(200).json(report);
});

router.get("/report/export", (req: Request, res: Response) => {
  const parsed = exportQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid query", details: parsed.error.flatten() });
  }
  const report = getLastResult(parsed.data.projectPath);
  if (!report) {
    return res.status(404).json({ error: "No scan has been run yet" });
  }

  const format: ReportFormat = parsed.data.format;
  const rendered = renderReport(report, format);
  res.setHeader("Content-Type", rendered.contentType);
  if (parsed.data.download) {
    res.setHeader("Content-Disposition", `attachment; filename="${rendered.filename}"`);
  }
  return res.status(200).send(rendered.body);
});

export default router;

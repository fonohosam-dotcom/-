import { Request, Response } from "express";
import { logger } from "../../lib/logger";
import { db } from "../../db";
import { cases } from "../../db/schema";
import { eq } from "drizzle-orm";

export const getCases = async (req: Request, res: Response) => {
  try {
    const allCases = await db.select().from(cases);
    res.json({ status: "success", data: allCases });
  } catch (error) {
    logger.error("Error fetching cases", error);
    res.status(500).json({ status: "error", message: "Failed to fetch cases" });
  }
};

export const getCaseById = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const caseData = await db.select().from(cases).where(eq(cases.id, id));
    if (caseData.length === 0) {
      return res.status(404).json({ status: "error", message: "Case not found" });
    }
    res.json({ status: "success", data: caseData[0] });
  } catch (error) {
    logger.error(`Error fetching case ${req.params.id}`, error);
    res.status(500).json({ status: "error", message: "Failed to fetch case" });
  }
};

export const createCase = async (req: Request, res: Response) => {
  try {
    logger.info(`Creating case by user ${(req as any).user?.email}`);
    const newCase = await db.insert(cases).values({
      caseId: `C${Date.now()}`,
      caseNumber: `CN-${Date.now()}`,
      userId: (req as any).user?.id || 1, // Fallback if no full DB user
      family: req.body.family || {},
      needTypes: req.body.needTypes || [],
      description: req.body.description || "",
      amountRequired: req.body.amountRequired || 0,
      needScore: req.body.needScore || 0,
      priorityLevel: req.body.priorityLevel || "low",
      status: "pending",
      municipality: req.body.municipality || "Unknown",
      latitude: req.body.latitude || 0,
      longitude: req.body.longitude || 0,
    }).returning();
    res.json({ status: "success", data: newCase[0] });
  } catch (error) {
    logger.error("Error creating case", error);
    res.status(500).json({ status: "error", message: "Failed to create case" });
  }
};

export const deleteCase = async (req: Request, res: Response) => {
  try {
    logger.info(`Deleting case ${req.params.id} by user ${(req as any).user?.email}`);
    const id = parseInt(req.params.id);
    await db.delete(cases).where(eq(cases.id, id));
    res.json({ status: "success", message: "Case deleted" });
  } catch (error) {
    logger.error(`Error deleting case ${req.params.id}`, error);
    res.status(500).json({ status: "error", message: "Failed to delete case" });
  }
};

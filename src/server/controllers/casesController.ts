import { Request, Response } from "express";
import { logger } from "../../lib/logger";

export const getCases = async (req: Request, res: Response) => {
  // TODO: Use Drizzle ORM to fetch cases from Cloud SQL
  res.json({ status: "success", data: [] });
};

export const getCaseById = async (req: Request, res: Response) => {
  res.json({ status: "success", data: null });
};

export const createCase = async (req: Request, res: Response) => {
  logger.info(`Creating case by user ${(req as any).user?.email}`);
  res.json({ status: "success", data: req.body });
};

export const deleteCase = async (req: Request, res: Response) => {
  logger.info(`Deleting case ${req.params.id} by user ${(req as any).user?.email}`);
  res.json({ status: "success", message: "Case deleted" });
};

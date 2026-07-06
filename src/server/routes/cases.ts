import { Router } from "express";
import { getCases, getCaseById, createCase, deleteCase } from "../controllers/casesController";
import { requireAuth, requireRole } from "../middleware/auth";

const router = Router();

router.get("/", requireAuth, getCases);
router.get("/:id", requireAuth, getCaseById);
router.post("/", requireAuth, requireRole(["admin", "citizen", "researcher"]), createCase);
router.delete("/:id", requireAuth, requireRole(["admin"]), deleteCase);

export default router;

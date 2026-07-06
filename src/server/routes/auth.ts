import { Router } from "express";
import { login, register } from "../controllers/authController";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.post("/login", login);
router.post("/register", register);
router.get("/me", requireAuth, (req, res) => res.json({ user: (req as any).user }));

export default router;

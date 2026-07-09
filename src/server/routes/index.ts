import { Router } from "express";
import authRoutes from "./auth.routes.js";
import usersRoutes from "./users.routes.js";
import casesRoutes from "./cases.routes.js";
import operationsRoutes from "./operations.routes.js";
import aiRoutes from "./ai.routes.js";
import securityRoutes from "./security.routes.js";

const router = Router();

router.use("/", authRoutes);
router.use("/", usersRoutes);
router.use("/", casesRoutes);
router.use("/", operationsRoutes);
router.use("/", aiRoutes);
router.use("/", securityRoutes);

export default router;

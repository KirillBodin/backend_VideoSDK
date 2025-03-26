// routes/schoolAdminRoutes.js
import express from "express";
import { checkEmailPermission } from "../controllers/schoolAdminController.js";

const router = express.Router();

router.post("/check-email", checkEmailPermission);

export default router;

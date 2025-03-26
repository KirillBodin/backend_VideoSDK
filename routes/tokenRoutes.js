import express from "express";
import { getToken } from "../controllers/tokenController.js";

const router = express.Router();

router.get("/get-token", getToken);

export default router;

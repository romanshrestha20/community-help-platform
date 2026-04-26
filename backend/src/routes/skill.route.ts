import express from "express";
import { listSkills } from "../controllers/qualification.controller.js";

const router = express.Router();

router.get("/", listSkills);

export default router;

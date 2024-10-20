import express from "express";
import verifyUser from "../middleware/auth.js";
import { createDecor, deleteDecor, editDecor, getDecorDetails } from "../controllers/decorController.js";
import upload from "../middleware/upload.js";


const decorRouter = express.Router();
decorRouter.post("/create-decorations",verifyUser,upload.fields([{ name: 'photos', maxCount: 5 }, { name: 'videos', maxCount: 3 }]), createDecor);
decorRouter.get('/decorations-lists', getDecorDetails)
decorRouter.put("/edit-decorations/:id",verifyUser, editDecor);
decorRouter.delete("/remove-decorations/:id",verifyUser, deleteDecor);
export default decorRouter;
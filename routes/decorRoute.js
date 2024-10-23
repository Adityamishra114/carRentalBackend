import express from "express";
import verifyUser from "../middleware/auth.js";
import { createDecor, deleteDecor, editDecor, getDecorById, getDecorDetails } from "../controllers/decorController.js";
import { uploadFiles } from "../middleware/uploadDecor.js";



const decorRouter = express.Router();
decorRouter.post("/create-decorations",verifyUser,uploadFiles, createDecor);
decorRouter.get('/decorations-lists', getDecorDetails)
decorRouter.get('/decoration/:id', getDecorById);
decorRouter.put("/edit-decorations/:id",verifyUser, editDecor);
decorRouter.delete("/remove-decorations/:id",verifyUser, deleteDecor);
export default decorRouter;
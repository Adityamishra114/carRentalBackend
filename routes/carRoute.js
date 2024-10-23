import express from "express";
import { createCar, deleteCar, editCar,getCarById,getCarDetails } from "../controllers/carController.js";
import verifyUser from "../middleware/auth.js";
import { uploadFiles } from "../middleware/upload.js";



const carRouter = express.Router();
carRouter.post("/create-car",verifyUser,uploadFiles, createCar);
carRouter.get('/cars', getCarDetails)
carRouter.get('/car/:id', getCarById);
carRouter.put("/edit-car/:id",verifyUser, editCar);
carRouter.delete("/remove-car/:id",verifyUser, deleteCar);
export default carRouter;

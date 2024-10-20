import express from "express";
import { createCar, deleteCar, editCar,getCarDetails } from "../controllers/carController.js";
import verifyUser from "../middleware/auth.js";
import upload from "../middleware/upload.js";



const carRouter = express.Router();
carRouter.post("/create-car",verifyUser, upload.fields([{ name: 'photos', maxCount: 5 }, { name: 'videos', maxCount: 3 }]), createCar);

carRouter.get('/cars', getCarDetails)
carRouter.put("/edit-car/:id",verifyUser, editCar);
carRouter.delete("/remove-car/:id",verifyUser, deleteCar);
export default carRouter;

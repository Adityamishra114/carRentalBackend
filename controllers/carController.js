import Car from "../models/CarModel.js";
import fs from "fs";
import path from "path";
import { validationResult } from "express-validator";
import { errorHandler } from "../utils/error.js";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const createCar = async (req, res, next) => {
  console.log("Controller - Files received:", req.files);

  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    const {
      title,
      owner,
      yearOfProduction,
      color,
      typeOfCar,
      interior,
      numberOfSeats,
      additionalAmenities,
      rentalPrice,
      location,
      rentalDuration,
      specialOptionsForWedding,
      description,
      isVerified,
    } = req.body;

    const validPhotos = [];
    const validVideos = [];

    // const baseUrl = process.env.NODE_ENV === 'production' 
    //   ? process.env.BASE_URL_PROD 
    //   : process.env.BASE_URL_DEV;

    if (req.files?.photos && req.files.photos.length > 0) {
      validPhotos.push(
        ...req.files.photos.map((file) => `/uploads/photos/${file.filename}`) 
      ); 
    }
    if (req.files?.videos && req.files.videos.length > 0) {
      validVideos.push(
        ...req.files.videos.map((file) => `/uploads/videos/${file.filename}`) 
      ); 
    }

    console.log("valid photos", validPhotos);
    console.log("valid videos", validVideos);

    const newCar = new Car({
      title,
      owner,
      photos: validPhotos, 
      videos: validVideos, 
      yearOfProduction,
      color,
      typeOfCar,
      interior,
      numberOfSeats,
      additionalAmenities,
      rentalPrice,
      location,
      rentalDuration,
      specialOptionsForWedding,
      description,
      isVerified: isVerified === "true", 
    });
    const savedCar = await newCar.save(); 
    res.status(201).json({ success: true, car: savedCar }); 
  } catch (error) {
    next(error); 
  }
};


const getCarDetails = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { id } = req.params; 
    if (id) {
      const car = await Car.findById(id);
      if (!car) {
        return res.status(404).json({ success: false, message: "Car not found" });
      }

      return res.status(200).json({ success: true, car });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const { location, typeOfCar, color, additionalAmenities } = req.query;

    const filter = {};
    if (location) {
      filter.location = location;
    }
    if (typeOfCar) {
      filter.typeOfCar = typeOfCar;
    }
    if (color) {
      filter.color = color;
    }
    if (additionalAmenities) {
      filter.additionalAmenities = {
        $all: additionalAmenities.split(",").map((item) => item.trim()),
      };
    }

    const totalCars = await Car.countDocuments(filter);
    const cars = await Car.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    if (!cars || cars.length === 0) {
      return res.status(404).json({ success: false, message: "No cars found" });
    }

    const totalPages = Math.ceil(totalCars / limit);
    const startItem = skip + 1;
    const endItem = Math.min(skip + limit, totalCars);

    res.status(200).json({
      success: true,
      cars,
      pagination: {
        totalCars,
        totalPages,
        currentPage: page,
        limit,
        itemRange: `${startItem}-${endItem}`,
      },
    });
  } catch (error) {
    console.error("Error fetching car details:", error);
    next(errorHandler(500, error.message));
  }
};

const getCarById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const car = await Car.findById(id);
    if (!car) {
      return res.status(404).json({ success: false, message: "Car not found" });
    }
    res.status(200).json({ success: true, car });
  } catch (error) {
    console.error("Error fetching car by ID:", error);
    next(errorHandler(500, error.message));
  }
};


const editCar = async (req, res, next) => {
  const { id } = req.params;
  console.log('Editing car with ID:', id);

  try {
    const car = await Car.findById(id);
    if (!car) {
      return res.status(404).json({ success: false, message: "Car not found" });
    }

    const baseUrl = process.env.NODE_ENV === 'production' 
      ? process.env.BASE_URL_PROD 
      : process.env.BASE_URL_DEV;

    const deleteFiles = async (existingFiles) => {
      await Promise.all(existingFiles.map(async (file) => {
        try {
          await fs.unlink(path.join(__dirname, "..", file.url));
          console.log(`Deleted file: ${file.url}`);
        } catch (err) {
          console.error(`Error deleting file ${file.url}:`, err);
        }
      }));
    };

    const updateFields = {
      ...req.body, 
    };
    if (req.files) {
      const validPhotos = [];
      const validVideos = [];

      if (req.files.photos && Array.isArray(req.files.photos)) {
 
        await deleteFiles(car.photos || []);

        validPhotos.push(
          ...req.files.photos.map((file) => `${baseUrl}/uploads/photos/${file.filename}`)
        );
        updateFields.photos = validPhotos; 
      }

      if (req.files.videos && Array.isArray(req.files.videos)) {

        await deleteFiles(car.videos || []);

        validVideos.push(
          ...req.files.videos.map((file) => `${baseUrl}/uploads/videos/${file.filename}`)
        );
        updateFields.videos = validVideos; 
      }
    }

    const updatedCar = await Car.findByIdAndUpdate(id, updateFields, { new: true });

    const allCars = await Car.find({}).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      car: updatedCar,
      cars: allCars,
    });
  } catch (error) {
    console.error("Error editing decor:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};



const deleteCar = async (req, res, next) => {
  const { id } = req.params;
  console.log("Car ID to delete:", id);

  try {
    const car = await Car.findById(id);
    if (!car) {
      return next(errorHandler(404, "Car not found"));
    }
    const baseDir = path.join(__dirname, "../uploads");

    if (car.photos && car.photos.length > 0) {
      car.photos.forEach((photoUrl) => {
        const photoFileName = path.basename(photoUrl);
        const photoPath = path.join(baseDir, "photos", photoFileName);

        fs.unlink(photoPath, (err) => {
          if (err) {
            console.error("Error deleting photo:", err);
          } else {
            console.log("Photo deleted:", photoPath);
          }
        });
      });
    }
    if (car.videos && car.videos.length > 0) {
      car.videos.forEach((videoUrl) => {
        const videoFileName = path.basename(videoUrl);
        const videoPath = path.join(baseDir, "videos", videoFileName);

        fs.unlink(videoPath, (err) => {
          if (err) {
            console.error("Error deleting video:", err);
          } else {
            console.log("Video deleted:", videoPath);
          }
        });
      });
    }
    await Car.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: "Car and associated files deleted successfully" });

  } catch (error) {
    console.error("Error deleting Car:", error);
    next(errorHandler(500, error.message));
  }
};

export { createCar, getCarDetails, editCar, deleteCar,getCarById };

import Car from "../models/CarModel.js";
import fs from "fs";
import path from "path";
import { validationResult } from "express-validator";
import { v2 as cloudinary } from "cloudinary";
import { errorHandler } from '../utils/error.js';

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

    const uploadToCloudinary = (file, resourceType) => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { resource_type: resourceType },
          (error, result) => {
            if (error) {
              console.error(`Error uploading ${resourceType}:`, error);
              reject(new Error(`Error uploading ${resourceType}`));
            } else {
              resolve(result.secure_url);
            }
          }
        );
        stream.end(file.buffer);
      });
    };

    // Handle image uploads
    if (req.files?.photos && req.files.photos.length > 0) {
      const photoPromises = req.files.photos.map((file) =>
        uploadToCloudinary(file, "image")
      );
      const photoUrls = await Promise.all(photoPromises);
      photoUrls.forEach((url) => validPhotos.push({ url }));
    }

    // Handle video uploads
    if (req.files?.videos && req.files.videos.length > 0) {
      const videoPromises = req.files.videos.map((file) =>
        uploadToCloudinary(file, "video")
      );
      const videoUrls = await Promise.all(videoPromises);
      videoUrls.forEach((url) => validVideos.push({ url }));
    }

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
      filter.additionalAmenities = { $all: additionalAmenities.split(',').map(item => item.trim()) };
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

const editCar = async (req, res, next) => {
  const { id } = req.params; 
  try {
    const car = await Car.findById(id); 
    if (!car) {
      return res.status(404).json({ success: false, message: "Car not found" });
    }

    if (req.files.photos) {
      car.photos.forEach((photo) => {
        fs.unlink(path.join(__dirname, "..", photo.url), (err) => {
          if (err) console.error(err);
        });
      });
      car.photos = req.files.photos.map((file) => ({
        url: file.path,
        description: null, 
      }));
    }

    // Handle videos
    if (req.files.videos) {
      // Delete old videos from server if necessary
      car.videos.forEach((video) => {
        fs.unlink(path.join(__dirname, "..", video.url), (err) => {
          if (err) console.error(err);
        });
      });

      // Update videos with new files
      car.videos = req.files.videos.map((file) => ({
        url: file.path,
        description: null, // Similar to photos, you can modify as needed
      }));
    }

    // Update other car details
    car.title = req.body.title || car.title;
    car.owner = req.body.owner || car.owner;
    car.yearOfProduction = req.body.yearOfProduction || car.yearOfProduction;
    car.color = req.body.color || car.color;
    car.interior = req.body.interior || car.interior;
    car.numberOfSeats = req.body.numberOfSeats || car.numberOfSeats;
    car.additionalAmenities =
      req.body.additionalAmenities || car.additionalAmenities;
    car.rentalPrice = req.body.rentalPrice || car.rentalPrice;
    car.location = req.body.location || car.location;
    car.rentalDuration = req.body.rentalDuration || car.rentalDuration;
    car.specialOptionsForWedding =
      req.body.specialOptionsForWedding || car.specialOptionsForWedding;
    car.description = req.body.description || car.description;
    car.isVerified =
      req.body.isVerified !== undefined ? req.body.isVerified : car.isVerified;

    const updatedCar = await car.save();
    res.status(200).json({ success: true, car: updatedCar });
  } catch (error) {
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
    car.photos.forEach((photo) => {
      fs.unlink(path.join(__dirname, "..", photo.url), (err) => {
        if (err) console.error("Error deleting photo:", err);
      });
    });

    await Car.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: "Car deleted successfully" });
  } catch (error) {
    console.error("Error deleting car:", error); 
    next(errorHandler(500, error.message));
  }
};


export { createCar, getCarDetails, editCar, deleteCar };

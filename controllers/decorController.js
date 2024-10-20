import Decor from "../models/DecorationModel.js"
import fs from "fs";
import path from "path";
import { validationResult } from "express-validator";
import { v2 as cloudinary } from "cloudinary";
import { errorHandler } from '../utils/error.js';

const createDecor = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    const {
      title,
      owner,
      typeOfDecoration,
      location,
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

    const newDecor = new Decor({
      title,
      owner,
      photos: validPhotos,
      videos: validVideos,
      typeOfDecoration,
      location,
      description,
      isVerified: isVerified || false,
    });
    const savedDecor = await newDecor.save();
    res.status(201).json({ success: true, decor: savedDecor });
  } catch (error) {
    next(error);
  }
};

const getDecorDetails = async (req, res,next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const page = parseInt(req.query.page) || 1; 
    const limit = parseInt(req.query.limit) || 10; 
    const skip = (page - 1) * limit; 

    const { location, typeOfDecoration } = req.query;

    const filter = {};
    if (location) {
      filter.location = location;
    }
    if (typeOfDecoration) {
      filter.typeOfDecoration = { $all: typeOfDecoration.split(',').map(item => item.trim()) };
    }

    const totalDecors = await Decor.countDocuments(filter); 
    const decors = await Decor.find(filter)
      .sort({ createdAt: -1 }) 
      .skip(skip)
      .limit(limit); 

    if (!decors || decors.length === 0) {
      return res.status(404).json({ success: false, message: "No decoration list found" });
    }

    const totalPages = Math.ceil(totalDecors / limit); 
    const startItem = skip + 1; 
    const endItem = Math.min(skip + limit, totalDecors); 

    res.status(200).json({
      success: true,
      decors,
      pagination: {
        totalDecors,
        totalPages,
        currentPage: page,
        limit,
        itemRange: `${startItem}-${endItem}`, 
      },
    });
  } catch (error) {
    console.error("Error fetching decor details:", error);
    next(errorHandler(500, error.message)); 
  }
};
const editDecor = async (req, res,next) => {};
const deleteDecor = async (req, res, next) => {
  const { id } = req.params;
  console.log("Decor ID to delete:", id);
  
  try {
    // Find the decor by ID
    const decor = await Decor.findById(id);
    if (!decor) {
      return next(errorHandler(404, "Decor not found"));
    }

    // Delete photos associated with the decor
    decor.photos.forEach((photo) => {
      const photoPath = path.join(__dirname, "..", photo.url);
      fs.unlink(photoPath, (err) => {
        if (err) {
          console.error("Error deleting photo:", err);
        } else {
          console.log("Photo deleted:", photo.url);
        }
      });
    });

    // Delete the decor record from the database
    await Decor.findByIdAndDelete(id);

    // Send success response
    res.status(200).json({ success: true, message: "Decoration deleted successfully" });

  } catch (error) {
    console.error("Error deleting decor:", error);
    next(errorHandler(500, error.message));
  }
};


export { createDecor, getDecorDetails, editDecor, deleteDecor };

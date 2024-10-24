import Decor from "../models/DecorationModel.js"
import fs from "fs";
import path from "path";
import { validationResult } from "express-validator";
import { errorHandler } from '../utils/error.js';
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const createDecor = async (req, res,next) => {
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

    // const baseUrl = process.env.NODE_ENV === 'production' 
    // ? process.env.BASE_URL_PROD 
    // : process.env.BASE_URL_DEV;

  if (req.files?.photos && req.files.photos.length > 0) {
    validPhotos.push(
      ...req.files.photos.map((file) => `/uploads-decor/photos/${file.filename}`) 
    ); 
  }

  if (req.files?.videos && req.files.videos.length > 0) {
    validVideos.push(
      ...req.files.videos.map((file) => `/uploads-decor/videos/${file.filename}`) 
    ); 
  }

  console.log("valid photos", validPhotos);
  console.log("valid videos", validVideos);

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

    const { id } = req.params; 
    if (id) {
      const decor = await Decor.findById(id);
      if (!decor) {
        return res.status(404).json({ success: false, message: "Decoration not found" });
      }

      return res.status(200).json({ success: true, decor });
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
const getDecorById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const decor = await Decor.findById(id);
    if (!decor) {
      return res.status(404).json({ success: false, message: "Decoration not found" });
    }
    res.status(200).json({ success: true, decor });
  } catch (error) {
    console.error("Error fetching decor by ID:", error);
    next(errorHandler(500, error.message));
  }
};

const editDecor = async (req, res, next) => {
  const { id } = req.params;
  console.log('Editing decor with ID:', id);

  try {
    const decor = await Decor.findById(id);
    if (!decor) {
      return res.status(404).json({ success: false, message: "Decor not found" });
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
 
        await deleteFiles(decor.photos || []);

        validPhotos.push(
          ...req.files.photos.map((file) => `${baseUrl}/uploads-decor/photos/${file.filename}`)
        );
        updateFields.photos = validPhotos; 
      }

      if (req.files.videos && Array.isArray(req.files.videos)) {

        await deleteFiles(decor.videos || []);

        validVideos.push(
          ...req.files.videos.map((file) => `${baseUrl}/uploads-decor/videos/${file.filename}`)
        );
        updateFields.videos = validVideos; 
      }
    }

    const updatedDecor = await Decor.findByIdAndUpdate(id, updateFields, { new: true });

    const allDecors = await Decor.find({}).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      decor: updatedDecor,
      decors: allDecors,
    });
  } catch (error) {
    console.error("Error editing decor:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};


const deleteDecor = async (req, res, next) => {
  const { id } = req.params;
  console.log("Decor ID to delete:", id);

  try {
    const decor = await Decor.findById(id);
    if (!decor) {
      return next(errorHandler(404, "Decor not found"));
    }
    const baseDir = path.join(__dirname, "../uploads-decor");

    if (decor.photos && decor.photos.length > 0) {
      decor.photos.forEach((photoUrl) => {
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
    if (decor.videos && decor.videos.length > 0) {
      decor.videos.forEach((videoUrl) => {
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
    await Decor.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: "Decoration and associated files deleted successfully" });

  } catch (error) {
    console.error("Error deleting decor:", error);
    next(errorHandler(500, error.message));
  }
};


export { createDecor, getDecorDetails, editDecor, deleteDecor,getDecorById };

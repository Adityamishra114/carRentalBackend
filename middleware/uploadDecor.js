import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ensureDirectoryExists = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`); 
  } else {
    console.log(`Directory already exists: ${dir}`);
  }
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const fileType = file.mimetype.split("/")[0];

    let uploadPath = path.join(__dirname, "../uploads-decor", "others"); 
    if (fileType === "image") {
      uploadPath = path.join(__dirname, "../uploads-decor", "photos"); 
    } else if (fileType === "video") {
      uploadPath = path.join(__dirname, "../uploads-decor", "videos");
    }

    ensureDirectoryExists(uploadPath);
    console.log('Uploading to:', uploadPath);
    cb(null, uploadPath); 
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + path.extname(file.originalname);
    console.log('Generated file name:', uniqueName);
    cb(null, uniqueName); 
  },
});

const fileFilter = (req, file, cb) => {
  const allowedFileTypes = /jpeg|jpg|png|gif|mp4|mov|avi|mkv/;
  const mimeType = allowedFileTypes.test(file.mimetype);
  const extname = allowedFileTypes.test(path.extname(file.originalname).toLowerCase());

  if (mimeType && extname) {
    cb(null, true); 
  } else {
    cb(new Error("File type not allowed. Only images and videos are accepted."), false); 
  }
};

const upload = multer({
  storage,
  fileFilter,
});


export const uploadFiles = upload.fields([
  { name: 'photos', maxCount: 5 },
  { name: 'videos', maxCount: 3 }
]);

export default upload;

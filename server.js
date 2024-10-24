import path from "path"
import express from "express";
import cors from "cors";
import { connectDB } from "./config/DB.js";
import userRouter from "./routes/userRoute.js";
import "dotenv/config";
import carRouter from "./routes/carRoute.js";
import fileUpload from "express-fileupload";
import { v2 as cloudinary } from "cloudinary";
import decorRouter from "./routes/decorRoute.js";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// app config
const app = express();
const PORT = process.env.PORT || 5000;

//middleware
// app.use(express.json());

// app.use(fileUpload({ createParentPath: true }));

app.use(express.static("public"));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ limit: '20mb', extended: true }));


const CLIENT_URL =
  process.env.NODE_ENV === "production"
    ? process.env.CLIENT_URL_PROD
    : process.env.CLIENT_URL_DEV;

app.use(
  cors({
    origin:CLIENT_URL,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);
console.log(`CORS Origin: ${CLIENT_URL}`);
app.options("*", cors());

// db connection
connectDB();
app.get("/", (req, res) => {
  res.send("server start");
});
// app.use('/uploads', express.static('uploads'));
app.use("/api/user", userRouter);
app.use("/api/car", carRouter);
app.use("/api/decor", decorRouter);

app.get('/uploads/:path/:file', (req, res) => {
  console.log('/uploads/', req.params.path, req.params.file);
  res.sendFile(path.join(__dirname, '/uploads/', req.params.path, req.params.file));
});
app.get('/uploads-decor/:path/:file', (req, res) => {
  console.log('/uploads-decor/', req.params.path, req.params.file);
  res.sendFile(path.join(__dirname, '/uploads-decor/', req.params.path, req.params.file));
});

cloudinary.config({
  cloud_name: process.env.APP_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.APP_CLOUDINARY_API_KEY,
  api_secret: process.env.APP_CLOUDINARY_API_SECRET,
});

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  return res.status(statusCode).json({
    success: false,
    statusCode,
    message,
  });
});
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

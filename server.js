import express from "express";
import cors from "cors";
import { connectDB } from "./config/DB.js";
import userRouter from "./routes/userRoute.js";
import "dotenv/config";
import carRouter from "./routes/carRoute.js";
import fileUpload from "express-fileupload";
import { v2 as cloudinary } from "cloudinary";
import decorRouter from "./routes/decorRoute.js";
// app config
const app = express();
const PORT = process.env.PORT || 5000;

//middleware
app.use(express.json());

app.use(fileUpload({ createParentPath: true }));

app.use(express.static("public"));

app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin:  process.env.CLIENT_URL,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);
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



if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "/client/dist")));

  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "client", "dist", "index.html"));
  });
}

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

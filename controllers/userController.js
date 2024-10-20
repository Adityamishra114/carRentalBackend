import userModel from "../models/UserModel.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import validator from "validator";

const createToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' }); 
};


const loginUser = async (req, res) => {
  const { email, password } = req.body;


  if (!email || !password) {
    return res.json({ success: false, message: "Please provide all fields" });
  }

  try {
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.json({ success: false, message: "User does not exist" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.json({ success: false, message: "Invalid credentials" });
    }

    const token = createToken(user._id);
    return res.json({ success: true, token });
  } catch (error) {
    return res.json({ success: false, message: "Error occurred while logging in" });
  }
};


const registerUser = async (req, res) => {
  const { name, password, email } = req.body;


  if (!name || !email || !password) {
    return res.json({ success: false, message: "Please provide all fields" });
  }


  if (!validator.isEmail(email)) {
    return res.json({ success: false, message: "Please enter a valid email" });
  }

  if (password.length < 8) {
    return res.json({ success: false, message: "Password should be at least 8 characters" });
  }

  try {

    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.json({ success: false, message: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);


    const newUser = new userModel({
      name,
      email,
      password: hashPassword,
    });

    const user = await newUser.save();
    const token = createToken(user._id);
    return res.json({ success: true, token });
  } catch (error) {
    return res.json({ success: false, message: "Error occurred while registering" });
  }
};
const logoutUser = async (req, res) => {
  try {
    res.json({ success: true, message: "User logged out successfully" });
  } catch (error) {
    res.json({ success: false, message: "Error occurred while logging out" });
  }
};

export { loginUser, registerUser,logoutUser};

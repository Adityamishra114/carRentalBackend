import mongoose from "mongoose";
const phoneValidator = (phone) => {
  return /^\d{10,15}$/.test(phone);
};
const DecorationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required."],
    },
    owner: {
      name: {
        type: String,
        required: [true, "Owner name is required."],
      },
      phone: {
        type: String,
        required: [true, "Phone number is required."],
        validate: {
          validator: phoneValidator,
          message: "Invalid phone number! Must be between 10 and 15 digits.",
        },
      },
      email: {
        type: String,
        required: [true, "Email address is required."],
        validate: {
          validator: function (v) {
            return /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)+[a-zA-Z]{2,7})$/.test(
              v
            );
          },
          message: "Invalid email address!",
        },
      },
      instagram: {
        type: String,
        required: false,
        default: null,
      },
      facebook: {
        type: String,
        required: false,
        default: null,
      },
    },
    photos: { type: [String], required: true },
    videos: { type: [String], required: true },
    typeOfDecoration: {
      type: String,
      enum: ["Churches", "Halls", "Cars", "Chair Covers", "LED Signs"],
      required: true,
    },
    location: {
      type: String,
      required: [true, "Location is required."],
    },
    description: {
      type: String,
      required: [true, "Description is required."],
    },
    isVerified: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);
const DecorModel = mongoose.models.decor || mongoose.model("decor", DecorationSchema);

export default DecorModel;

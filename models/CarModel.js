import mongoose from 'mongoose';

const phoneValidator = (phone) => {
  return /^\d{10,15}$/.test(phone);
}

const carSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required.'],
  },
  owner: {
    name: {
      type: String,
      required: [true, 'Owner name is required.'], 
    },
    phone: {
      type: String, 
      required: [true, 'Phone number is required.'],
      validate: {
        validator: phoneValidator,
        message: 'Invalid phone number! Must be between 10 and 15 digits.',
      },
    },
    email: {
      type: String,
      required: [true, 'Email address is required.'], 
      validate: {
        validator: function (v) {
          return /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)+[a-zA-Z]{2,7})$/.test(v);
        },
        message: 'Invalid email address!',
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
  yearOfProduction: {
    type: Number,
    required: [true, 'Year of production is required.'], 
  },
  color: {
    type: String,
    required: [true, 'Color is required.'], 
  },
  typeOfCar: {
    type: String,
    required: [true, 'Car Types is required.'], 
  },
  interior: {
    type: String,
    required: [true, 'Interior description is required.'], 
  },
  numberOfSeats: {
    type: Number,
    required: [true, 'Number of seats is required.'], 
  },
  additionalAmenities: [
    {
      type: String,
      required: [true, 'Additional amenities are required.'], 
    },
  ],
  rentalPrice: {
    type: Number,
    required: [true, 'Rental price is required.'], 
  },
  location: {
    type: String,
    required: [true, 'Location is required.'], 
  },
  rentalDuration: {
    type: String,
    required: [true, 'Rental duration is required.'],
    enum: {
      values: ['hourly', 'daily', 'weekly', 'monthly'], 
      message: 'Rental duration must be one of the following: hourly, daily, weekly, monthly.',
    },
  },
  specialOptionsForWedding: [
    {
      type: String,
      required: [true, 'Special options for weddings are required.'], 
    },
  ],
  description: {
    type: String,
    required: [true, 'Description is required.'],
  },
  isVerified: {
    type: Boolean,
    required: false, 
    default: false,
  },
}, {
  timestamps: true, 
});

const carModel = mongoose.models.car || mongoose.model("car", carSchema);

export default carModel;

import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: [true, "Password is required"]
    },
    refreshToken: {
      type: String,
    },
    bio: {
    type: String,
    default: ""
  },
  skills: {
    type: [String],
    default: []
  },
  profilePic: {
    type: String,
    default: ""
  },
    
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;
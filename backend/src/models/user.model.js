import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: function() {
        return this.authProvider === 'local';
      },
    },
    authProvider: {
      type: String,
      enum: ['local', 'google'],
      default: 'local'
    },
    refreshToken: String,

    bio: {
      type: String,
      default: "",
    },
    skills: {
      type: [String],
      default: [],
    },
    profilePic: {
      type: String,
      default: "",
    },

    followers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    following: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);

userSchema.index({ username: "text", bio: "text", skills: "text" });

const User = mongoose.model("User", userSchema);
export default User;
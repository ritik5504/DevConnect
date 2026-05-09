import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import toast from "react-hot-toast";

const VerifyOTP = () => {
  const navigate = useNavigate();
  const [otp, setOtp] = useState("");

  const email = localStorage.getItem("email");

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await API.post("/auth/verify-otp", {
        email,
        otp,
      });

      toast.success("OTP verified");
      navigate("/");
    } catch (error) {
      toast.error(error.response?.data?.message || "OTP verification failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-xl shadow-lg w-96"
      >
        <h2 className="text-2xl font-bold mb-6 text-center">Verify OTP</h2>

        <input
          type="text"
          placeholder="Enter OTP"
          className="w-full p-3 border rounded mb-4"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
        />

        <button className="w-full bg-black text-white p-3 rounded">
          Verify OTP
        </button>
      </form>
    </div>
  );
};

export default VerifyOTP;
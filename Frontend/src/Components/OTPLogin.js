import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, RecaptchaVerifier, signInWithPhoneNumber } from "../firebaseConfig";
import ForkliftImage from "../Assets/ForkliftImage.png";
import axios from "axios"; // ✅ Import API requests
import "./OTPLogin.css";

const OTPLogin = ({ setUser }) => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handlePhoneChange = (e) => {
    setPhoneNumber(e.target.value.replace(/\D/g, "")); // ✅ Allow only numbers
  };

  const handleOtpChange = (e) => {
    setOtp(e.target.value.replace(/\D/g, ""));
  };

  const sendOTP = async () => {
    if (!phoneNumber || phoneNumber.length !== 10) {
      setError("❌ Enter a valid 10-digit phone number.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
          size: "invisible",
          callback: (response) => console.log("✅ reCAPTCHA Verified", response),
        });
        await window.recaptchaVerifier.render();
      }

      const appVerifier = window.recaptchaVerifier;
      const formattedPhoneNumber = `+91${phoneNumber}`;

      const confirmationResult = await signInWithPhoneNumber(auth, formattedPhoneNumber, appVerifier);
      window.confirmationResult = confirmationResult;

      setOtpSent(true);
      setLoading(false);
      console.log("✅ OTP Sent Successfully!");
    } catch (error) {
      console.error("❌ OTP Send Error:", error.code, error.message);
      setError(`❌ OTP Failed: ${error.message}`);
      setLoading(false);
    }
  };

  const verifyOTP = async () => {
    if (!otp) {
      setError("❌ Enter the OTP sent to your phone.");
      return;
    }

    try {
      if (!window.confirmationResult) {
        setError("❌ OTP expired. Please request a new one.");
        return;
      }

      const result = await window.confirmationResult.confirm(otp);
      const firebaseUid = result.user.uid; // ✅ Firebase UID (Not used in DB)

      // ✅ Fetch numeric user ID from Oracle SQL
      const userResponse = await axios.post(`http://144.11.1.83:5000/api/auth/verify-user`, {
        phone: phoneNumber,
      });

      if (!userResponse.data.success) {
        setError("❌ User not found in database.");
        return;
      }

      const user = {
        id: Number(userResponse.data.user.id), // ✅ Ensure userId is numeric
        phone: phoneNumber,
        role: userResponse.data.user.role,
      };

      setUser(user);
      localStorage.setItem("user", JSON.stringify(user));

      if (user.role === "Requester") navigate("/vehicle-selection");
      else if (user.role === "Driver") navigate("/driver");
      else if (user.role === "MaintenanceHead") navigate("/maintenance-head");
      else navigate("/requester");

      console.log("✅ OTP Verified Successfully! Numeric User ID:", user.id);
    } catch (error) {
      console.error("❌ OTP Verification Error:", error);
      setError("❌ Invalid OTP. Please try again.");
    }
  };

  return (
    <div className="otp-login-container">
      <img src={ForkliftImage} alt="Forklift" className="forklift-image" />
      <h2 className="otp-title">HELLO FORKS!</h2>

      <div className="otp-input-container">
        {otpSent ? (
          <>
            <input type="text" value={otp} onChange={handleOtpChange} placeholder="Enter OTP" maxLength={6} />
            <button onClick={verifyOTP}>Verify OTP</button>
          </>
        ) : (
          <>
            <input type="text" value={phoneNumber} onChange={handlePhoneChange} placeholder="Enter Phone Number" maxLength={10} />
            <button onClick={sendOTP} disabled={loading}>{loading ? "Sending..." : "Send OTP"}</button>
          </>
        )}
      </div>

      <div id="recaptcha-container"></div>

      {error && <p className="error-message">{error}</p>}
    </div>
  );
};

export default OTPLogin;

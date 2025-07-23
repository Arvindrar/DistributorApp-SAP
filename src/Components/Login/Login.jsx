import React, { useState } from "react";

import dist from "../../assets/dist.png";

import "./Login.css";

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });
  //const [message, setMessage] = useState("");
  //const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async () => {};

  return (
    <div className="login-container">
      <div className="login-content">
        <div className="image-container">
          {/* <img src={sapLogo} alt="Login Visual" className="login-image" /> */}
          <img src={dist} alt="Login Visual" className="login-image" />
        </div>
        <div className="login-card">
          <h2 className="text-center mb-4"> Login</h2>

          <form onSubmit={handleSubmit}>
            <input
              type="username"
              name="username"
              placeholder="User Name"
              value={formData.email}
              onChange={handleChange}
              className="form-control mb-3"
              required
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              className="form-control mb-3"
              required
            />
            <div className="form-check mb-3">
              {/* <input
              type="checkbox"
              name="rememberMe"
              checked={formData.rememberMe}
              onChange={handleChange}
              className="form-check-input"
              id="rememberMe"
            /> */}
              {/* <label className="form-check-label" htmlFor="rememberMe">
              Remember Me
            </label> */}
            </div>
            <button type="submit" className="btn btn-primary w-100 mb-3">
              Login
            </button>
          </form>
          <a href="" className="change-password">
            Change Password
          </a>
        </div>
      </div>
    </div>
  );
};

export default Login;

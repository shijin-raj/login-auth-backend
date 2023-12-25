const express = require("express");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const cookieParser = require('cookie-parser');
const cors = require('cors'); // Import the cors middleware
require('dotenv').config();
const userModel = require("./userModel");
const app = express();
const PORT = process.env.PORT;

const corsOptions = {
    origin: process.env.ORIGIN_URL,
    credentials: true, // Enable credentials (cookies, authorization headers, etc.)
  };

app.use(bodyParser.json());
app.use(cookieParser());
app.use(cors(corsOptions));



// Function to generate a JWT token
const generateAccessToken = (userId) => {
  return jwt.sign({ userId }, process.env.ACCESS_SECRET_KEY, { expiresIn: "15m" });
};

// Function to generate a refresh token
const generateRefreshToken = (userId) => {
  return jwt.sign({ userId }, process.env.REFRESH_SECRET_KEY, { expiresIn: "7d" });
};

// Middleware to verify the access token
const verifyAccessToken = (req, res, next) => {
    console.log(req);
  const accessToken = req.cookies.accessToken;

  if (!accessToken) {
    return res
      .status(401)
      .json({ message: "Access denied. No token provided." });
  }

  try {
    const decoded = jwt.verify(accessToken,process.env.ACCESS_SECRET_KEY);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid access token" });
  }
};
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  // Check if the user exists
  const user = userModel.findByUsername(username);

  if (!user || user.password !== password) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  // Generate tokens
  const accessToken = generateAccessToken(user.id);
  const refreshToken = generateRefreshToken(user.id);

  // Set cookies with tokens
  res.cookie("accessToken", accessToken, { httpOnly: true, sameSite: 'strict' });
  res.cookie("refreshToken", refreshToken, { httpOnly: true, sameSite: 'strict' });

  res.json({ message: "Login successful" });
});


// Route to refresh the access token using the refresh token
app.post("/refresh", (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ message: "No refresh token provided" });
  }

  // Verify the refresh token
  try {
    const decoded = jwt.verify(refreshToken,  process.env.REFRESH_SECRET_KEY);

    // Generate a new access token
    const newAccessToken = generateAccessToken(decoded.userId);

    // Set the new access token in a new cookie
    res.cookie("accessToken", newAccessToken, { httpOnly: true });

    res.json({ message: "Token refreshed successfully" });
  } catch (err) {
    res.status(401).json({ message: "Invalid refresh token" });
  }
});

// Example of a protected route
app.get("/protected", verifyAccessToken, (req, res) => {
    const data ={
        likes :10,
        comments:20,
        shares:100
    };
  res.json({ message: "This is a protected route", user: req.user ,data});
});

app.post("/loginCheck", verifyAccessToken, (req, res) => {
res.json({ message: "Login successful", user: req.user});
});



app.post('/logout', (req, res) => {
  // Expire the HTTP-only secure cookie

  // Check if the HTTP-only secure cookies exist
  const hasAccessToken = req.cookies.accessToken !== undefined;
  const hasRefreshToken = req.cookies.refreshToken !== undefined;

  // Clear the HTTP-only secure cookies if they exist
  if (hasAccessToken) {
    res.clearCookie('accessToken', { httpOnly: true, secure: true, sameSite: 'strict', path: '/' });
  }

  if (hasRefreshToken) {
    res.clearCookie('refreshToken', { httpOnly: true, secure: true, sameSite: 'strict', path: '/' });
  }
  // Send a response
  res.json({ message: "Logged out successfully"});
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

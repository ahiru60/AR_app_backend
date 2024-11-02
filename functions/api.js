const express = require("express");
const serverless = require("serverless-http");
const cors = require("cors");

const userController = require("../src/userController");
const authController = require("../src/authController");
const furnitureController = require("../src/furnitureController");
const threeDGSController = require("../src/threeDGSController");
const cartController = require("../src/cartController");

const app = express();

// Enable CORS for all routes
app.use(cors());

// Parse JSON bodies (replaces bodyParser.json())
app.use(express.json());

// Define routes
app.use("/.netlify/functions/api/users", userController);
app.use("/.netlify/functions/api/auth", authController);
app.use("/.netlify/functions/api/furniture", furnitureController);
app.use("/.netlify/functions/api/cart", cartController);
app.use("/.netlify/functions/api/3dgs", threeDGSController);

// Export the handler for serverless
module.exports.handler = serverless(app);

const express = require("express");
const serverless = require("serverless-http");
const bodyParser = require('body-parser');
const userController = require('../src/userController');
const authController = require('../src/authController');
const furnitureController = require('../src/furnitureController');

const app = express();
const router = express.Router();

app.use(bodyParser.json());

router.get('/users', userController);
router.get('/auth', authController);
router.get('/furniture', furnitureController);

app.use("/.netlify/functions/api", router);
module.exports.handler = serverless(app);

const express = require("express");
const serverless = require("serverless-http");
const bodyParser = require('body-parser');
const userController = require('../src/userController');
const authController = require('../src/authController');
const furnitureController = require('../src/furnitureController');

const app = express();
const router = express.Router();

app.use(bodyParser.json());

router.use('/users', userController);
router.use('/auth', authController);
router.use('/furniture', furnitureController);
router.use('/3dgs', threeDGSController);

app.use("/.netlify/functions/api", router);
module.exports.handler = serverless(app);

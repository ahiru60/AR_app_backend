const express = require("express");
const serverless = require("serverless-http");
const bodyParser = require('body-parser');
const userController = require('D:\sTUDY\Projects\Git_Rep\ar_furniture_app_api\src\authController.js');
const authController = require('D:\sTUDY\Projects\Git_Rep\ar_furniture_app_api\src\authController.js');
const furnitureController = require('D:\sTUDY\Projects\Git_Rep\ar_furniture_app_api\src\authController.js');

const app = express();
const router = express.Router();

app.use(bodyParser.json());

router.get('/users', userController);
router.get('/auth', authController);
router.get('/furniture', furnitureController);

app.use("/.netlify/functions/api", router);
module.exports.handler = serverless(app);

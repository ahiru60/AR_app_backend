const express = require('express');
const bodyParser = require('body-parser');
const userController = require('./userController');
const authController = require('./authController');
const furnitureController = require('./furnitureController');
const cors = require('cors');

const app = express();
const port = 3000;
// Enable CORS for all routes
app.use(cors());
app.use(bodyParser.json());

app.use('/users', userController);
app.use('/auth', authController);
app.use('/furniture', furnitureController);
app.use('/3dgs', threeDGSController);

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

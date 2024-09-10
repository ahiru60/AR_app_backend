const express = require('express');
const router = express.Router();
const axios = require('axios');
const fs = require('fs');

// Middleware to check for API key
const checkApiKey = (req, res, next) => {
  const apiKey = req.headers['authorization'];
  console.log(apiKey);
  if (!apiKey || !apiKey.startsWith('luma-api-key=')) {
    return res.status(401).json({ error: 'Invalid API key' });
  }
  req.apiKey = apiKey;
  next();
};

// Create capture
router.post('/capture', checkApiKey, async (req, res) => {
  //console.log(req.apiKey);
  try {
    // Making the POST request to the external API
    const response = await axios.post(
      'https://webapp.engineeringlumalabs.com/api/v2/capture',
      new URLSearchParams({
        title: `${req.body.title}`,          // Required parameter
        camModel: `${req.body.camModel}`,         // Optional: choose your desired camModel
        removeHumans: `${req.body.removeHumans}`        // Optional: set this to 'true' to remove humans
      }),
      {
        headers: {
          'Authorization': `${req.apiKey}`,  // Replace with your actual API key
          'Content-Type': 'application/x-www-form-urlencoded'   // Ensure proper encoding type
        }
      }
    );
    // { title: req.body.title,
    //   camModel: req.body.camModel,
    //   removeHumans: req.body.removeHumans
    //  },  // Body data
    // { 
    //   headers: { 'Authorization': req.apiKey }  // Headers
    // }

    // Send the response data from the external API back to the client
    res.json(response.data);

  } catch (error) {
    // Handle any errors, returning the status and data from the error response if available
    res.status(error.response?.status || 500).json(error.response?.data || { error: 'An error occurred' });
  }
});

// Upload capture
router.put('/upload', upload.single('file'), async (req, res) => {
  try {
    // Ensure the file and uploadUrl are present
    if (!req.file || !req.body.uploadUrl) {
      return res.status(400).json({ error: 'File or upload URL missing' });
    }

    // Create a FormData instance for axios to handle the multipart upload
    const form = new FormData();
    const filePath = path.join(__dirname, req.file.path); // Ensure correct path to the uploaded file
    form.append('file', fs.createReadStream(filePath)); // Append the file using a readable stream

    // Send the multipart request to the upload URL
    const response = await axios.put(req.body.uploadUrl, form, {
      headers: {
        ...form.getHeaders(), // Include multipart headers
      },
    });

    // Clean up the file after upload
    fs.unlinkSync(filePath); // Delete the temporary file

    // Send back the response received from the upload URL
    res.json(response.data);
  } catch (error) {
    // Log the error and respond with the appropriate error message
    console.error('Error during file upload:', error);
    res.status(error.response?.status || 500).json(error.response?.data || { error: 'An error occurred during file upload' });
  }
});

// Trigger capture
router.post('/capture/:slug', checkApiKey, async (req, res) => {
  try {
    const response = await axios.post(`https://webapp.engineeringlumalabs.com/api/v2/capture/${req.params.slug}`, 
      {},
      { headers: { 'Authorization': req.apiKey } }
    );
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: 'An error occurred' });
  }
});

// Update capture
router.put('/capture/:slug', checkApiKey, async (req, res) => {
  try {
    const response = await axios.put(`https://webapp.engineeringlumalabs.com/api/v2/capture/${req.params.slug}`, 
      req.body,
      { headers: { 'Authorization': req.apiKey } }
    );
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: 'An error occurred' });
  }
});

// Get a capture
router.get('/capture/:slug', checkApiKey, async (req, res) => {
  try {
    const response = await axios.get(`https://webapp.engineeringlumalabs.com/api/v2/capture/${req.params.slug}`, 
      { headers: { 'Authorization': req.apiKey } }
    );
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: 'An error occurred' });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const axios = require('axios');
const fs = require('fs');
const admin = require('firebase-admin');
const FormData = require('form-data');

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

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    storageBucket: 'your-firebase-bucket.appspot.com', // Replace with your bucket
  });
}

const bucket = admin.storage().bucket();

router.put('/upload', async (req, res) => {
  try {
    // Fetch the file from Firestore Storage by file path or name
    const file = bucket.file(req.body.filePath); // req.body.filePath contains the file name or path in Firebase Storage
    
    // Get a signed URL for the file (if needed for external access)
    const [url] = await file.getSignedUrl({
      action: 'read',
      expires: '03-17-2025', // Set an expiration date
    });

    // Create a FormData instance to handle multipart file upload
    const form = new FormData();
    form.append('file', url); // Pass the file URL as data

    // Send the PUT request with the file URL in form-data
    const response = await axios.put(req.body.uploadUrl, form, {
      headers: {
        ...form.getHeaders(), // Include form headers
      },
    });

    res.json(response.data); // Send the response back to the client
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(error.response?.status || 500).json(error.response?.data || { error: 'An error occurred' });
  }
});

// router.put('/upload', async (req, res) => {
//   try {
//     // Create a FormData instance to handle multipart file upload
//     const form = new FormData();
//     form.append('file', fs.createReadStream(req.body.filePath)); // Read the file and append to form

//     // Send the multipart request to the URL
//     const response = await axios.put(req.body.uploadUrl, form, {
//       headers: {
//         ...form.getHeaders(), // Include form headers
//       },
//     });

//     res.json(response.data);
//   } catch (error) {
//     res.status(error.response?.status || 500).json(error.response?.data || { error: 'An error occurred' });
//   }
// });

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

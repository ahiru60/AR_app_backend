const express = require('express');
const router = express.Router();
const axios = require('axios');
const fs = require('fs');

// Middleware to check for API key
const checkApiKey = (req, res, next) => {
  const apiKey = req.headers['authorization'];
  if (!apiKey || !apiKey.startsWith('luma-api-key=')) {
    return res.status(401).json({ error: 'Invalid API key' });
  }
  req.apiKey = process.env.LUMA_AI_API_KEY;
  next();
};

// Create capture
router.post('/capture', checkApiKey, async (req, res) => {
  try {
    const response = await axios.post('https://webapp.engineeringlumalabs.com/api/v2/capture', 
      { title: req.body.title },
      { 
        headers: { 'Authorization': req.apiKey },
        params: req.body
      }
    );
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: 'An error occurred' });
  }
});

// Upload capture
router.put('/upload', async (req, res) => {
  try {
    const fileContent = fs.readFileSync(req.body.filePath);
    const response = await axios.put(req.body.uploadUrl, fileContent, {
      headers: { 'Content-Type': 'text/plain' }
    });
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: 'An error occurred' });
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

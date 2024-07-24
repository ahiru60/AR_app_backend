const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// Function to replace strings in a file
function replaceStringsInFile(splat, callback) {
    const data = `<!DOCTYPE html>
    <html>
      <head>
        <script src='https://aframe.io/releases/1.4.2/aframe.min.js'></script>
        <script src='https://quadjr.github.io/aframe-gaussian-splatting/index.js'></script>
      </head>
      <body>
        <a-scene renderer='antialias: false' stats>
          <a-entity position='0 1.6 -2.0' animation='property: rotation; to: 0 360 0; dur: 10000; easing: linear; loop: true'>
            <a-sphere position='0 0 0.5' radius='0.5' color='#EF2D5E'></a-sphere>
            <a-sphere position='0 0 -0.5' radius='0.5' color='#EF2D5E'></a-sphere>
          </a-entity>
          <a-entity gaussian_splatting='src: `+splat+`;' rotation='0 0 0' position='0 1.5 -2'></a-entity>
        </a-scene>
      </body>
    </html>`;
    

        let updatedData = data;

        // Replace each string based on the replacements object
        for (const [oldString, newString] of Object.entries(replacements)) {
            const regex = new RegExp(oldString, 'g');
            updatedData = updatedData.replace(regex, newString);
        }

        fs.writeFile(filePath, updatedData, 'utf8', (err) => {
            if (err) {
                return callback(`Error writing file: ${err}`);
            }
            callback(null, 'File updated successfully.');
        });
    };


// Define a GET route for replacing strings
router.get('/', (req, res) => {
    const splat = 'https://huggingface.co/cakewalk/splat-data/resolve/main/train.splat';

    replaceStringsInFile(splat, (err, message) => {
        if (err) {
            return res.status(500).send(err);
        }
        res.send(message);
    });
});

module.exports = router; // Ensure the router is correctly exported

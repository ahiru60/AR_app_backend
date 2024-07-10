const express = require('express');
const router = express.Router();
const db = require('./db');
const fs = require('fs');
const path = require('path');


// Function to replace strings in a file
function replaceStringsInFile(filePath, replacements, callback) {
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            return callback(`Error reading file: ${err}`);
        }

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
    });
}

// Define a GET route for replacing strings
router.get('/', (req, res) => {
    const filePath = path.join(__dirname, 'src/resources/webViewer.html'); // Replace with your file path
    const replacements = {
        'splat or ply': 'https://huggingface.co/cakewalk/splat-data/resolve/main/train.splat'
    };

    replaceStringsInFile(filePath, replacements, (err, message) => {
        if (err) {
            return res.status(500).send(err);
        }
        res.send(message);
    });
});
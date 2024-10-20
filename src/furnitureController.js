const express = require('express');
const router = express.Router();
const db = require('./db');

// Get random products including the name of the user who created them
router.get('/', (req, res) => {
    const query = `
        SELECT f.*, GROUP_CONCAT(fi.ImageURL) AS imageURLs, av.slug, av.ModelURL, av.texturesURL, u.UserName
        FROM furniture f
        LEFT JOIN furnitureimages fi ON f.FurnitureId = fi.FurnitureId
        LEFT JOIN ar_visualization av ON f.FurnitureId = av.FurnitureID
        INNER JOIN furniture_user fu ON f.FurnitureId = fu.FurnitureID
        INNER JOIN users u ON fu.UserID = u.UserID
        GROUP BY f.FurnitureId
        ORDER BY RAND()
        LIMIT 10
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching random products:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }

        // Parse the concatenated image URLs into arrays
        const products = results.map(product => ({
            ...product,
            ImageURLs: product.imageURLs ? product.imageURLs.split(',') : [],
            CreatedBy: product.UserName // Include the name of the user who created the furniture
        }));

        res.json(products);
    });
});


// Get all products including the name of the user who created them
router.get('/all', (req, res) => {
    const query = `
        SELECT f.*, GROUP_CONCAT(fi.ImageURL) AS imageURLs, av.slug, av.ModelURL, av.texturesURL, u.UserName
        FROM furniture f
        LEFT JOIN furnitureimages fi ON f.FurnitureId = fi.FurnitureId
        LEFT JOIN ar_visualization av ON f.FurnitureId = av.FurnitureID
        INNER JOIN furniture_user fu ON f.FurnitureId = fu.FurnitureID
        INNER JOIN users u ON fu.UserID = u.UserID
        GROUP BY f.FurnitureId
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching all products:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }

        // Parse the concatenated image URLs into arrays
        const products = results.map(product => ({
            ...product,
            ImageURLs: product.imageURLs ? product.imageURLs.split(',') : [],
            CreatedBy: product.UserName // Add the name of the user who created the furniture
        }));

        res.json(products);
    });
});


// Get all products created by the logged-in user
router.get('/user-all/:userId', (req, res) => {
    //const userId = req.query.userId; // Assuming the UserID is passed as a query parameter
    const userId = req.params.userId;

    if (!userId) {
        return res.status(400).json({ error: 'UserID is required' });
    }

    const query = `
        SELECT f.*, GROUP_CONCAT(fi.ImageURL) AS imageURLs, av.slug, av.ModelURL, av.texturesURL
        FROM furniture f
        LEFT JOIN furnitureimages fi ON f.FurnitureId = fi.FurnitureId
        LEFT JOIN ar_visualization av ON f.FurnitureId = av.FurnitureID
        INNER JOIN furniture_user fu ON f.FurnitureId = fu.FurnitureID
        WHERE fu.UserID = ?
        GROUP BY f.FurnitureId
    `;

    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Error fetching user-specific products:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }

        // Parse the concatenated image URLs into arrays
        const products = results.map(product => ({
            ...product,
            ImageURLs: product.imageURLs ? product.imageURLs.split(',') : []
        }));

        res.json(products);
    });
});


// Get furnitures by name
router.get('/like-items/:name', (req, res) => {
    const name = req.params.name;
    console.log('Keyword:', name);

    const query = `
        SELECT f.*, GROUP_CONCAT(fi.ImageURL) AS imageURLs, av.slug, av.ModelURL, av.texturesURL
        FROM furniture f
        LEFT JOIN furnitureimages fi ON f.FurnitureId = fi.FurnitureId
        LEFT JOIN ar_visualization av ON f.FurnitureId = av.FurnitureID
        WHERE f.Name LIKE ?
        GROUP BY f.FurnitureId
    `;

    db.query(query, [`%${name}%`], (err, results) => {
        if (err) {
            console.error('Error fetching items by name:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }

        // Parse the concatenated image URLs into arrays
        const products = results.map(product => ({
            ...product,
            ImageURLs: product.imageURLs ? product.imageURLs.split(',') : []
        }));

        res.status(200).json(products);
    });
});

// Get furniture names matching keyword
router.get('/like-keywords/:keyword', (req, res) => {
    const keyword = req.params.keyword;
    console.log('Keyword:', keyword);

    const query = 'SELECT Name FROM furniture WHERE Name LIKE ?';

    db.query(query, [`%${keyword}%`], (err, results) => {
        if (err) {
            console.error('Error fetching furniture names:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
        res.status(200).json(results);
    });
});

// Get furniture by ID
router.get('/:id', (req, res) => {
    const furnitureId = req.params.id;

    const query = `
        SELECT f.*, GROUP_CONCAT(fi.ImageURL) AS imageURLs, av.slug, av.ModelURL, av.texturesURL
        FROM furniture f
        LEFT JOIN furnitureimages fi ON f.FurnitureId = fi.FurnitureId
        LEFT JOIN ar_visualization av ON f.FurnitureId = av.FurnitureID
        WHERE f.FurnitureID = ?
        GROUP BY f.FurnitureId
    `;

    db.query(query, [furnitureId], (err, results) => {
        if (err) {
            console.error('Error fetching furniture by ID:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: 'Furniture not found' });
        }

        const product = {
            ...results[0],
            ImageURLs: results[0].imageURLs ? results[0].imageURLs.split(',') : []
        };

        res.status(200).json(product);
    });
});

// Create a new furniture
router.post('/', (req, res) => {
    const furniture = req.body.furniture;
    const userId = req.body.userId; // Assuming the UserID is passed in the request body

    // Extract image URLs from the furniture object
    const imageUrls = [
        furniture.ImageUrl1,
        furniture.ImageUrl2,
        furniture.ImageUrl3
    ].filter(url => url && url.trim() !== '');

    // Remove image URLs from the furniture object
    delete furniture.ImageUrl1;
    delete furniture.ImageUrl2;
    delete furniture.ImageUrl3;

    // First, insert the furniture record into the 'furniture' table
    db.query('INSERT INTO furniture SET ?', furniture, (err, results) => {
        if (err) {
            console.error('Error inserting furniture:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }

        const furnitureId = results.insertId;

        // Now insert the relationship between user and furniture into 'furniture_user' table
        const furnitureUserQuery = 'INSERT INTO furniture_user (FurnitureID, UserID) VALUES (?, ?)';
        db.query(furnitureUserQuery, [furnitureId, userId], (err3, results3) => {
            if (err3) {
                console.error('Error inserting into furniture_user:', err3);
                return res.status(500).json({ error: 'Internal server error' });
            }

            // Insert the furniture images if they exist
            if (imageUrls.length > 0) {
                const imageRecords = imageUrls.map(url => [furnitureId, url]);
                const sql = 'INSERT INTO furnitureimages (FurnitureId, ImageURL) VALUES ?';

                db.query(sql, [imageRecords], (err2, results2) => {
                    if (err2) {
                        console.error('Error inserting furniture images:', err2);
                        return res.status(500).json({ error: 'Internal server error' });
                    }

                    res.status(201).json({ id: furnitureId });
                });
            } else {
                // If no images, just respond with the furniture ID 
                res.status(201).json({ id: furnitureId });
            }
        });
    });
});


// Update furniture details and images
router.put('/:id', (req, res) => {
    const furnitureId = req.params.id;
    const furniture = req.body;

    // Extract image URLs from the furniture object
    const imageUrls = [
        furniture.ImageUrl1,
        furniture.ImageUrl2,
        furniture.ImageUrl3
    ].filter(url => url && url.trim() !== '');

    // Remove image URLs from the furniture object
    delete furniture.ImageUrl1;
    delete furniture.ImageUrl2;
    delete furniture.ImageUrl3;

    db.query('UPDATE furniture SET ? WHERE FurnitureID = ?', [furniture, furnitureId], (err, results) => {
        if (err) {
            console.error('Error updating furniture:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }

        // Delete existing images for the furniture
        db.query('DELETE FROM furnitureimages WHERE FurnitureId = ?', [furnitureId], (err, results) => {
            if (err) {
                console.error('Error deleting old images:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }

            if (imageUrls.length > 0) {
                const imageRecords = imageUrls.map(url => [furnitureId, url]);
                const sql = 'INSERT INTO furnitureimages (FurnitureId, ImageURL) VALUES ?';

                db.query(sql, [imageRecords], (err2, results2) => {
                    if (err2) {
                        console.error('Error inserting new images:', err2);
                        return res.status(500).json({ error: 'Internal server error' });
                    }

                    res.json({ message: 'Furniture and images updated successfully' });
                });
            } else {
                res.json({ message: 'Furniture updated successfully (no images provided)' });
            }
        });
    });
});

// Delete furniture
router.delete('/:id', (req, res) => {
    const furnitureId = req.params.id;

    // Delete images associated with the furniture
    db.query('DELETE FROM furnitureimages WHERE FurnitureId = ?', [furnitureId], (err, results) => {
        if (err) {
            console.error('Error deleting images:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }

        // Delete the furniture
        db.query('DELETE FROM furniture WHERE FurnitureID = ?', [furnitureId], (err, results) => {
            if (err) {
                console.error('Error deleting furniture:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }

            res.json({ message: 'Furniture deleted successfully' });
        });
    });
});

module.exports = router;

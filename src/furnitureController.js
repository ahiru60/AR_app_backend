const express = require('express');
const router = express.Router();
const db = require('./db');

let lastFetchedProducts = [];

router.get('/', (req, res) => {
    // Construct the query based on whether lastFetchedProducts has valid entries
    let query;
    if (lastFetchedProducts.length > 0) {
        // Ensure lastFetchedProducts only contains valid numeric IDs
        const validIds = lastFetchedProducts.filter(id => Number.isInteger(id) && id > 0);
        if (validIds.length > 0) {
            query = `
                SELECT f.*, GROUP_CONCAT(fi.ImageURL) AS imageURLs, av.slug, av.ModelURL, av.texturesURL
                FROM furniture f
                LEFT JOIN furnitureimages fi ON f.FurnitureId = fi.FurnitureId
                LEFT JOIN ar_visualization av ON f.FurnitureId = av.FurnitureID
                WHERE f.furniture_id NOT IN (${validIds.join(',')})
                GROUP BY f.FurnitureId
                ORDER BY RAND() 
                LIMIT 10
            `;
        } else {
            query = `
                SELECT f.*, GROUP_CONCAT(fi.ImageURL) AS imageURLs, av.slug, av.ModelURL, av.texturesURL
                FROM furniture f
                LEFT JOIN furnitureimages fi ON f.FurnitureId = fi.FurnitureId
                LEFT JOIN ar_visualization av ON f.FurnitureId = av.FurnitureID
                GROUP BY f.FurnitureId
                ORDER BY RAND() 
                LIMIT 10
            `;
        }
    } else {
        query = `
            SELECT f.*, GROUP_CONCAT(fi.ImageURL) AS imageURLs, av.slug, av.ModelURL, av.texturesURL
            FROM furniture f
            LEFT JOIN furnitureimages fi ON f.FurnitureId = fi.FurnitureId
            LEFT JOIN ar_visualization av ON f.FurnitureId = av.FurnitureID
            GROUP BY f.FurnitureId
            ORDER BY RAND() 
            LIMIT 10
        `;
    }

    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ error: err });
        }

        // Update the lastFetchedProducts array with the current fetched product IDs
        lastFetchedProducts = results.map(product => product.furniture_id);

        // Parse the concatenated image URLs into arrays
        results = results.map(product => ({
            ...product,
            ImageURLs: product.imageURLs ? product.imageURLs.split(',') : []
        }));

        res.json(results);
    });
});


// Get all products
router.get('/all', (req, res) => {
    // Construct the query based on whether lastFetchedProducts has valid entries
    let query;
    if (lastFetchedProducts.length > 0) {
        // Ensure lastFetchedProducts only contains valid numeric IDs
        const validIds = lastFetchedProducts.filter(id => Number.isInteger(id) && id > 0);
        if (validIds.length > 0) {
            query = `
                SELECT f.*, GROUP_CONCAT(fi.ImageURL) AS imageURLs, av.slug, av.ModelURL, av.texturesURL
                FROM furniture f
                LEFT JOIN furnitureimages fi ON f.FurnitureId = fi.FurnitureId
                LEFT JOIN ar_visualization av ON f.FurnitureId = av.FurnitureID
                WHERE f.FurnitureId NOT IN (${validIds.join(',')})
                GROUP BY f.FurnitureId
            `;
        } else {
            query = `
                SELECT f.*, GROUP_CONCAT(fi.ImageURL) AS imageURLs, av.slug, av.ModelURL, av.texturesURL
                FROM furniture f
                LEFT JOIN furnitureimages fi ON f.FurnitureId = fi.FurnitureId
                LEFT JOIN ar_visualization av ON f.FurnitureId = av.FurnitureID
                GROUP BY f.FurnitureId
            `;
        }
    } else {
        query = `
            SELECT f.*, GROUP_CONCAT(fi.ImageURL) AS imageURLs, av.slug, av.ModelURL, av.texturesURL
            FROM furniture f
            LEFT JOIN furnitureimages fi ON f.FurnitureId = fi.FurnitureId
            LEFT JOIN ar_visualization av ON f.FurnitureId = av.FurnitureID
            GROUP BY f.FurnitureId
        `;
    }

    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ error: err });
        }

        // Update the lastFetchedProducts array with the current fetched product IDs
        lastFetchedProducts = results.map(product => product.FurnitureId);

        // Parse the concatenated image URLs into arrays
        results = results.map(product => ({
            ...product,
            ImageURLs: product.imageURLs ? product.imageURLs.split(',') : []
        }));

        res.json(results);
    });
});




// Get furnitures by name

// router.get('/like-items/:name', (req, res) => {
//     const name = req.params.name;
//     console.log("Keyword:", name); 

//     const query = `
//         SELECT f.*, GROUP_CONCAT(fi.ImageURL) AS imageURLs
//         FROM furniture f
//         LEFT JOIN furnitureimages fi ON f.FurnitureId = fi.FurnitureId
//         WHERE f.Name LIKE ?
//     `;

//     db.query(query, ["%" + name + "%"], (err, results) => {
//         if (err) {
//             return res.status(500).json({ error: err });
//         }

//         // Parse the concatenated image URLs into arrays
//         results = results.map(product => ({
//             ...product,
//             ImageURLs: product.imageURLs ? product.imageURLs.split(',') : []
//         }));

//         res.status(200).json(results);
//     });
// });
router.get('/like-items/:name', (req, res) => {
    const name = req.params.name;
    console.log("Keyword:", name);

    const query = `
        SELECT f.*, GROUP_CONCAT(fi.ImageURL) AS imageURLs, av.slug, av.ModelURL, av.texturesURL
        FROM furniture f
        LEFT JOIN furnitureimages fi ON f.FurnitureId = fi.FurnitureId
        LEFT JOIN ar_visualization av ON f.FurnitureId = av.FurnitureID
        WHERE f.Name LIKE ?
        GROUP BY f.FurnitureId
    `;

    db.query(query, ["%" + name + "%"], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err });
        }

        // Parse the concatenated image URLs into arrays
        results = results.map(product => ({
            ...product,
            ImageURLs: product.imageURLs ? product.imageURLs.split(',') : []
        }));

        res.status(200).json(results);
    });
});


// Get all furniture names

router.get('/like-keywords/:keyword', (req, res) => {
    const keyword = req.params.keyword;
    console.log("Keyword:", keyword); 
    db.query('SELECT Name FROM furniture WHERE Name LIKE ?', ["%"+keyword+"%"], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err });
        }
        res.status(200).json(results);
    });
});

// Get furniture by ID
router.get('/:id', (req, res) => {
    const furnitureId = req.params.id;
    db.query('SELECT * FROM furniture WHERE FurnitureID = ?', [furnitureId], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err });
        }
        res.status(200).json(results[0]);
    });
});

// Create a new furniture
router.post('/', (req, res) => {
    const furniture = req.body;
    db.query('INSERT INTO furniture SET ?', furniture, (err, results) => {
        if (err) {
            return res.status(500).json({ error: err });
        }
        res.status(201).json({ id: results.insertId });
    });
});

// Update furniture details and images
router.put('/:id', (req, res) => {
    const furnitureId = req.params.id;
    const furniture = req.body;

    // Check if any of the image URLs are provided (not empty)
    const imageUrls = [furniture.ImageUrl1, furniture.ImageUrl2, furniture.ImageUrl3].filter(url => url && url.trim() !== '');
    delete furniture.ImageUrl1;
    delete furniture.ImageUrl2;
    delete furniture.ImageUrl3;
    // Start transaction
    db.beginTransaction(err => {
        if (err) {
            return res.status(500).json({ error: err });
        }

        // First query: Update furniture details in the 'furniture' table
        db.query('UPDATE furniture SET ? WHERE FurnitureID = ?', [furniture, furnitureId], (err, results) => {
            if (err) {
                return db.rollback(() => {
                    return res.status(500).json({ error: err });
                });
            }

            // Check if image URLs should be updated
            if (imageUrls.length > 0) {
                // Concatenate the provided image URLs into a single string
                const imageUrlString = imageUrls.join(',');

                // Second query: Update images in the 'furnitureimages' table
                const updateImagesQuery = 'UPDATE furnitureimages SET ImageURL = ? WHERE FurnitureId = ?';
                db.query(updateImagesQuery, [imageUrlString, furnitureId], (err, imageResults) => {
                    if (err) {
                        return db.rollback(() => {
                            return res.status(500).json({ error: err });
                        });
                    }

                    // Commit the transaction if both queries succeed
                    db.commit(err => {
                        if (err) {
                            return db.rollback(() => {
                                return res.status(500).json({ error: err });
                            });
                        }
                        res.json({
                            message: 'Furniture and images updated successfully',
                            affectedRows: results.affectedRows + imageResults.affectedRows
                        });
                    });
                });
            } else {
                // If no image URLs are provided, commit the furniture update
                db.commit(err => {
                    if (err) {
                        return db.rollback(() => {
                            return res.status(500).json({ error: err });
                        });
                    }
                    res.json({
                        message: 'Furniture updated successfully (no image URLs provided)',
                        affectedRows: results.affectedRows
                    });
                });
            }
        });
    });
});

// // Update furniture
// router.put('/:id', (req, res) => {
//     const furnitureId = req.params.id;
//     const furniture = req.body;
//     db.query('UPDATE furniture SET ? WHERE FurnitureID = ?', [furniture, furnitureId], (err, results) => {
//         if (err) {
//             return res.status(500).json({ error: err });
//         }
//         res.json({ affectedRows: results.affectedRows });
//     });
// });

// Delete furniture
router.delete('/:id', (req, res) => {
    const furnitureId = req.params.id;
    db.query('DELETE FROM furniture WHERE FurnitureID = ?', [furnitureId], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err });
        }
        res.json({ affectedRows: results.affectedRows });
    });
});

module.exports = router;

const express = require('express');
const router = express.Router();
const db = require('./db');

// Helper function to log user interactions
const logUserInteraction = (userId, actionDescription) => {
    const logQuery = 'INSERT INTO user_logs (UserID, ActionDescription) VALUES (?, ?)';
    db.query(logQuery, [userId, actionDescription], (err) => {
        if (err) {
            console.error('Error logging user interaction:', err);
        }
    });
};
router.post('/log-view', (req, res) => {
    const { UserID, Message } = req.body;

    // Check if required fields are provided
    if (!UserID || !Message) {
        return res.status(400).json({ message: 'UserID and Message are required' });
    }

    // Log the product view in the user_logs table
    logUserInteraction(UserID, Message);

    // Send a success response
    res.status(200).json({ message: 'Product view logged successfully' });
});

// Get random products including the name of the user who created them
router.get('/:userId', (req, res) => {
    const userId = req.params.userId; 

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
        console.log(userId)
        if(userId !== "0"){
            // Log detailed user interaction (e.g., "Viewed random products")
        logUserInteraction(userId, 'Viewed random furniture products');
        }

        const products = results.map(product => ({
            ...product,
            ImageURLs: product.imageURLs ? product.imageURLs.split(',') : [],
            CreatedBy: product.UserName
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

        // Log user interaction (e.g., "Viewed all products")
        logUserInteraction(req.query.userId, 'Viewed all furniture products');

        const products = results.map(product => ({
            ...product,
            ImageURLs: product.imageURLs ? product.imageURLs.split(',') : [],
            CreatedBy: product.UserName
        }));

        res.json(products);
    });
});

// Get all products created by the logged-in user
router.get('/user-all/:userId', (req, res) => {
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

        // Log user interaction (e.g., "Viewed own products")
        logUserInteraction(userId, `Viewed own furniture products`);

        const products = results.map(product => ({
            ...product,
            ImageURLs: product.imageURLs ? product.imageURLs.split(',') : []
        }));

        res.json(products);
    });
});

// Get furnitures by name, including user data related to the furniture 
router.get('/like-items/:userId/:name', (req, res) => {
    const { userId, name } = req.params;

    const query = `
        SELECT f.*, GROUP_CONCAT(fi.ImageURL) AS imageURLs, av.slug, av.ModelURL, av.texturesURL, 
               u.UserID, u.Name as Username, u.Email
        FROM furniture f
        LEFT JOIN furnitureimages fi ON f.FurnitureId = fi.FurnitureId
        LEFT JOIN ar_visualization av ON f.FurnitureId = av.FurnitureID
        INNER JOIN furniture_user fu ON f.FurnitureId = fu.FurnitureID
        INNER JOIN users u ON fu.UserID = u.UserID
        WHERE f.Name LIKE ?
        GROUP BY f.FurnitureId
    `;

    db.query(query, [`%${name}%`], (err, results) => {
        if (err) {
            console.error('Error fetching items by name:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }

        // Log user interaction (e.g., "Searched for furniture with name [Name]")
        logUserInteraction(userId, `Searched for furniture with name ${name}`);

        const products = results.map(product => ({
            ...product,
            ImageURLs: product.imageURLs ? product.imageURLs.split(',') : [],
            CreatedBy: {
                UserID: product.UserID,
                UserName: product.UserName,
                Email: product.Email
            }
        }));

        res.status(200).json(products);
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

        // Log user interaction (e.g., "Viewed furniture [FurnitureID]")
        logUserInteraction(req.query.userId, `Viewed furniture with ID ${furnitureId}`);

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

        // Log detailed user interaction (e.g., "Created furniture [FurnitureName]")
        logUserInteraction(userId, `Created furniture ${furniture.Name}`);

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
                res.status(201).json({ id: furnitureId });
            }
        });
    });
});

// Update furniture details and images
router.put('/:id', (req, res) => {
    const furnitureId = req.params.id;
    const furniture = req.body;
    const userId = req.body.userId; // Assuming the UserID is passed in the request body

    // Log detailed user interaction (e.g., "Updated furniture [FurnitureName]")
   // logUserInteraction(userId, `Updated furniture ${furniture.Name}`);

    // Continue with update logic...
    // ...
});

// Delete furniture
router.delete('/:id', (req, res) => { 
    const furnitureId = req.params.id;
    const userId = req.query.userId; // Assuming the UserID is passed in the query

    // Log detailed user interaction (e.g., "Deleted furniture [FurnitureID]")
    logUserInteraction(userId, `Deleted furniture with ID ${furnitureId}`);

    // Continue with delete logic...
    // ...
});
// Route to get ar_visualization record by FurnitureID
router.get('/ar-visualization/:furnitureId', (req, res) => {
    const furnitureId = req.params.furnitureId;

    const query = `
        SELECT *
        FROM ar_visualization
        WHERE FurnitureID = ?
    `;

    db.query(query, [furnitureId], (err, results) => {
        if (err) {
            console.error('Error fetching AR visualization record:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: 'AR visualization record not found' });
        }

        res.status(200).json(results[0]);
    });
});


module.exports = router;

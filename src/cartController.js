const express = require('express');
const router = express.Router();
const db = require('./db');
// Get item by id
router.post('/item', (req, res) => {
    const item= req.body;
    console.log("res:", req.body); 
    db.query('INSERT INTO cart_items SET ?',[item],(err, results) => {
        if (err){
            return res.status(500).json({ error: err });
        }
        res.status(200).json(results);
    });
});

router.post('/items', (req, res) => {
    const user = req.body; // Expecting an object with userID
    console.log("Received user:", user);
  
    // Function to handle fatal errors
    const handleFatalError = (err, message) => {
      console.error(message, err);
      return res.status(500).send('Server error');
    };
  
    // Start a transaction
    db.beginTransaction((err) => {
      if (err) {
        return handleFatalError(err, 'Error starting transaction');
      }
  
      const query = `
        SELECT ci.CartItemID, ci.CartID, ci.Quantity, ci.Price, 
               f.FurnitureID, f.Name, f.Description, f.Price AS FurniturePrice, f.Rating, f.Category, 
               f.StockQuantity, f.Material, f.Dimensions, f.Weight, 
               GROUP_CONCAT(fi.ImageURL) AS ImageURLs
        FROM cart_items ci
        JOIN furniture f ON ci.FurnitureID = f.FurnitureID
        JOIN carts c ON ci.CartID = c.CartID
        LEFT JOIN furnitureimages fi ON f.FurnitureID = fi.FurnitureID
        WHERE c.UserID = ?
        GROUP BY ci.CartItemID
      `;
  
      // Query to get the cart items and furniture details
      db.query(query, [user.UserID], (error, results) => {
        if (error) {
          return db.rollback(() => handleFatalError(error, 'Error executing query'));
        }
  
        if (results.length === 0) {
          return db.rollback(() => res.status(404).send('No cart items found for the user'));
        }
  
        // Process ImageURLs into an array
        const processedResults = results.map(item => ({
          ...item,
          ImageURLs: item.ImageURLs ? item.ImageURLs.split(',') : []
        }));
  
        // Commit the transaction
        db.commit((err) => {
          if (err) {
            return db.rollback(() => handleFatalError(err, 'Error committing transaction'));
          }
  
          // Send the cart items along with furniture and image details as the response
          res.json(processedResults);
        });
      });
    });
  });
  


    // router.delete('/item/:id', (req, res) => {
    //     const itemId = req.params.id;
    //     db.query('DELETE FROM cart_items WHERE ItemID = ?', [itemId], (err, results) => {
    //         if (err) {
    //             return res.status(500).json({ error: err });
    //         }
    //         if (results.affectedRows === 0) {
    //             return res.status(404).json({ message: 'Item not found' });
    //         }
    //         res.status(200).json({ message: 'Item deleted successfully' });
    //     });
    // });
    
    // Delete multiple items from the cart
    router.post('/delete', (req, res) => {
      const items = req.body; // Expecting an array of item IDs
      console.log("items:", items);
  
      if (!Array.isArray(items) || items.length === 0) {
          return res.status(400).json({ message: 'Invalid input' });
      }
  
      let deletionPromises = items.map((item) => {
          return new Promise((resolve, reject) => {
              db.query('DELETE FROM cart_items WHERE CartID = ? AND CartItemID = ?', [item.CartID, item.CartItemID], (err, results) => {
                  if (err) {
                      reject(err);
                  } else {
                      resolve(results.affectedRows);
                  }
              });
          });
      });
  
      Promise.all(deletionPromises)
          .then((affectedRowsArray) => {
              const totalDeleted = affectedRowsArray.reduce((acc, curr) => acc + curr, 0);
              console.log('suc',{ message: 'Items deleted successfully', totalDeleted })
              res.status(200).json({ message: 'Items deleted successfully', totalDeleted });
          })
          .catch((err) => {
              res.status(500).json({ error: err });
          });
  });
  
    

// router.post('/', (req, res) => {
//     const userId = req.body;
//     console.log("userID:", userId); 
//     db.query('SELECT * FROM cart_items WHERE Name = (SELECT CartID FROM cart WHERE userID = ?)', [userId], (err, results) => {
//         if (err){
//             return res.status(500).json({ error: err });
//         }
//         res.status(200).json(results);
//     });
// });

module.exports = router;

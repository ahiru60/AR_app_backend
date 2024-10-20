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
  const user = req.body; // Expecting an array of items
  console.log("Received user:", user);

  db.beginTransaction((err) => {
      if (err) {
          console.error('Error starting transaction', err);
          return res.status(500).send('Server error');
      }

      // SQL query to get CartItems, Furniture details, and all ImageURLs from furniture_images
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

      db.query(query, [user.UserID], (error, results) => {
          if (error) {
              return db.rollback(() => {
                  console.error('Error executing query', error);
                  res.status(500).send('Server error');
              });
          }

          if (results.length === 0) {
              return db.rollback(() => {
                  res.status(404).send('No cart items found for the user');
              });
          }

          // Process ImageURLs into an array
          const processedResults = results.map(item => ({
              ...item,
              ImageURLs: item.ImageURLs ? item.ImageURLs.split(',') : []
          }));

          db.commit((err) => {
              if (err) {
                  return db.rollback(() => {
                      console.error('Error committing transaction', err);
                      res.status(500).send('Server error');
                  });
              }

              // Send the cart items along with furniture and image details as the response
              res.json(processedResults);
          });
      });
  });
});


    
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
router.post('/place-order', (req, res) => {
    const { UserID, TotalAmount, ShippingAddress, PaymentMethod, items } = req.body;
    
    // Check if required fields are present
    if (!UserID || !TotalAmount || !ShippingAddress || !PaymentMethod || !items || items.length === 0) {
        return res.status(400).json({ message: 'Missing required fields or no items provided' });
    }

    // Start the transaction
    db.beginTransaction((err) => {
        if (err) {
            console.error('Error starting transaction', err);
            return res.status(500).send('Server error');
        }

        // Insert into orders table
        const orderQuery = 'INSERT INTO orders (UserID, OrderDate, TotalAmount, ShippingAddress, PaymentMethod) VALUES (?, NOW(), ?, ?, ?)';
        db.query(orderQuery, [UserID, TotalAmount, ShippingAddress, PaymentMethod], (err, result) => {
            if (err) {
                return db.rollback(() => {
                    console.error('Error inserting into orders', err);
                    res.status(500).send('Server error');
                });
            }

            const OrderID = result.insertId; // Get the inserted order's ID

            // Insert each item into order_details table
            const orderDetailsPromises = items.map((item) => {
                return new Promise((resolve, reject) => {
                    const orderDetailQuery = 'INSERT INTO order_details (OrderID, FurnitureID, Quantity, Price) VALUES (?, ?, ?, ?)';
                    db.query(orderDetailQuery, [OrderID, item.FurnitureID, item.Quantity, item.Price], (err, results) => {
                        if (err) {
                            return reject(err);
                        }
                        resolve(results);
                    });
                });
            });

            // Wait for all order details to be inserted
            Promise.all(orderDetailsPromises)
                .then(() => {
                    // Commit the transaction
                    db.commit((err) => {
                        if (err) {
                            return db.rollback(() => {
                                console.error('Error committing transaction', err);
                                res.status(500).send('Server error');
                            });
                        }

                        res.status(200).json({ message: 'Order placed successfully', OrderID });
                    });
                })
                .catch((err) => {
                    // Rollback in case of any error
                    db.rollback(() => {
                        console.error('Error inserting order details', err);
                        res.status(500).send('Server error');
                    });
                });
        });
    });
});


module.exports = router;

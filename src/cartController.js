const express = require('express');
const router = express.Router();
const db = require('./db');

// Helper function to log interactions
const logUserInteraction = (userId, actionDescription) => {
    const logQuery = 'INSERT INTO user_logs (UserID, ActionDescription) VALUES (?, ?)';
    db.query(logQuery, [userId, actionDescription], (err) => {
        if (err) {
            console.error('Error logging user interaction:', err);
        }
    });
};

// Add items to cart
router.post('/item', (req, res) => {
    const item = req.body;
    console.log("res:", req.body);
    
    db.query('INSERT INTO cart_items SET ?', [item], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err });
        }
        
        // Log user interaction
        //logUserInteraction(item.UserID, 'Added item to cart');
        
        res.status(200).json(results);
    });
});

// Fetch all cart items for the user
router.post('/items', (req, res) => {
    const user = req.body; // Expecting an array of items
    console.log("Received user:", user);

    db.beginTransaction((err) => {
        if (err) {
            console.error('Error starting transaction', err);
            return res.status(500).send('Server error');
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

                
                res.json(processedResults);
            });
        });
    });
});

// Fetch user orders
router.post('/get-orders', (req, res) => {
    const { UserID } = req.body;

    if (!UserID) {
        return res.status(400).json({ message: 'UserID is required' });
    }

    const query = `
        SELECT 
            o.OrderID, o.UserID, o.OrderDate, o.TotalAmount, o.ShippingAddress, o.PaymentMethod,
            od.OrderDetailsID, od.FurnitureID, od.Quantity, od.Price AS Price, 
            f.Name AS Name, f.Description AS Description
        FROM orders o
        JOIN order_details od ON o.OrderID = od.OrderID
        JOIN furniture f ON od.FurnitureID = f.FurnitureID
        WHERE o.UserID = ?
        ORDER BY o.OrderDate DESC
    `;

    db.query(query, [UserID], (err, results) => {
        if (err) {
            console.error('Error fetching orders:', err);
            return res.status(500).json({ error: 'Server error' });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: 'No orders found for this user' });
        }

        const orders = {};
        results.forEach(row => {
            const orderID = row.OrderID;

            if (!orders[orderID]) {
                orders[orderID] = {
                    OrderID: row.OrderID,
                    UserID: row.UserID,
                    OrderDate: row.OrderDate,
                    TotalAmount: row.TotalAmount,
                    ShippingAddress: row.ShippingAddress,
                    PaymentMethod: row.PaymentMethod,
                    items: []
                };
            }

            orders[orderID].items.push({
                OrderDetailsID: row.OrderDetailsID,
                FurnitureID: row.FurnitureID,
                Name: row.Name,
                Description: row.Description,
                Quantity: row.Quantity,
                ItemPrice: row.ItemPrice
            });
        });

        const ordersArray = Object.values(orders);

        res.status(200).json(ordersArray);
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
            
            
            res.status(200).json({ message: 'Items deleted successfully', totalDeleted });
        })
        .catch((err) => {
            res.status(500).json({ error: err });
        });
});

// Place an order
router.post('/place-order', (req, res) => {
    const { UserID, TotalAmount, ShippingAddress, PaymentMethod, items } = req.body;
    
    if (!UserID || !TotalAmount || !ShippingAddress || !PaymentMethod || !items || items.length === 0) {
        return res.status(400).json({ message: 'Missing required fields or no items provided' });
    }

    db.beginTransaction((err) => {
        if (err) {
            console.error('Error starting transaction', err);
            return res.status(500).send('Server error');
        }

        const orderQuery = 'INSERT INTO orders (UserID, OrderDate, TotalAmount, ShippingAddress, PaymentMethod) VALUES (?, NOW(), ?, ?, ?)';
        db.query(orderQuery, [UserID, TotalAmount, ShippingAddress, PaymentMethod], (err, result) => {
            if (err) {
                return db.rollback(() => {
                    console.error('Error inserting into orders', err);
                    res.status(500).send('Server error');
                });
            }

            const OrderID = result.insertId;

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

            Promise.all(orderDetailsPromises)
                .then(() => {
                    db.commit((err) => {
                        if (err) {
                            return db.rollback(() => {
                                console.error('Error committing transaction', err);
                                res.status(500).send('Server error');
                            });
                        }

                        // Log user interaction
                        logUserInteraction(UserID, 'Placed an order orderId:'+OrderID);

                        res.status(200).json({ message: 'Order placed successfully', OrderID });
                    });
                })
                .catch((err) => {
                    db.rollback(() => {
                        console.error('Error inserting order details', err);
                        res.status(500).send('Server error');
                    });
                });
        });
    });
});

module.exports = router;

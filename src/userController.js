const express = require('express');
const router = express.Router();
const db = require('./db');
const bcrypt = require('bcrypt');

// Get all users
router.get('/', (req, res) => {
    db.query('SELECT * FROM users', (err, results) => {
        if (err) {
            return res.status(500).json({ error: err });
        }
        res.json(results);
    });
});

// Get user by ID
router.get('/:id', (req, res) => {
    const userId = req.params.id;
    db.query('SELECT * FROM users WHERE UserID = ?', [userId], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err });
        }
        res.json(results[0]);
    });
});

// Get user by email
router.get('/email/:email', (req, res) => {
    const userEmail = req.params.email;
    db.query('SELECT * FROM users WHERE Email = ?', [userEmail], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err });
        }
        res.json(results[0]);
    });
});



// Create a new user and update user roles
router.post('/', (req, res) => {
    const user = req.body;
    console.log("registration route");
    // Check if the user object contains all necessary fields
    if (!user.name || !user.email || !user.password || !user.role) {
        console.log("invalid inputs");
        return res.status(400).json({ error: 'Missing required fields' });
    }

    db.beginTransaction(err => {
        if (err) {
            console.log(err);
            return res.status(500).json({ error: err });
        }

        db.query('INSERT INTO users SET ?', user, (err, results) => {
            if (err) {
                return db.rollback(() => {
                    console.log(err);
                    res.status(500).json({ error: err });
                });
            }

            const userId = results.insertId;
            const userRole = { UserID: userId, Role: user.role };

            db.query('INSERT INTO user_roles SET ?', userRole, (err, results) => {
                if (err) {
                    return db.rollback(() => {
                        console.log(err);
                        res.status(500).json({ error: err });
                    });
                }

                const cart = { UserID: userId}; // Adjust this object to match your table's structure

                db.query('INSERT INTO carts SET ?', cart, (err, results) => {
                    if (err) {
                        return db.rollback(() => {
                            console.log(err);
                            res.status(500).json({ error: err });
                        });
                    }

                    db.commit(err => {
                        if (err) {
                            return db.rollback(() => {
                                console.log(err);
                                res.status(500).json({ error: err });
                            });
                        }
                        console.log("success");
                        res.status(201).json({ id: userId });
                    });
                });
            });
        });
    });
});


// Update a user
router.put('/:id', (req, res) => {
    const userId = req.params.id;
    const user = req.body;

    db.beginTransaction(err => {
        if (err) {
            return res.status(500).json({ error: err });
        }

        db.query('UPDATE users SET ? WHERE UserID = ?', [user, userId], (err, results) => {
            if (err) {
                return db.rollback(() => {
                    res.status(500).json({ error: err });
                });
            }

            db.commit(err => {
                if (err) {
                    return db.rollback(() => {
                        res.status(500).json({ error: err });
                    });
                }
                res.json({ affectedRows: results.affectedRows });
            });
        });
    });
});

// Delete a user
router.delete('/:id', (req, res) => {
    const userId = req.params.id;

    db.beginTransaction(err => {
        if (err) {
            return res.status(500).json({ error: err });
        }

        db.query('DELETE FROM users WHERE UserID = ?', [userId], (err, results) => {
            if (err) {
                return db.rollback(() => {
                    res.status(500).json({ error: err });
                });
            }

            db.query('DELETE FROM user_roles WHERE UserID = ?', [userId], (err, results) => {
                if (err) {
                    return db.rollback(() => {
                        res.status(500).json({ error: err });
                    });
                }

                db.commit(err => {
                    if (err) {
                        return db.rollback(() => {
                            res.status(500).json({ error: err });
                        });
                    }
                    res.json({ affectedRows: results.affectedRows });
                });
            });
        });
    });
});

module.exports = router;

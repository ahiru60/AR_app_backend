const express = require('express');
const router = express.Router();
const db = require('./db');

// Get all furniture
let lastFetchedProducts = [];

router.get('/', (req, res) => {
    // Construct the query based on whether lastFetchedProducts has valid entries
    let query;
    if (lastFetchedProducts.length > 0) {
        // Ensure lastFetchedProducts only contains valid numeric IDs
        const validIds = lastFetchedProducts.filter(id => Number.isInteger(id) && id > 0);
        if (validIds.length > 0) {
            query = `SELECT * FROM furniture WHERE id NOT IN (${validIds.join(',')}) ORDER BY RAND() LIMIT 10`;
        } else {
            query = 'SELECT * FROM furniture ORDER BY RAND() LIMIT 10';
        }
    } else {
        query = 'SELECT * FROM furniture ORDER BY RAND() LIMIT 10';
    }

    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ error: err });
        }

        // Update the lastFetchedProducts array with the current fetched product IDs
        lastFetchedProducts = results.map(product => product.id);

        res.json(results);
    });
});

// Get all furniture names

router.post('/like/', (req, res) => {
    const keyword = req.body.keyword;
    db.query('SELECT Name FROM furniture WHERE Name LIKE ?', ["%"+keyword+"%"], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err });
        }
        res.json(results);
    });
});

// Get furniture by ID
router.get('/:id', (req, res) => {
    const furnitureId = req.params.id;
    db.query('SELECT * FROM furniture WHERE FurnitureID = ?', [furnitureId], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err });
        }
        res.json(results[0]);
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

// Update furniture
router.put('/:id', (req, res) => {
    const furnitureId = req.params.id;
    const furniture = req.body;
    db.query('UPDATE furniture SET ? WHERE FurnitureID = ?', [furniture, furnitureId], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err });
        }
        res.json({ affectedRows: results.affectedRows });
    });
});

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

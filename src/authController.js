const express = require('express');
const router = express.Router();
const db = require('./db');



// authenticatie user
router.post('/',(req,res) =>{
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
db.query('SELECT * FROM users WHERE Email = ? AND Password = ?',[email,password],(err, results)=>{
    if(err){
        return res.status(500).json({error: err});
    }
    if(results.length === 1){
        res.status(200).json(results[0]);
    }
    else{
        res.status(401).json({error : 'User not found'});
    }
    
    })
});


module.exports = router;

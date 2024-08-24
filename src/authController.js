const express = require('express');
const router = express.Router();
const db = require('./db');



// authenticatie user
router.post('/',(req,res) =>{
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
db.query('SELECT users.UserID,carts.CartID,users.Name,users.Email,users.Password,users.Phone,users.Role,users.Address,users.RegistrationDate FROM users INNER JOIN carts ON users.UserID = carts.UserID WHERE users.Email = ? AND users.Password = ?',[email,password],(err, results)=>{
    if(err){
        return res.status(500).json(err);
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

const mysql = require('mysql');

const connection = mysql.createConnection({
    // host: 'localhost',
    host: 'sql106.infinityfree.com',
    // user: 'root',
    user: 'if0_36874360',
    // password: '',
    password: '5xCybZIRxdWp3',
    // database: 'ar_furniture_app'
    database: 'if0_36874360_db_ar_furniture_app'
});

connection.connect(err => {
    if (err) {
        console.error('Database connection failed:', err.stack);
        return;
    }
    console.log('Connected to database.');
});

module.exports = connection;

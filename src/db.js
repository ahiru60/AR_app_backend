const mysql = require('mysql');

const connection = mysql.createConnection({
    //host: 'localhost',
    host: 'sql12.freesqldatabase.com',
    //user: 'root',
    user: 'sql12719102',
    //password: '',
    password: 'd4F9wPQVaH',
    //database: 'ar_furniture_app'
    database: 'sql12719102'
});

connection.connect(err => {
    if (err) {
        console.error('Database connection failed:', err.stack);
        return;
    }
    console.log('Connected to database.');
});

module.exports = connection;

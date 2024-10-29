const mysql = require('mysql');

const connection = mysql.createConnection({
    // host: 'localhost',
    host: 'bt0cl3e0jeqs7fdex26z-mysql.services.clever-cloud.com',
    // user: 'root',
    user: 'ufwcbxvf28fsgjwv',
    // password: '',
    password: 'Kr6jRzbQ30EGPkMAxBUh',
    // database: 'ar_furniture_app'
    database: 'bt0cl3e0jeqs7fdex26z'
});

connection.connect(err => {
    if (err) {
        console.error('Database connection failed:', err.stack);
        return;
    }
    console.log('Connected to database.');
});

module.exports = connection;


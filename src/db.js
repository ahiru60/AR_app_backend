const mysql = require('mysql');

const dbConfig = {
    host: 'bt0cl3e0jeqs7fdex26z-mysql.services.clever-cloud.com',
    user: 'ufwcbxvf28fsgjwv',
    password: 'Kr6jRzbQ30EGPkMAxBUh',
    database: 'bt0cl3e0jeqs7fdex26z'
};

let connection;

// Function to establish a new connection
function handleDisconnect() {
    connection = mysql.createConnection(dbConfig); // Recreate the connection

    // Connect to MySQL
    connection.connect(err => {
        if (err) {
            console.error('Error connecting to database:', err.stack);
            setTimeout(handleDisconnect, 2000); // Retry after 2 seconds if connection fails
        } else {
            console.log('Connected to database.');
        }
    });

    // Error handler to manage reconnection
    connection.on('error', err => {
        if (err.code === 'PROTOCOL_CONNECTION_LOST' || err.code === 'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR') {
            console.error('Database connection lost. Reconnecting...');
            handleDisconnect(); // Reconnect if the connection was lost.
        } else {
            console.error('Database error:', err);
            throw err; // For other errors, throw the error to be handled by higher layers
        }
    });
}

// Initialize the connection
handleDisconnect();

module.exports = connection;

const bcrypt = require('bcrypt');

const password = 'suraj@7f6.com'; // Enter the password to test
const hash = '$2b$10$CscTak.ZXkV8CayLKgSkd.1AzCJFAsHQMz/GKbHl0u78/0fkDEp3u'; // Replace with the hash from the database

bcrypt.compare(password, hash).then((result) => {
    console.log('Password match result:', result);
}).catch((error) => {
    console.error('Error during password comparison:', error);
});

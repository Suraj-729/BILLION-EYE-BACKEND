const express = require('express');
const app = express();
const dotenv = require('dotenv');
dotenv.config(); 
const cors = require('cors');
const connectToDb = require('./Db/db')
const userRoutes = require('./routes/user.routes');

connectToDb();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// app.use(cookieparser());

app.use('/user', userRoutes);
// app.use('/images', imageRoutes);
app.get('/',(req, res) => {
  res.send("Hey Server is Running");
  
})

module.exports = app;
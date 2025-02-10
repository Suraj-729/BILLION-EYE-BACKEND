const express = require('express');
const app = express();
const dotenv = require('dotenv');
dotenv.config(); 
const cors = require('cors');
const connectToDb = require('./Db/db')
const userRoutes = require('./routes/user.routes');

connectToDb();
const port = process.env.PORT || 5000;
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// app.use(cookieparser());
app.listen(port, () => {
  console.log(`HTTPS Server is running on port ${port}`);
});
app.use('/user', userRoutes);
// app.use('/images', imageRoutes);
app.get('/',(req, res) => {
  res.send("Hey Server is Running");
  
})

module.exports = app;
const express = require('express');
const app = express();
const dotenv = require('dotenv');
dotenv.config(); 
const cors = require('cors');
const connectToDb = require('./Db/db')
const userRoutes = require('./routes/user.routes');
const agencyRoutes = require('./routes/agency.router');
// Middleware (order matters!)
const bodyParser = require('body-parser');
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

connectToDb();
const port = process.env.PORT || 5000;
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));


app.use((req, res, next) => {
  console.log('Request content length:', req.headers['content-length']);
  next();
});

// app.use(cookieparser());
app.listen(port, () => {
  console.log(`HTTPS Server is running on port ${port}`);
});
app.use('/user', userRoutes);
// app.use('/agencies',agencyRoutes);
app.use('/',agencyRoutes);

// app.use('/images', imageRoutes);
app.get('/',(req, res) => {
  res.send("Hey Server is Running");
  
})

module.exports = app;
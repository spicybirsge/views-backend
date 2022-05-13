require('dotenv').config()
require('./mongo')()
const express =  require('express')
const app = express()
const logger = require('morgan');
const errorHandler = require('./middleware/error');
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(errorHandler)
app.use('/api/auth', require('./routes/auth'))
app.use('/api/crud', require('./routes/crud'))
app.get('/', (req, res) => {
res.sendStatus(403)
})
app.get('/status', (req, res) => {
    res.sendStatus(200)
})
const port = process.env.PORT || 3000
app.listen(port, () => {
    console.log(`server started on: ${port}`)
  });
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;

const isvalidtoken = (req, res, next) => {

const token = req.header('token');

if(!token) {
    return res.status(401).json({success: false, msg:"No valid token is provided", errors:"No valid token is provided"})
}

try {

const data = jwt.verify(token, JWT_SECRET)
req.user = data.user     

next()
} catch {
  res.status(403).json({success: false, msg:"This token is invalid", errors:"This token is invalid"})  

}

}

module.exports = isvalidtoken
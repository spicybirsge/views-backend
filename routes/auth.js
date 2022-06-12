const account = require('../database/account')
const aerect = require('aerect.js')
const express =  require('express')
const  router = express.Router()
const bcrypt = require('bcrypt')
const {body, validationResult} = require('express-validator')
const jwt =  require('jsonwebtoken')
require('../functions/email')
const JWT_SECRET = process.env.JWT_SECRET
const isvalidtoken = require('../middleware/isvalidtoken')
router.post('/register',  [
    body('name', 'Enter a username that is atleast 2 characters long.').isLength({min: 2}),
    body('email',  'Enter a valid  email.').isEmail(),
    body('password', 'Enter a valid  password that is atleast  5  characters long.').isLength({min:5})
], async(req, res) => {
    const  errors = validationResult(req)
    if(!errors.isEmpty()) {
        return res.status(400).json({success: false,  errors: errors.array()})
    }
    const email = req.body.email
    const  password1 = req.body.password
    const salt = await bcrypt.genSalt(10);
    const password = await bcrypt.hash(password1, salt);
    const name = req.body.name
    const blacklist = ['home', 'dashboard', 'terms', 'privacy', 'trending', 'login' ,'register', 'cdn', 'scripts', 'favicon', 'css']
    if(blacklist.includes(name)) {
        return res.status(400).json({success: false, msg:'Forbidden name', error: 'Forbidden name'})
    }
    try {
        const email1 = await account.findOne({email: email})
        if(email1) {
            return res.status(400).json({success: false, msg: 'Email is already registered', errors: 'Email is already registered'})
        }
        const name1 = await  account.findOne({name: name})
        if(name1) {
            return res.status(400).json({success: false, msg: 'Sorry this username is not available', errors: 'Sorry this username is not available'})
        }
       const rid = aerect.generateID(59)
       const pid = aerect.generateID(60)
       await account.create({
        name: name,
        pid: pid, 
        email: email,
        password: password,
        verified: false,
        verificationid: rid

       })
       await sendemail(`We recieved a request to verify you account. Your account can be verified by clicking this link: \n ${process.env.FRONTEND_URL}/verify/${rid}`, `Views.gq - Account verification request.`, email)
       return res.json({success: true, msg: 'An email was send to your mail for verification.'})
    } catch{
        return res.sendStatus(500)
    }
})

router.post('/verify', [
    body('ID', 'Enter a valid ID').isLength({min:5})
], async (req, res) => {
    const  errors = validationResult(req)
    if(!errors.isEmpty()) {
        return res.status(400).json({success: false,  errors: errors.array()})
    }
    const ID = req.body.ID
    const isvalidid = await account.findOne({verificationid: ID})
    if(!isvalidid) {
        return res.status(401).json({success: false, msg: "Unauthorized"})
    }
     account.findOne({verificationid: ID}, async (err, data) =>{
        if(data) {
            data.verificationid = null
            data.verified = true
            await data.save()
            const tosend = {
                user: {
                    id: data._id,
                    pid: data.pid
                }
            }
            const token = jwt.sign(tosend, JWT_SECRET)
            return res.json({success: true, token})
            
        }
        
    })
})

router.post('/login', [
    body('email',  'Enter a valid  email.').isEmail(),
    body('password', 'Enter a valid  password that is atleast  5  characters long.').isLength({min:5})
], async (req, res) => {
  
    const  errors = validationResult(req)
    if(!errors.isEmpty()) {
        return res.status(400).json({success: false,  errors: errors.array()})
    }
    const email = req.body.email
    const password = req.body.password
  
    const isvalid = await account.findOne({email: email})
    if(!isvalid) {
        return res.status(400).json({success: false, errors: "Email or password is incorrect.", msg: "Email or password is incorrect."})
    }
    const passwordCompare = await bcrypt.compare(password, isvalid.password);
if(!passwordCompare) {
    return res.status(400).json({success: false, errors: "Email or password is incorrect.", msg: "Email or password is incorrect."})

}
if(!isvalid.verified) {
    await sendemail(`We recieved a request to verify you account. Your account can be verified by clicking this link: \n ${process.env.FRONTEND_URL}/verify/${isvalid.verificationid}`, `Views.gq - Account verification request.`, email)
    return res.json({success: false, errors:"Email is not verified, an email was sent to your mail for verification", msg:"Email is not verified, an email was sent to your mail for verification"})
}
const tosend = {

    user: {
        id: isvalid.id,
        pid: isvalid.pid
    }
}

const token = jwt.sign(tosend, JWT_SECRET)
return res.json({success: true, token})
})

router.post('/getaccount', isvalidtoken, async (req, res) => {

    try {
        const accountdata = await account.findOne({_id: req.user.id, pid: req.user.pid}).select('-password').select('-verificationid')
        if(!accountdata) {
            return res.status(403).json({success: false, msg:"This token is invalid", errors:"This token is invalid"})  
        }

        return res.send(accountdata)

    } catch {
      return res.sendStatus(500)  

    }
})

router.post('/changepassword', isvalidtoken,[
    body('password', 'Enter a valid  password that is atleast  5  characters long.').isLength({min:5}),
    body('newpassword', 'Enter a valid  password that is atleast  5  characters long.').isLength({min:5}),
    body('confirmnewpassword', 'Enter a valid  password that is atleast  5  characters long.').isLength({min:5})
], async (req, res) => {
    const  errors = validationResult(req)
    if(!errors.isEmpty()) {
        return res.status(400).json({success: false,  errors: errors.array()})
    }
  try {
    const accountdata = await account.findOne({_id: req.user.id, pid: req.user.pid})
    if(!accountdata) {
        return res.status(403).json({success: false, msg:"This token is invalid", errors:"This token is invalid"})  
    }
    const plainpassword = req.body.password
    const isvalidoldpassword = await bcrypt.compare(plainpassword, accountdata.password)
    if(!isvalidoldpassword) {
        return res.status(400).json({success:false, msg:"Old password is not valid", errors:"Old password is not valid"})
    }
    const newpassword = req.body.newpassword
    const confirmnewpassword = req.body.confirmnewpassword
    if(newpassword !== confirmnewpassword) {
        return res.status(400).json({success:false, msg:"new password and confirm password don't match!", errors:"new password and confirm password don't match!"})
    }
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(confirmnewpassword, salt)
    const pid = aerect.generateID(60)
    account.findOne({_id: req.user.id, pid: req.user.pid}, async (err, data) => {
        if(data) {
data.password = hashed
data.pid = pid
await data.save()
const tosend = {
    user: {
        id: data._id,
        pid: data.pid
    }
}
const token = jwt.sign(tosend, JWT_SECRET)
return res.json({success: true, token})
        }
    })
  } catch {
    return res.sendStatus(500)   
  }

})


module.exports = router;
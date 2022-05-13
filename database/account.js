const mongoose = require("mongoose")
const AccountData = mongoose.Schema({
name: String,
pid: String, //pid stands for password id it will regenerate  everytime password is changed
email: String,
password: String,
verified: Boolean,
verificationid: String // this is an id which will be used for verifying  the user.

    
})
module.exports = mongoose.model('account', AccountData)
const mongoose = require("mongoose")
const CardData = mongoose.Schema({
creationdate: Number,    
owner: String,    
ownerID: String,
avatar: String,
name: String,
views: Number,
location: String,
theme: String,
gradient: String,
shortbio: String,
description: String,
tags: String,
link1name: String,
link1avatar: String,
link1url: String,

link2name: String,
link2avatar: String,
link2url: String,

link3name: String,
link3avatar: String,
link3url: String





    
})
module.exports = mongoose.model('card', CardData)
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
links: Array,


//deprecated don't use!
link1name: String,
link1avatar: String,
link1url: String,
link2name: String,
link2avatar: String,
link2url: String,
link3name: String,
link3avatar: String,
link3url: String,
link4name: String,
link4avatar: String,
link4url: String





    
})
module.exports = mongoose.model('card', CardData)
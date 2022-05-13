const cards = require('../database/card')
const account = require('../database/account')
const express =  require('express')
const  router = express.Router()
const {body, validationResult} = require('express-validator')
const isvalidtoken = require('../middleware/isvalidtoken')



router.post('/create', isvalidtoken, [
    body('name', 'Sorry this name is unavailable.').isLength({min:2}),
    body('shortbio', 'Please describe the short description about your card a little better!').isLength({min:5}),
    body('description', 'Tell us a little more about your card in the long description!').isLength({min:10}),
    body('tags', 'Please enter atleast one tag.').isLength({min: 1})
], async (req , res) => {
    const  errors = validationResult(req)
    if(!errors.isEmpty()) {
        return res.status(400).json({success: false,  errors: errors.array()})
    }
  

    const accountdata = await account.findOne({_id: req.user.id, pid: req.user.pid}).select('-password').select('-verificationid')
    if(!accountdata) {
        return res.status(403).json({success: false, msg:"This token is invalid", errors:"This token is invalid"})  
    }
 const data = {
  creationdate: Date.now(),
  owner: accountdata.name,
  ownerID: accountdata._id,
  avatar: req.body.avatar || null,
  name: req.body.name,
  views: 0,
  tags: req.body.tags,
  location: req.body.location || null,
  theme: req.body.theme || "#3673fc",
  gradient: req.body.gradient || "#000000",
  shortbio: req.body.shortbio,
  description: req.body.description,
  
  link1name: req.body.link1name || null,
  link1avatar: req.body.link1avatar || null,
  link1url: req.body.link1url || null,

  link2name: req.body.link2name || null,
  link2avatar: req.body.link2avatar || null,
  link2url: req.body.link2url || null,

  link3name: req.body.link3name || null,
  link3avatar: req.body.link3avatar || null,
  link3url: req.body.link3url || null
  

 }
 const doescardexist = await cards.findOne({owner: accountdata.name, name: req.body.name})
if(doescardexist) {
    return res.json({success: false, msg:"Card already exists.", errors:"Card already exists."})
}
await cards.create(data)
return res.json({success: true, msg:"Card succesfully created!"})
}) 

router.get('/getcard', [
    body('owner', 'Please provide an owner of the card').isLength({min:2}),
    body('name', 'Please provide the name of a card').isLength({min:1})
], async (req, res) => {

 const  errors = validationResult(req)
    if(!errors.isEmpty()) {
        return res.status(400).json({success: false,  errors: errors.array()})
    }
 cards.findOne({owner: req.body.owner, name:req.body.name}, async (err, data) => {
     if(!data) {
        return res.status(404).json({success: false, msg: "Card not found!"})
     }
     data.views++
     await data.save()
     return res.json({success: true, data})
 })
    
    
   
})

router.get('/getallcards', isvalidtoken, async (req, res) => {
    const accountdata = await account.findOne({_id: req.user.id, pid: req.user.pid}).select('-password').select('-verificationid')
    if(!accountdata) {
        return res.status(403).json({success: false, msg:"This token is invalid", errors:"This token is invalid"})  
    }

    const cardsexist = await cards.find({owner: accountdata.name, ownerID: accountdata._id})
    if(!cardsexist) {
        return res.json({success: false, msg: "You don't have anycards :( try creating your first one!"})
    }
    const data = cardsexist
  
    return res.json({success: true, data})

})

router.post('/update', isvalidtoken, [
    body('name', 'Please provide the name of the card you want to update.').isLength({min:2}),
    body('shortbio', 'Please describe the short description about your card a little better!').isLength({min:5}),
    body('description', 'Tell us a little more about your card in the long description!').isLength({min:10}),
    body('tags', 'Please enter atleast one tag.').isLength({min: 1})
], async (req, res) => {
    const accountdata = await account.findOne({_id: req.user.id, pid: req.user.pid}).select('-password').select('-verificationid')
    if(!accountdata) {
        return res.status(403).json({success: false, msg:"This token is invalid", errors:"This token is invalid"})  
    }
 
       cards.findOne({owner:accountdata.name,   ownerID: accountdata._id, name: req.body.name}, async (err, data) => {
           if(!data) {
               return res.json({success: false, msg:"Card not found."})
           }
           const datatoupdate = {
            creationdate: data.creationdate,
            owner:accountdata.name,   
            ownerID: accountdata._id, 
            name: req.body.name,
           
            avatar: req.body.avatar || null,
            views: data.views,
      
            tags: req.body.tags,
            location: req.body.location || null,
            theme: req.body.theme || "#3673fc",
            gradient: req.body.gradient || "#000000",
            shortbio: req.body.shortbio,
            description: req.body.description,
            
            link1name: req.body.link1name || null,
            link1avatar: req.body.link1avatar || null,
            link1url: req.body.link1url || null,
          
            link2name: req.body.link2name || null,
            link2avatar: req.body.link2avatar || null,
            link2url: req.body.link2url || null,
          
            link3name: req.body.link3name || null,
            link3avatar: req.body.link3avatar || null,
            link3url: req.body.link3url || null
            
          
           }
           await data.updateOne(datatoupdate)
   
     
           return res.json({success: true, msg:"Successfully updated your card!", datatoupdate})
           
       })

})
router.delete('/delete', isvalidtoken, [
    body('name', 'Please provide the name of the card you want to delete.').isLength({min:2})
], async (req , res) => {
    const accountdata = await account.findOne({_id: req.user.id, pid: req.user.pid}).select('-password').select('-verificationid')
    if(!accountdata) {
        return res.status(403).json({success: false, msg:"This token is invalid", errors:"This token is invalid"})  
    }
    cards.findOne({owner:accountdata.name,   ownerID: accountdata._id, name: req.body.name}, async (err, data) => {
        if(!data) {
            return res.json({success: false, msg:"Card not found."})
        }
        await data.deleteOne({owner:accountdata.name,   ownerID: accountdata._id, name: req.body.name})
        return res.json({success: true, msg:"Your card has been deleted."})
    })
})

router.get('/trending', async (req, res) => {
    const trendingdata = await cards.find().limit(100)
    const trending = trendingdata.sort((a, b) => (a.views < b.views ? 1 : -1)).filter(trendingdata => trendingdata.views > 0) 
    const data = trending
    res.json({success: true, msg:"Trending Cards", data})
})



module.exports = router;
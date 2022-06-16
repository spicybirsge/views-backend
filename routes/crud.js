const cards = require('../database/card')
const account = require('../database/account')
const express =  require('express')
const  router = express.Router()
const {body, validationResult} = require('express-validator')
const isvalidtoken = require('../middleware/isvalidtoken')



router.post('/create', isvalidtoken, [
    body('name', 'Sorry this name is unavailable.').isLength({min:2}),
   
], async (req , res) => {
    const accountdata = await account.findOne({_id: req.user.id, pid: req.user.pid}).select('-password').select('-verificationid')
    if(!accountdata) {
        return res.status(403).json({success: false, msg:"This token is invalid", errors:"This token is invalid"})  
    }
    const  errors = validationResult(req)
    if(!errors.isEmpty()) {
        return res.status(400).json({success: false,  errors: errors.array()})
    }
  const data = {
      owner: accountdata.name,
      ownerID: accountdata._id,
      name: req.body.name,
      tags: req.body.tags || 'views',
      views: 0,
      creationdate: Date.now()
  }

   
 
 const doescardexist = await cards.findOne({owner: accountdata.name, name: req.body.name})
if(doescardexist) {
    return res.json({success: false, msg:"Card already exists.", errors:"Card already exists."})
}
await cards.create(data)
return res.json({success: true, msg:"Card succesfully created!", data: data})
}) 




// next endpoint dont_touch
router.post('/getcard', [
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
router.post('/getcardwithoutviewsupdate', [
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

router.post('/addlink', isvalidtoken, [
    body('name', 'Please provide your cards name.').isLength({min: 2}),
    body('linkname', 'Please provide your links name').isLength({min: 2}),
    body('link', 'Please provide a link').isLength({min: 2})
], async (req, res) => {

    const accountdata = await account.findOne({_id: req.user.id, pid: req.user.pid}).select('-password').select('-verificationid')
    if(!accountdata) {
        return res.status(403).json({success: false, msg:"This token is invalid", errors:"This token is invalid"})  
    }
    const  errors = validationResult(req)
    if(!errors.isEmpty()) {
        return res.status(400).json({success: false,  errors: errors.array()})
    }

  
    const doescardexist = await cards.findOne({name: req.body.name, owner: accountdata.name, ownerID: accountdata._id})
    if(!doescardexist) {
        return res.json({success: false, msg: 'No Data.'})
    }
    const linkdata = {
        name: req.body.linkname,
        link: req.body.link,
        avatar: req.body.avatar || null

    }

    cards.findOne({name: req.body.name, owner: accountdata.name, ownerID: accountdata._id}, async (err, data) => {
        if(data) {
            data.links.push(linkdata)
            await data.save()
            const data2 = await cards.findOne({name: req.body.name, owner: accountdata.name, ownerID: accountdata._id})
            return res.json({success: true, msg: 'Added Link', data: data2})
        }
    })
    
})

router.post('/deletelink', isvalidtoken, [
    body('name', 'Please provide the name of your card'),
    body('linkname', 'Please provide name of the link'),
  
], async (req, res) => {
    const accountdata = await account.findOne({_id: req.user.id, pid: req.user.pid}).select('-password').select('-verificationid')
    if(!accountdata) {
        return res.status(403).json({success: false, msg:"This token is invalid", errors:"This token is invalid"})  
    }
    const  errors = validationResult(req)
    if(!errors.isEmpty()) {
        return res.status(400).json({success: false,  errors: errors.array()})
    }
    const doescardexist = await cards.findOne({name: req.body.name, owner: accountdata.name, ownerID: accountdata._id})
    if(!doescardexist) {
        return res.json({success: false, msg: 'No Data.'})
    }
    cards.findOne({name: req.body.name, owner: accountdata.name, ownerID: accountdata._id}, async (err, data) => {
        if(data) {
            const arr = data.links
           data.links =  arr.filter(arr => arr.name != req.body.linkname)
            await data.save()
            const data2 = await cards.findOne({name: req.body.name, owner: accountdata.name, ownerID: accountdata._id})
            return res.json({success: true, msg: `Removed all links with name ${req.body.linkname}`, data: data2})
        }

    })


})

router.post('/update/:type', isvalidtoken, [
    body('name', 'please provide the name of the card')
], async (req, res) => {
    const accountdata = await account.findOne({_id: req.user.id, pid: req.user.pid}).select('-password').select('-verificationid')
    if(!accountdata) {
        return res.status(403).json({success: false, msg:"This token is invalid", errors:"This token is invalid"})  
    }

    const  errors = validationResult(req)
    if(!errors.isEmpty()) {
        return res.status(400).json({success: false,  errors: errors.array()})
    }

    const type = req.params.type;
    // description updater.
    if(type === 'description') {
        const description = req.body.description || 'Unknown description'
        cards.findOne({name: req.body.name, owner: accountdata.name, ownerID: accountdata._id}, async (err, data) => {
      if(!data) {
          return res.status(404).json({success: false, msg: 'Card not found', errors: 'Card not found'})
      }
      data.description = description
      await data.save()
      const data2 = await cards.findOne({name: req.body.name, owner: accountdata.name, ownerID: accountdata._id})
      return res.json({success: true, msg: 'Description has been updated.', data: data2})
    })
}

if(type === 'shortbio') {
    const bio = req.body.shortbio || 'Unknown bio'
    cards.findOne({name: req.body.name, owner: accountdata.name, ownerID: accountdata._id}, async (err, data) => {
        if(!data) {
            return res.status(404).json({success: false, msg: 'Card not found', errors: 'Card not found'})
        }
        data.shortbio = bio
        await data.save()
        const newbio = await cards.findOne({name: req.body.name, owner: accountdata.name, ownerID: accountdata._id})
        return res.json({success: true, msg: 'Shortbio has been updated', data: newbio})

    })

}

if(type === 'avatar') {
    const avatar = req.body.avatar || null
    cards.findOne({name: req.body.name, owner: accountdata.name, ownerID: accountdata._id}, async (err, data) => {
        if(!data) {
            return res.status(404).json({success: false, msg: 'Card not found', errors: 'Card not found'})
        }
        data.avatar = avatar
        await data.save()
        const newavatar = await cards.findOne({name: req.body.name, owner: accountdata.name, ownerID: accountdata._id})
        return res.json({success: true, msg: 'Avatar has been updated', data: newavatar})
    })

}

if(type === 'location') {
    const location = req.body.location || null
    cards.findOne({name: req.body.name, owner: accountdata.name, ownerID: accountdata._id}, async (err, data) => {
        if(!data) {
            return res.status(404).json({success: false, msg: 'Card not found', errors: 'Card not found'})
        }

        data.location = location 
        await data.save()
        const newlocation = await cards.findOne({name: req.body.name, owner: accountdata.name, ownerID: accountdata._id})
        return res.json({success: true, msg: 'Card has been updated', data: newlocation})
    })
}
if(type === 'tags') {
    const tags = req.body.tags || 'views, views.gq'
    cards.findOne({name: req.body.name, owner: accountdata.name, ownerID: accountdata._id}, async (err, data) => {
        if(!data) {
            return res.status(404).json({success: false, msg: 'Card not found', errors: 'Card not found'})
        }

        data.tags = tags 
        await data.save()
        const newtags = await cards.findOne({name: req.body.name, owner: accountdata.name, ownerID: accountdata._id})
        return res.json({success: true, msg: 'Tags have been updated', data: newtags})
 
    })
}

if(type === 'theme') {
    const theme = req.body.theme || '#2c2cac'
    cards.findOne({name: req.body.name, owner: accountdata.name, ownerID: accountdata._id}, async (err, data) => {
        if(!data) {
            return res.status(404).json({success: false, msg: 'Card not found', errors: 'Card not found'})
        }
        data.theme = theme
        await data.save()
        const newtheme = await cards.findOne({name: req.body.name, owner: accountdata.name, ownerID: accountdata._id})
        return res.json({success: true, msg: 'Theme has been updated', data: newtheme})
    })
}

if(type === 'gradient') {
    const gradient = req.body.gradient || '#36393f'
    cards.findOne({name: req.body.name, owner: accountdata.name, ownerID: accountdata._id}, async (err, data) => {
        if(!data) {
            return res.status(404).json({success: false, msg: 'Card not found', errors: 'Card not found'})
        } 

        data.gradient = gradient
        await data.save()
        const newgradient = await cards.findOne({name: req.body.name, owner: accountdata.name, ownerID: accountdata._id})
    return res.json({success: true, msg: 'Gradient has been updated', data: newgradient})
    })
} 
if(type === 'fontcolor') {
    const fontcolor = req.body.fontcolor || '#212529'
    cards.findOne({name: req.body.name, owner: accountdata.name, ownerID: accountdata._id}, async (err, data) => {
        if(!data) {
            return res.status(404).json({success: false, msg: 'Card not found', errors: 'Card not found'})
        } 
        data.fontcolor = fontcolor
        await data.save()
        const newfontcolor = await cards.findOne({name: req.body.name, owner: accountdata.name, ownerID: accountdata._id})
        return res.json({success: true, msg: 'Font Color has been updated', data: newfontcolor})

    })
}



    
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
const mongoose = require('mongoose')

const messageSchema = new mongoose.Schema({
    from: {
        type: String
    },
    body: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
})

const messages=mongoose.model('messages',messageSchema)
module.exports=messages

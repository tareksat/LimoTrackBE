const mongoose = require('mongoose');

function ValidateObjectId(id){
    if(mongoose.Types.ObjectId.isValid(id)) return true
    return false
}

module.exports = { ValidateObjectId }
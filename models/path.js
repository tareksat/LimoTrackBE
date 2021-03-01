const mongoose = require("mongoose");
const Joi = require("joi");
Joi.objectId = require("joi-objectid")(Joi);

const Path = mongoose.model('paths', new mongoose.Schema({
    pathName: {
        type: String,
        maxlength: 50,
        required: true
    },
    group:{
        type:mongoose.Schema.Types.ObjectId,
        required: true
    }
}));

function validatePath(path){
    const schema = {
        pathName: Joi.string().max(50).required(),
        group: Joi.objectId().required()
    };
    return Joi.validate(path, schema);
}

module.exports = { Path,  validatePath}
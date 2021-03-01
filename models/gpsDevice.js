const mongoose = require('mongoose');
const Joi = require('joi');
Joi.objectId = require("joi-objectid")(Joi);

const gpsDeviceSchema = new mongoose.Schema({
    model: {
        type: String,
        minLength: 3,
        maxLength: 20,
        required: true
    },
    imei:{
        type: String,
        maxLength: 20,
        required: true
    },
    createdOn: {
        type: Date,
        default: Date.now()
    }
});


const GPSDevice = mongoose.model('gps_devices', gpsDeviceSchema);

function validateGpsDevice(gpsDevice){
    const schema = {
        model: Joi.string().min(3).max(20).required(),
        imei: Joi.string().required(),

    }

    return Joi.validate(gpsDevice, schema);
}

module.exports = { GPSDevice, validateGpsDevice }
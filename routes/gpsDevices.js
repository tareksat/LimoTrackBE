const mongoose = require("mongoose");
const express = require("express");
const auth = require("../middlewares/auth");
const { ValidateObjectId } = require('../services/validate');
const { GPSDevice, validateGpsDevice } = require('../models/gpsDevice');

const router = express();

// create module
router.post('/', async (req, res) => {
    // return 400 if invalid data submitted
    const { error } = validateGpsDevice(req.body);
    if(error) return res.status(400).send(error.details[0].message);

    // return 400 if imei already exists
    let gps = await GPSDevice.findOne({imei: req.body.imei});
    if(gps) return res.status(400).send('Device with the same IMEI already exists!');

    // return 200 if OK
    gps = new GPSDevice({ imei: req.body.imei, model: req.body.model });
    gps = await gps.save();
    res.send(gps);
});

// delete module
router.delete('/:id', async(req, res)=>{
    // return 400 if invalid id
    if(!ValidateObjectId(req.params.id)) return res.status(400).send('Invalid ID');

    // return 404 if device not found
    let gps = await GPSDevice.findByIdAndRemove(req.params.id);
    if(!gps) return res.status(404).send('device not found');

    // return 200 if OK
    res.send(gps);
});

// get module by id
router.get('/id/:id', async(req, res)=>{
    // return 400 if invalid id
    if(!ValidateObjectId(req.params.id)) return res.status(400).send('Invalid ID');

    // return 404 if device not found
    let gps = await GPSDevice.findById(req.params.id)
        .select('model _id createdOn imei');
    if(!gps) return res.status(404).send('device not found');

    // return 200 if OK
    res.send(gps);
});

// get modules by model
router.get('/model/:model', async(req, res)=>{
    // return 200 and list of devices
    let gps = await GPSDevice.find({model: req.params.model})
        .select('model _id createdOn imei');

    res.send(gps);
});

// get module by imei
router.get('/imei/:imei', async(req, res)=>{
    // return 404 if device not found
    let gps = await GPSDevice.find({imei: req.params.imei})
        .select('model _id createdOn imei');
    if(!gps) return res.status(404).send('device not found');

    // return 200 if OK
    res.send(gps);
});

module.exports = router;
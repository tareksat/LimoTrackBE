const mongoose = require("mongoose");
const express = require("express");
const {authenticate, account_auth} = require("../middlewares/auth");
const validateId = require("../middlewares/validateID");
const {Driver, validateDriver} = require("../models/driver");
const {ValidateObjectId} = require("../services/validate");
const {Group} = require('../models/group');

const router = express();

// create driver
router.post("/", authenticate, async (req, res) => {

    const {error} = validateDriver(req.body);

    req.body.group = mongoose.Types.ObjectId(req.body.group);
    req.body.account = mongoose.Types.ObjectId(req.body.account);

    // return 400 if invalid data submitted
    if (error) return res.status(400).send(error.details[0].message);

    // return 404 if group not found
    let group = await Group.findById(req.body.group);
    if (!group) return res.status(404).send('group not found');

    // return 403 if unauthorized access
    if (!authorizeUser(req.user, group._id, group.account))
        return res.status(403).send('Forbidden');

    // return 400 if driver name already exists in the same group
    let driver = await Driver.findOne({name: req.body.name, group: group._id});
    if (driver) return res.status(400).send("Driver name already exists!");

    // return 200 if ok
    driver = new Driver(req.body);
    driver = await driver.save();
    res.send(driver);
});

// update driver
router.put("/:id", [authenticate, validateId], async (req, res) => {

    // return 404 if driver not found
    let driver = await Driver.findById(req.params.id);
    if (!driver) return res.status(404).send("Driver not found!");

    // return 403 if unauthorized access
    if (!authorizeUser(req.user, driver.group, driver.account))
        return res.status(403).send('Forbidden');

    // return 400 if invalid data
    const {error} = validateDriver(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    // return 400 if new name already exists
    if (req.body.name !== driver.name) {
        const anotherDriver = await Driver.findOne({name: req.body.name});
        if (anotherDriver)
            return res.status(400).send("Driver name already exists!");
    }

    // return 200 and update
    driver = await Driver.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
    });
    res.send(driver);
});

// rate driver
router.post("/rate/:id/:rating", [authenticate, validateId], async (req, res) => {
    const {id, rating} = req.params;

    // return 400 if (0 > rating > 5)
    if (rating < 0 || rating > 5)
        return res.status(400).send("Rating must be between 0 and 5");

    // return 404 if driver not found
    let driver = await Driver.findById(id).select("rating");
    if (!driver) return res.status(404).send("Driver not found!");

    // return 200 if OK
    let r = driver.rating.value;
    let n = driver.rating.counts;
    r = n === 0 ? r : r * n;
    r += parseFloat(rating);
    n += 1;
    let x = r / n;

    driver = await Driver.findByIdAndUpdate(
        id,
        {
            $set: {
                "rating.value": x,
                "rating.counts": n,
            },
        },
        {new: true}
    );
    res.send(driver);
});

// delete driver
router.delete("/:id", [authenticate, validateId], async (req, res) => {
    const {id} = req.params;
    // return 404 if driver not found
    let driver = await Driver.findById(id);
    if (!driver) return res.status(404).send("Driver not found!");

    // return 403 if unauthorized access
    if (!authorizeUser(req.user, driver.group, driver.account))
        return res.status(403).send('Forbidden');

    //delete driver
    driver = await Driver.findByIdAndRemove(id);

    // return 200 and deleted driver
    res.send(driver);
});

// get by id
router.get("/:id", [authenticate, validateId], async (req, res) => {
    const {id} = req.params;

    let driver = await Driver.findById(id)
        .populate('group', 'groupName')
        .populate('account', 'accountName')
        .populate('car', 'info.name info.path');
    // return 404 if not found
    if (!driver) return res.status(404).send("Driver not found!");

    // return 403 if unauthorized access
    if (!authorizeUser(req.user, driver.group._id, driver.account._id))
        return res.status(403).send('Forbidden');
    // return 200 and driver data
    res.send(driver);
});

// get by name or phone ***
router.get("/get_by/:key/:value", [authenticate], async (req, res) => {

    const qry = {};
    qry[req.params.key] = new RegExp("^" + req.params.value + ".*", "i");
    if(req.user.role==='account') qry.account= req.user.account;
    if(req.user.role==='group')
    {
        qry.account = req.user.account;
        qry.group = req.user.group.id;
    }

    let drivers = await Driver.find(qry)
        .populate('group', 'groupName')
        .populate('account', 'accountName')
        .populate('car', 'info.name info.path');
        
    res.send(drivers);
});

// group id
router.get("/group_id/:id", [authenticate, validateId], async (req, res) => {
    const {id} = req.params;
    const { role } = req.user;

    const qry = {};
    if(role==='root') qry.group = id;
    if(role==='account'){
        qry.account = req.user.account;
    }
    if(req.user.role==='group') {
        qry.account = req.user.account;
        qry.group=req.user.group.id;
    }
    // send 200 and drivers
    let drivers = await Driver.find(qry);
    res.send(drivers);
});

// car id
router.get("/car_id/:id", [authenticate, validateId], async (req, res) => {
    const {id} = req.params;
    const qry = {car: id}
    if(user.role==='account') qry.account = user.account;
    if(user.role==='group') qry.group = user.group.id;

    // send 200 and drivers
    let drivers = await Driver.find(qry);
    res.send(drivers);
});

// get driver with no assigned car
router.get("/no_car",authenticate, async (req, res) => {
    const qry = {car: null}
    if(user.role==='account') qry.account = user.account;
    if(user.role==='group') qry.group = user.group.id;
    // send 200 and drivers
    let drivers = await Driver.find(qry);
    res.send(drivers);
});

function authorizeUser(usr, group, account) {
    if (usr.role === 'account' && usr.account !== account.toHexString())
        return false

    return !(usr.role === 'group' && usr.group.id !== group.toHexString());

}

module.exports = router;

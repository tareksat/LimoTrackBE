const express = require("express");
const Joi = require("joi");
const {authenticate, root_auth} = require("../middlewares/auth");
const validateId = require("../middlewares/validateID");
const {Car, parseCar, validateCar} = require("../models/car");

const router = express();

// create car
router.post("/", [authenticate, root_auth], async (req, res) => {
    // parse car data
    const _car = parseCar(req.body);
    // return 400 if invalid data
    const {error} = validateCar(_car);
    if (error) return res.status(400).send(error.details[0].message);

    // return 400 if IMEI already reserved

    let car = await Car.findOne({"info.gpsDevice": _car.info.gpsDevice});
    if (car)
        return res.status(400).send("GPS module already assigned to another car");

    // return 200 and create car
    car = new Car(_car);
    car = await car.save();
    res.send(car);
});

// delete car
router.delete("/:id", [authenticate, root_auth, validateId], async (req, res) => {

    let car = await Car.findByIdAndRemove(req.params.id);

    // return 404 if car not found
    if (!car) return res.status(404).send("Car not found");

    // return 200 and delete car
    res.send(car);
});

// update
// all car data
// update entire car data - not recommended
router.put("/:id", [authenticate, validateId], async (req, res) =>
{

    const _car = parseCar(req.body);
    // return 400 if invalid data
    const {error} = validateCar(_car);
    if (error) return res.status(400).send(error.details[0].message);

    // return 400 if IMEI already reserved

    let car = await Car.findOne({
        "info.gpsDevice": _car.info.gpsDevice,
        _id: {$ne: req.params.id},
    });

    // return 400 if car not found
    if (car)
        return res.status(400).send("GPS module already assigned to another car");

    // return 200 and update car
    car = await Car.findByIdAndUpdate(req.params.id, _car, {new: true});
    res.send(car);
});

// add push notification token/s
// update dashboard

// update maintenance section
router.put("/maintenance/:id", [authenticate, validateId], async (req, res) => {

    // validate months and distance
    const schema = {
        months: Joi.number().min(0).required(),
        distance: Joi.number().required(),
    };

    const result = Joi.validate(req.body, schema);
    if (result.error)
        return res.status(400).send(result.error.details[0].message);

    // return 404 if car not found
    let car = await Car.findById(req.params.id);
    if (!car) return res.status(404).send("Car not found");
    let maintenance = car.maintenance;
    if (!maintenance) {
        maintenance = {
            last: {
                time: "",
                odometer: 0,
            },
            next: {
                time: "",
                odometer: 0,
            },
        };
    }

    const d1 = new Date();
    const d2 = new Date();
    d2.setMonth(d1.getMonth() + parseInt(req.body.months));
    maintenance.last.time = d1;
    maintenance.last.odometer = car.dashBoard.odometer;
    maintenance.next.time = d2;
    maintenance.next.odometer =
        car.dashBoard.odometer + parseFloat(req.body.distance);

    // return 200 and update car
    car = await Car.findByIdAndUpdate(
        req.params.id,
        {$set: {maintenance}},
        {new: true}
    );
    res.send(car);
});

// renew subscription
router.put("/renew/:id", [authenticate, root_auth, validateId], async (req, res) => {
    // return 404 if car not found
    let car = await Car.findById(req.params.id);
    if (!car) return res.status(404).send("Car not found");

    const d1 = new Date();
    const d2 = new Date();
    d2.setFullYear(d1.getFullYear() + 1);

    // return 200 and update car
    car = await Car.findByIdAndUpdate(
        req.params.id,
        {
            $set: {
                "info.activationDate": d1,
                "info.expirationDate": d2,
            },
        },
        {new: true}
    );
    res.send(car);
});

/////////////////////////////   SEARCH /////////////////////////////

// search by id
router.get("/id/:id", [authenticate, validateId], async (req, res) => {
    let car = await Car.findById(req.params.id);
    // return 404 if car not found
    if (!car) return res.status(404).send("Car not found");
    // return 200 and car if OK
    res.send(car);
});

// group
router.get("/group_id/:id", [authenticate, validateId], async (req, res) => {
    const cars = await Car.find({"info.group": req.params.id})
        .populate('path');
    res.send(cars);
});

// account
router.get("/account_id/:id", [authenticate, validateId], async (req, res) => {
    const cars = await Car.find({"info.account": req.params.id})
        .populate('driver path account group');
    res.send(cars);
});

// driver
router.get("/driver_id/:id", [authenticate, validateId], async (req, res) => {
    const car = await Car.findOne({"info.driver": req.params.id})
        .populate('driver path account group');
    // return 404 if not found
    if (!car) return res.status(404).send("car not found");
    res.send(car);
});

//  no driver
router.get("/no_driver/:group_id", [authenticate], async (req, res) => {
    const cars = await Car.find({"info.driver": null, "info.group": req.params.group_id})
        .populate('driver path account group');

    res.send(car);
});

// IMEI
router.get("/imei/:imei/:group_id", [authenticate], async (req, res) => {
    const car = await Car.findOne({"info.gpsDevice": req.params.imei, "info.group": req.params.group_id})
        .populate('driver path account group');
    // return 404 if not found
    if (!car) return res.status(404).send("car not found");
    res.send(car);
});

// SIM number
router.get("/sim_number/:sim_num/:group_id", [authenticate], async (req, res) => {
    const car = await Car.findOne({
        "info.simNumber": {$regex: new RegExp(`^${req.params.sim_num}.*`, "i")},
        "info.group": req.params.group_id
    })
        .populate('driver path account group');
    // return 404 if not found
    if (!car) return res.status(404).send("car not found");
    res.send(car);
});

// path
router.get("/path/:path/:group_id", [authenticate], async (req, res) => {
    const cars = await Car.find({
        "info.path": req.params.path,
        "info.group": req.params.group_id
    }).populate('driver path account group');
    res.send(cars);
});

// installed by
router.get("/installed_by/:name", [authenticate], async (req, res) => {
    const cars = await Car.find({
        "installation.installedBy": {
            $regex: new RegExp(`^${req.params.name}.*`, "i"),
        },
        "info.group": req.params.group_id
    }).populate('driver path account group');
    res.send(cars);
});

// installation company
router.get("/installation_company/:company", [authenticate], async (req, res) => {
    const cars = await Car.find({
        "installation.company": {
            $regex: new RegExp(`^${req.params.company}.*`, "i"),
        }
    })
        .populate('driver path account group');
    res.send(cars);
});

// installation location
router.get("/installation_location/:location", [authenticate], async (req, res) => {
    const cars = await Car.find({
        "installation.location": {
            $regex: new RegExp(`^${req.params.location}.*`, "i"),
        },
    })
        .populate('driver path account group');
    res.send(cars);
});

// activation date range
router.get("/activation_date/:startDate/:endDate/:group_id", [authenticate], async (req, res) => {
    const dates = getTimeRange(req.params.startDate, req.params.endDate);
    // return 400 if invalid date formats
    if (!dates) return res.status(400).send("Invalid date formats!");
    const cars = await Car.find({
        $and: [
            {"info.activationDate": {$gte: dates.start}},
            {"info.activationDate": {$lte: dates.end}},
        ],
        "info.group": req.params.group_id
    }).populate('driver path account group');
    res.send(cars);
});

// expiration date range
router.get("/expiration_date/:startDate/:endDate/:group_id", [authenticate], async (req, res) => {
    const dates = getTimeRange(req.params.startDate, req.params.endDate);
    // return 400 if invalid date formats
    if (!dates) return res.status(400).send("Invalid date formats!");
    const cars = await Car.find({
        $and: [
            {"info.expirationDate": {$gte: dates.start}},
            {"info.expirationDate": {$lte: dates.end}},
        ],
        "info.group": req.params.group_id
    }).populate('driver path account group');
    res.send(cars);
});

// installation date range
router.get("/installation_date/:startDate/:endDate/:group_id", [authenticate], async (req, res) => {
    const dates = getTimeRange(req.params.startDate, req.params.endDate);
    // return 400 if invalid date formats
    if (!dates) return res.status(400).send("Invalid date formats!");
    const cars = await Car.find({
        $and: [
            {"installation.time": {$gte: dates.start}},
            {"installation.time": {$lte: dates.end}},
        ],
        "info.group": req.params.group_id
    });
    res.send(cars);
});

function getTimeRange(startDate_str, endDate_str) {
    // validate string is a valid date
    if (!Date.parse(startDate_str) || !Date.parse(endDate_str)) return null;

    const startDate = new Date(startDate_str);
    startDate.setUTCHours(0);
    startDate.setMinutes(0);
    startDate.setSeconds(0);
    const endDate = new Date(endDate_str);
    endDate.setUTCHours(23);
    endDate.setMinutes(59);
    endDate.setSeconds(59);

    return {
        start: startDate,
        end: endDate,
    };
}

module.exports = router;

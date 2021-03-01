const req = require("supertest");
const {Account} = require('../../models/account');
const {Group} = require('../../models/group');
const {User} = require('../../models/user');
const {Driver} = require('../../models/driver');
const {Path} = require('../../models/path');
const {Car} = require('../../models/car');
const {GPSDevice} = require('../../models/gpsDevice');
const mongoose = require("mongoose");
const bcrypt = require('bcrypt');

let server;
let account_a,
    account_b,
    group_a1,
    group_a2,
    group_b1,
    group_b2,
    root1,
    account_user_a,
    account_user_b,
    group_user_a1,
    group_user_a2,
    group_user_b1,
    group_user_b2,
    driver_a1,
    driver_a2,
    driver_b1,
    driver_b2,
    path_a1,
    path_a2,
    path_b1,
    path_b2,
    car_a1_1,
    car_a1_2,
    gps_1,
    gps_2;

let token;

describe('Test cars', () => {
    beforeEach(async () => {
        server = require('../../index');
        await populate();
        token = root1.generateAuthToken();
    });
    afterEach(async () => {
        await server.close();
        await User.remove({});
        await Account.remove({});
        await Group.remove({});
        await Driver.remove({});
        await Path.remove({});
        await Car.remove({});
    });

    describe('Testing POST /cars', () => {
        function exec(data) {
            return req(server)
                .post('/cars/')
                .set('x-auth-token', token)
                .send(data);
        }

        it('Should return 400 if invalid data', async () => {
            const res = await exec({});
            expect(res.status).toBe(400);
        });

        it('Should return 200 and create car', async () => {
            let gps = new GPSDevice({model: 'TK303', imei: '123'});
            gps = await gps.save();
            let car = getCar('test-car', group_a1, account_a, ' ', path_a1, gps);
            const res = await exec(car);
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('info');
        });
    });

    describe('Test DELETE /car/:id', () => {
        it('Should return 200 and delete car', async () => {
            const token = root1.generateAuthToken();
            const res = await req(server).delete('/cars/' + car_a1_1._id).set('x-auth-token', token).send();
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('_id', car_a1_1._id.toHexString());
        });
    });

    describe('Test PUT /cars/:id', () => {
        function exec(id, data){
            return req(server).put('/cars/'+id).set('x-auth-token', token).send(data);
        }

        it('Should return 200 and update car', async () => {
            let gps = new GPSDevice({model: 'TK303', imei: '987654321'});
            gps = await gps.save();
            let car = getCar('test-car', group_a1, account_a, driver_a1, path_a1, gps);
            const res = await exec(car_a1_1._id, car);
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('_id', car_a1_1._id.toHexString());
            expect(res.body.info).toHaveProperty('name', 'test-car');
        });
    });


});


async function populate() {
    // creating account_a & account_b
    account_a = new Account({accountName: 'account_a'});
    account_a = await account_a.save();

    account_b = new Account({accountName: 'account_b'});
    account_b = await account_b.save();

    // creating grp_a1 & grp_a2 under account_a
    group_a1 = new Group({groupName: 'group_a1', account: account_a._id});
    group_a1 = await group_a1.save();
    group_a2 = new Group({groupName: 'group_a2', account: account_a._id});
    group_a2 = await group_a2.save();

    // creating grp_b1 & grp_b2 under account_b
    group_b1 = new Group({groupName: 'group_b1', account: account_b._id});
    group_b1 = await group_b1.save();
    group_b2 = new Group({groupName: 'group_b2', account: account_b._id});
    group_b2 = await group_b2.save();

    const salt = await bcrypt.genSalt(10);
    // creating two root users
    let hashedpassword = await bcrypt.hash('123456', salt);
    root1 = new User({name: 'root1', email: 'root1@mail.com', password: hashedpassword, role: 'root'});
    root1 = await root1.save();

    // creating account manager user for account-A
    account_user_a = new User({
        name: 'account-user-a',
        email: 'account-user-a@mail.com',
        password: hashedpassword,
        role: 'account',
        account: account_a._id
    });
    account_user_a = await account_user_a.save();

    // creating account manager user for account-B
    account_user_b = new User({
        name: 'account-user-b',
        email: 'account-user-b@mail.com',
        password: hashedpassword,
        role: 'account',
        account: account_b._id
    });
    account_user_b = await account_user_b.save();

    // creating group admin user for account-A group-A1
    group_user_a1 = new User({
        name: 'group-user-a1',
        email: 'group-user-a1@mail.com',
        password: hashedpassword,
        role: 'group',
        account: account_a._id,
        group: group_a1
    });
    group_user_a1 = await group_user_a1.save();

    // creating group admin user for account-A group-A2
    group_user_a2 = new User({
        name: 'group-user-a2',
        email: 'group-user-a2@mail.com',
        password: hashedpassword,
        role: 'group',
        account: account_a._id,
        group: group_a2
    });
    group_user_a2 = await group_user_a2.save();

    // creating group admin user for account-B group-B1
    group_user_b1 = new User({
        name: 'group-user-b1',
        email: 'group-user-b1@mail.com',
        password: hashedpassword,
        role: 'group',
        account: account_b._id,
        group: group_b1
    });
    group_user_b1 = await group_user_b1.save();

    // creating group admin user for account-B group-B2
    group_user_b2 = new User({
        name: 'group-user-b2',
        email: 'group-user-b2@mail.com',
        password: hashedpassword,
        role: 'group',
        account: account_b._id,
        group: group_b2
    });
    group_user_b2 = await group_user_b2.save();

    const driver_obj = {
        name: 'driver',
        phone: '123456789',
        address: 'city-State',
        car: '601f0cb8020e6e0f862e7a4c',
        group: group_a1._id,
        account: account_a._id
    };
    driver_a1 = new Driver({
        ...driver_obj,
        name: 'driver-a1',
        group: group_a1._id,
        account: account_a._id,
        car: mongoose.Types.ObjectId()
    });
    driver_a1 = await driver_a1.save();

    driver_a2 = new Driver({
        ...driver_obj,
        name: 'driver-a2',
        group: group_a2._id,
        account: account_a._id
    });
    driver_a2 = await driver_a2.save();

    driver_b1 = new Driver({
        ...driver_obj,
        name: 'driver-b1',
        group: group_b1._id,
        account: account_b._id
    });
    driver_b1 = await driver_b1.save();

    driver_b2 = new Driver({
        ...driver_obj,
        name: 'driver-b2',
        group: group_b2._id,
        account: account_b._id
    });
    driver_b2 = await driver_b2.save();

    path_a1 = new Path({pathName: 'path_a1', group: group_a1._id});
    path_a1 = await path_a1.save();

    path_a2 = new Path({pathName: 'path_a2', group: group_a2._id});
    path_a2 = await path_a2.save();

    path_b1 = new Path({pathName: 'path_b1', group: group_b1._id});
    path_b1 = await path_b1.save();

    path_b2 = new Path({pathName: 'path_b2', group: group_b2._id});
    path_b2 = await path_b2.save();

    gps_1 = new GPSDevice({model: 'TK303', imei: '123456789'});
    gps_1 = await gps_1.save();

    gps_2 = new GPSDevice({model: 'TK303', imei: '987654321'});
    gps_2 = await gps_2.save();

    car_a1_1 = new Car(getCar('car_a1_1', group_a1, account_a, driver_a1, path_a1, gps_1));
    car_a1_1 = await car_a1_1.save();

    car_a1_2 = new Car(getCar('car_a1_2', group_a1, account_a, null, path_a1, gps_2));
    car_a1_2 = await car_a1_2.save();

}

const date = Date();

function getInfo(name, group, account, driver, path, gps) {
    return {
        name: name,
        platNumber: "PLT-123",
        fuelConsumptionRate: 12.8,
        gpsDevice: gps._id,
        activationDate: date,
        expirationDate: date,
        simNumber: "01001860957",
        vin: "123",
        engineNumber: "456",
        color: "color",
        tankSize: 50,
        path: path._id,
        driver: driver ? driver._id : null,
        tokens: [],
        photo: "photo//URL",
        group: group._id,
        account: account._id
    };
}

function getInstallation() {
    return {
        installedBy: "tarek",
        time: date,
        company: "company",
        location: "location",
        photos: [],
    };
}

function getAlertSettings() {
    return {
        engineON: true,
        engineOFF: true,
        doorOpen: true,
        doorClosed: true,
        fuelLeak: true,
        refuel: true,
        speedAlert: true,
        speedLimit: 120,
        geoFence: {
            alert: true,
            topLeft: {
                latitude: 34,
                longitude: 34,
            },
            bottomRight: {
                latitude: 34,
                longitude: 34,
            },
        },
    };
}

function getDashboard() {
    return {
        speed: 120,
        odometer: 55123,
        fuelLevel: 33.5,
        location: {latitude: 33, longitude: 55},
        lastSeen: date,
    };
}

function getMaintenance() {
    return {
        last: {
            time: date,
            odometer: 55000,
        },
        next: {
            time: date,
            odometer: 65000,
        },
    };
}

function getCar(name, group, account, driver, path, gps) {
    return {
        info: getInfo(name, group, account, driver, path, gps),
        installation: getInstallation(),
        alertSettings: getAlertSettings(),
        dashBoard: getDashboard(),
        maintenance: getMaintenance(),
    };
}
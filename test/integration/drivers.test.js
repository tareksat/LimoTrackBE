const req = require("supertest");
const {Account} = require('../../models/account');
const {Group} = require('../../models/group');
const {User} = require('../../models/user');
const {Driver} = require('../../models/driver');
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
    driver_b2;

describe('Testing Drivers', () => {
    beforeEach(async () => {
        server = require('../../index');
        await populate();
    });

    afterEach(async () => {
        await server.close();
        await Account.remove({});
        await Group.remove({});
        await User.remove({});
        await Driver.remove({});
    });

    describe('Testing POST /drivers/', () => {

        function exec(usr, data) {
            const token = usr.generateAuthToken();
            return req(server)
                .post('/drivers/')
                .set('x-auth-token', token)
                .send(data);
        }

        it('Should return 400 if invalid data submitted', async () => {
            const res = await exec(root1, {});
            expect(res.status).toBe(400);
        });

        it('Should return 404 if group not found', async () => {
            const driver = {
                name: "Driver",
                phone: "0100186957",
                address: "address",
                group: mongoose.Types.ObjectId().toHexString(),
                account: mongoose.Types.ObjectId().toHexString()
            }
            const res = await exec(root1, driver);
            expect(res.status).toBe(404);
            expect(res.text).toContain('group not found');
        });

        it('Should return 403 if unauthorized access', async () => {
            const driver = {
                name: "Driver",
                phone: "0100186957",
                address: "address",
                group: group_a1._id,
                account: account_a._id
            }
            const res = await exec(group_user_a2, driver);
            expect(res.status).toBe(403);
            expect(res.text).toContain('Forbidden');
        });

        it('Should return 400 if driver name already exists in the same group', async () => {
            let _driver = new Driver({name: 'Driver', group: group_a1._id, account: account_a._id});
            _driver = await _driver.save();
            const driver = {
                name: "Driver",
                phone: "0100186957",
                address: "address",
                group: group_a1._id,
                account: account_a._id
            }
            const res = await exec(group_user_a1, driver);
            expect(res.status).toBe(400);
            expect(res.text).toContain('Driver name already exists!');
        });

        it('Should return 200 and created driver', async () => {
            const driver = {
                name: "Driver-a",
                phone: "0100186957",
                address: "address",
                group: group_a1._id,
                account: account_a._id
            }
            const res = await exec(group_user_a1, driver);
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('name', 'Driver-a');
        });
    });

    describe('Testing PUT /drivers/:id', () => {
        const driver = {
            name: 'driver',
            phone: '123456789',
            address: 'city-State',
            car: mongoose.Types.ObjectId(),
            group: mongoose.Types.ObjectId(),
            account: mongoose.Types.ObjectId()
        };

        function exec(usr, id, data) {
            const token = usr.generateAuthToken();
            return req(server)
                .put('/drivers/' + id)
                .set('x-auth-token', token)
                .send(data)
        }

        it('Should return 404 if driver not found', async () => {
            const res = await exec(root1,
                mongoose.Types.ObjectId().toHexString(),
                {...driver, group: group_a1._id, account: account_a._id});
            expect(res.status).toBe(404);
            expect(res.text).toContain('Driver not found!');
        });

        it('Should return 403 if unauthorized access', async () => {
            let _driver = new Driver({...driver, group: group_a1._id, account: account_a._id})
            _driver = await _driver.save();
            const res = await exec(account_user_b,
                _driver._id.toHexString(),
                {...driver, group: group_a1._id, account: account_a._id});
            expect(res.status).toBe(403);
            expect(res.text).toContain('Forbidden');
        });

        it('Should return 400 if invalid data', async () => {
            let _driver = new Driver({...driver, group: group_a1._id, account: account_a._id})
            _driver = await _driver.save();
            const res = await exec(account_user_a,
                _driver._id.toHexString(),
                {...driver, group: group_a1._id, account: account_a._id, name: ''});
            expect(res.status).toBe(400);
        });

        it('Should return 400 if new name already exists', async () => {
            let _driver = new Driver({...driver, group: group_a1._id, account: account_a._id})
            _driver = await _driver.save();
            let _driver1 = new Driver({...driver, group: group_a1._id, account: account_a._id, name: 'driver_1'})
            _driver1 = await _driver1.save();
            const res = await exec(account_user_a,
                _driver._id.toHexString(),
                {...driver, group: group_a1._id, account: account_a._id, name: _driver1.name});
            expect(res.status).toBe(400);
            expect(res.text).toContain('Driver name already exists!');
        });

        it('Should return 200 and update', async () => {
            let _driver = new Driver({...driver, group: group_a1._id, account: account_a._id})
            _driver = await _driver.save();
            const res = await exec(group_user_a1,
                _driver._id.toHexString(),
                {...driver, group: group_a1._id, account: account_a._id, name: 'driver-2'});
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('name', 'driver-2');
        });
    });

    // describe('Testing POST /rate/:id/:rating', () =>{});

    describe('Testing DELETE /drivers/:id', () => {
        //
        it('Should return 200 and deleted driver', async () => {
            // insert driver
            const driver_obj = {
                name: 'driver',
                phone: '123456789',
                address: 'city-State',
                car: '601f0cb8020e6e0f862e7a4c',
                group: group_a1._id,
                account: account_a._id
            };
            let driver = new Driver(driver_obj);
            driver = await driver.save();
            const token = account_user_a.generateAuthToken();
            const res = await req(server).delete('/drivers/' + driver._id).set('x-auth-token', token).send();
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('_id', driver._id.toHexString());

        });
    });

    describe('Testing GET /drivers/:id', () => {

        function exec(usr, id) {
            const token = usr.generateAuthToken();
            return req(server).get('/drivers/' + id).set('x-auth-token', token).send();
        }

        it('Should return 404 if not found', async () => {
            const res = await exec(root1, mongoose.Types.ObjectId());
            expect(res.status).toBe(404);
            expect(res.text).toContain('Driver not found!');
        });

        it('Should return 403 if unauthorized access', async () => {
            const res = await exec(account_user_b, driver_a1._id);
            expect(res.status).toBe(403);
            expect(res.text).toContain('Forbidden');
        });

        it('Should return 200 and driver data', async () => {
            const res = await exec(account_user_a, driver_a1._id);
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('_id', driver_a1._id.toHexString());
        });
    });

    describe('Testing GET /drivers/:key/:value', () => {
        it('Should return 200 and driver object', async () => {
            const token = root1.generateAuthToken();
            const res = await req(server).get('/drivers/get_by/name/driver-a1').set('x-auth-token', token).send();
            expect(res.status).toBe(200);
            expect(res.body.length).toBe(1);
            expect(res.body[0]).toHaveProperty('_id', driver_a1._id.toHexString());
        });
    });

    // GET drivers by group id
    describe('Testing GET /drivers/:id', () => {
        function exec(usr, id) {
            const token = usr.generateAuthToken();
            return req(server).get('/drivers/group_id/' + id)
                .set('x-auth-token', token)
                .send();
        }

        it('Should return 200 and 2 drivers if root', async () => {
            const res = await exec(root1, group_a1._id);
            expect(res.status).toBe(200);
            expect(res.body.length).toBe(1);
        });

        it('Should return 200 and 2 drivers if account', async () => {
            const res = await exec(account_user_a, group_a1._id);
            expect(res.status).toBe(200);
            expect(res.body.length).toBe(2);
        });

        it('Should return 200 and 1 if group', async () => {
            const res = await exec(group_user_a1, group_a1._id);
            expect(res.status).toBe(200);
            expect(res.body.length).toBe(1);
        });

    });

    describe('Testing GET /drivers/car_id/:id', () => {

        function exec(usr, id) {
            const token = usr.generateAuthToken();
            return req(server).get('/drivers/car_id' + id).set('x-auth-token', token).send();
        }

        it('should return 1 if authorized', async () => {
            // const res = await exec(group_user_a1, driver_a1.car);
            // expect(res.status).toBe(200);
            // expect(res.body.length).toBe(1);
            // expect(res.body[0]).toHaveProperty('_id', driver_a1._id)
        });

        it('should return 0 if not authorized', async () => {
        });
    });

    describe('Testing GET /drivers/no_car', () => {
        function exec(usr) {
            const token = usr.generateAuthToken();
            return req(server).get('/drivers/no_car').set('x-auth-token', token).send();
        }

        it('Should return 200 with 3 drivers', async () => {
            // const res = await exec(root1);
            // expect(res.status).toBe(200);
            // expect(res.body.length).toBe(3);
        });

        it('Should return 200 with 1 drivers', async () => {

        });

    });

    describe('Testing POST /rate/:id/:rating', () => {
        function exec(usr, id, rating) {
            const token = usr.generateAuthToken();
            return req(server).post(`/drivers/rate/${id}/${rating}`).set('x-auth-token', token).send();
        }

        it('Should return 400 if (0 > rating > 5)', async () => {
            const res = await exec(root1, driver_a1._id, "10");
            expect(res.status).toBe(400);
            expect(res.text).toContain('Rating must be between 0 and 5');
        });

        it('Should return 200 with 1 drivers', async () => {
            const res = await exec(root1, driver_a1._id, 5);
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('rating');
            expect(res.body.rating).toHaveProperty('value', 5);
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

    root2 = new User({name: 'root2', email: 'root2@mail.com', password: hashedpassword, role: 'root'});
    root2 = await root2.save();

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
}
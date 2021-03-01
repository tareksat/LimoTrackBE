const {Account} = require('../../models/account');
const {Group} = require('../../models/group');
const {User} = require('../../models/user');
const {Driver} = require('../../models/driver');
const {Path} = require('../../models/path');
const mongoose = require("mongoose");
const bcrypt = require('bcrypt');

let account_a, account_b;
let group_a1, group_a2, group_b1, group_b2;
let root1, account_user_a, account_user_b, group_user_a1, group_user_a2, group_user_b1, group_user_b2;
let driver_a1, driver_a2, driver_b1, driver_b2;

async function populate() {
    // creating account_a & account_b
    account_a = await createAccount('account_a');
    account_b = await createAccount('account_b');

    // creating grp_a1 & grp_a2 under account_a
    group_a1 = await createGroup('group_a1', account_a._id);
    group_a2 = await createGroup('group_a2', account_a._id);


    // creating grp_b1 & grp_b2 under account_b
    group_b1 = await createGroup('group_b1', account_b._id);
    group_b2 = await createGroup('group_b2', account_b._id);

    root1 = await createUser('root1', 'root1@mail.com', 'root');

    account_user_a = await createUser('account-user-a', 'account-user-a@mail.com', 'account', account_a._id);
    account_user_b = await createUser('account-user-b', 'account-user-b@mail.com', 'account', account_b._id);

    group_user_a1 = await createUser('group-user-a1', 'group-user-a1@mail.com', 'group', account_a._id, group_a1._id);
    group_user_a2 = await createUser('group-user-a2', 'group-user-a2@mail.com', 'group', account_a._id, group_a2._id);
    group_user_b1 = await createUser('group-user-b1', 'group-user-b1@mail.com', 'group', account_b._id, group_b1._id);
    group_user_b2 = await createUser('group-user-b2', 'group-user-b2@mail.com', 'group', account_b._id, group_b2._id);

    driver_a1 = await createDriver('driver-a1', group_a1._id, account_a._id);
    driver_a2 = await createDriver('driver-a2', group_a2._id, account_a._id);
    driver_b1 = await createDriver('driver-b1', group_b1._id, account_b._id);
    driver_b2 = await createDriver('driver-b2', group_b2._id, account_b._id);

    return{
        account_a, account_b,
        group_a1, group_a2, group_b1, group_b2,
        root1, account_user_a, account_user_b, group_user_a1, group_user_a2, group_user_b1, group_user_b2,
        driver_a1, driver_a2, driver_b1, driver_b2,
    }
}

async function createUser(name, email, role, account, group) {
    const salt = await bcrypt.genSalt(10);
    const password = await bcrypt.hash('123456', salt);

    let usr = new User({
        name,
        email,
        password,
        role: role,
        account: account  ? mongoose.Types.ObjectId(account) : null,
        group: group ? mongoose.Types.ObjectId(group) : null
    });
    usr = await usr.save();
    return usr;
}

async function createAccount(name) {
    let account = new Account({accountName: name});
    account = await account.save();
    return account
}

async function createGroup(name, account) {
    let group = new Group({groupName: name, account: mongoose.Types.ObjectId(account)});
    group = await group.save();
    return group;
}

async function createDriver(name, group, account) {

    let driver = new Driver({
        name: name,
        phone: '123456789',
        address: 'city-State-Country',
        car: null,
        group: mongoose.Types.ObjectId(group),
        account: mongoose.Types.ObjectId(account)
    });
    driver = await driver.save();
    return driver;
}

async function createCar(name, group) {

}

async function createPath(name, group) {
    let path = new Path({pathName: name, group: mongoose.Types.ObjectId(group)});
    path = await path.save();
    return path;
}

module.exports = populate;
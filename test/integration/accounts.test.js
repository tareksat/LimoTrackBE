const req = require("supertest");
const mongoose = require("mongoose");
const bcrypt = require('bcrypt');
const {Account} = require("../../models/account");
const {User} = require("../../models/user");
const {Group} = require("../../models/group");

let server;
let account_a;
let account_b;
let group_a1;
let group_a2;
let group_b1;
let group_b2;
let root1;
let account_user_a;
let account_user_b;
let group_user_a1;
let group_user_a2;
let group_user_b1;
let group_user_b2;
let token;

describe('Testing Accounts', () => {
    beforeAll(async () => {
        server = require("../../index");
        await populate();
        token = root1.generateAuthToken();
    });

    afterAll(async () => {
        await server.close();
        await Account.remove({});
        await User.remove({});
    });

    describe("Testing POST /accounts/", () => {

        it("should return 400 if invalid account name", async () => {
            const res = await req(server).post("/accounts/create/")
                .set('x-auth-token', token).send({});
            expect(res.status).toBe(400);

        });

        it("should return 400 if account name already exists", async () => {
            const res = await req(server)
                .post("/accounts/create/")
                .set('x-auth-token', token)
                .send({accountName: account_a.accountName});
            expect(res.status).toBe(400);
            expect(res.text).toContain('account name already exists!');
        });

        it("should return 200 with created account", async () => {
            const res = await req(server)
                .post("/accounts/create/")
                .set('x-auth-token', token)
                .send({accountName: "abc"});

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty("_id");
            expect(res.body).toHaveProperty("accountName");
            expect(res.body).toHaveProperty("createdOn");
        });
    });

    describe("Testing get by id", () => {

        it("should return 404 if no accounts corresponds to ID", async () => {
            const id = mongoose.Types.ObjectId().toHexString();
            const res = await req(server).get(`/accounts/${id}`)
                .set('x-auth-token', token)
                .send();
            expect(res.status).toBe(404);
            expect(res.text).toContain('Not found!');
        });

        it("should return 200 with account if OK", async () => {
            const res = await req(server)
                .get(`/accounts/${account_a._id}`)
                .set('x-auth-token', token)
                .send();
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty("accountName", account_a.accountName);
        });
    });

    describe("Testing get account by name", () => {

        it("should return 404 if account name not found", async () => {
            const res = await req(server)
                .get("/accounts/by_name/test")
                .set('x-auth-token', token)
                .send();
            expect(res.status).toBe(404);
            expect(res.text).toContain('Not found!')
        });

        it("should return 200 with account if OK", async () => {
            const res = await req(server)
                .get("/accounts/by_name/" + account_a.accountName)
                .set('x-auth-token', token)
                .send();
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty("accountName", account_a.accountName);
        });
    });

    describe("Testing PUT /accounts/:id", () => {

        it("should return 400 if req body has validation error", async () => {
            const res = await req(server).put(`/accounts/${account_a._id}`)
                .set('x-auth-token', token)
                .send({});
            expect(res.status).toBe(400);
        });

        it("should return 400 if account name already exists", async () => {
            const res = await req(server)
                .put(`/accounts/${account_a._id}`)
                .set('x-auth-token', token)
                .send({accountName: account_b.accountName});
            expect(res.status).toBe(400);
            expect(res.text).toContain('account name already exists!');
        });

        it("should return 404 if account id not found", async () => {
            const res = await req(server)
                .put(`/accounts/${mongoose.Types.ObjectId().toHexString()}`)
                .set('x-auth-token', token)
                .send({accountName: "account-2"});
            expect(res.status).toBe(404);
            expect(res.text).toContain('account not found!');
        });

        it('Should return 403 if account manager tries to change another account name', async () => {
            const token1 = account_user_b.generateAuthToken();
            const res = await req(server)
                .put(`/accounts/${account_a._id}`)
                .set('x-auth-token', token1)
                .send({accountName: "account-2"});
            expect(res.status).toBe(403);
            expect(res.text).toContain('Forbidden');
        });

        it("should return 200 if OK", async () => {
            const res = await req(server)
                .put(`/accounts/${account_a._id}`)
                .set('x-auth-token', token)
                .send({accountName: "account-2"});
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty("accountName", "account-2");
        });
    });

    describe('/Testing PUT /accounts/set_location/:id', () => {

        it('Should return 403 if account manager trying to change name of another account', async () => {
            const token1 = account_user_b.generateAuthToken();
            const res = await req(server).put('/accounts/set_location/' + account_a._id)
                .set('x-auth-token', token1)
                .send({longitude: '34', latitude: '35'});
            expect(res.status).toBe(403);
            expect(res.text).toContain('Forbidden');
        });

        it('Should return 400 if invalid location data', async () => {
            const res = await req(server).put('/accounts/set_location/' + account_a._id)
                .set('x-auth-token', token)
                .send({longitude: '', latitude: '35'});
            expect(res.status).toBe(400);
            expect(res.text).toContain('Location error');
        });

        it('Should return 404 if account not found', async () => {
            const res = await req(server).put('/accounts/set_location/' + mongoose.Types.ObjectId().toHexString())
                .set('x-auth-token', token)
                .send({longitude: '34', latitude: '35'});
            expect(res.status).toBe(404);
            expect(res.text).toContain('account not found!');
        });

        it('Should return 200 if OK', async () => {
            const res = await req(server).put('/accounts/set_location/' + account_a._id)
                .set('x-auth-token', token)
                .send({longitude: '34', latitude: '35'});
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('location');
            expect(res.body.location).toHaveProperty('longitude', '34');
            expect(res.body.location).toHaveProperty('latitude', '35');
        });
    });

    describe("Testing DELETE /accounts/:id", () => {

        it('Should return 404 if account not found', async () => {
            const res = await req(server).delete('/accounts/' + mongoose.Types.ObjectId().toHexString())
                .set('x-auth-token', token)
                .send();
            expect(res.status).toBe(404);
            expect(res.text).toContain('Account not found');
        });

        it('Should return 200 and account if ok', async () => {
            const res = await req(server).delete('/accounts/' + account_a._id)
                .set('x-auth-token', token)
                .send();
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('_id', account_a._id.toHexString());
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
    // creating two root1 users
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

};

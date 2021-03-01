const req = require("supertest");
const {Account} = require('../../models/account');
const {Group} = require('../../models/group');
const {User} = require('../../models/user');
const {Path} = require('../../models/path');
const mongoose = require("mongoose");
const bcrypt = require('bcrypt');

let server;
let account_a;
let account_b;
let group_a1;
let group_a2;
let group_b1;
let group_b2;
let root1;
let root2;
let account_user_a;
let account_user_b;
let group_user_a1;
let group_user_a2;
let group_user_b1;
let group_user_b2;

let token;
describe("Testing groups", () => {

    beforeAll(async () => {
        server = require('../../index');
        await populate();
        token = root1.generateAuthToken();
    });

    afterAll(async () => {
        await server.close();
        await Account.remove({});
        await Group.remove({});
        await User.remove({});
        await Path.remove({});
    });

    describe("Test POST /groups", () => {

        it("Should return 400 if not valid req.body", async () => {
            const res = await req(server).post("/groups")
                .set('x-auth-token', token)
                .send({});
            expect(res.status).toBe(400);
        });
        it("Should return 404 if account ID not found", async () => {
            const res = await req(server).post("/groups")
                .set('x-auth-token', token)
                .send({
                    groupName: "group",
                    account: mongoose.Types.ObjectId(),
                });
            expect(res.status).toBe(404);
            expect(res.text).toContain('Account not found');
        });
        it("Should return 403 if account managers accessing another account", async () => {
            const token1 = account_user_b.generateAuthToken();
            const res = await req(server).post("/groups")
                .set('x-auth-token', token1)
                .send({groupName: group_a1.groupName, account: group_a1.account});
            expect(res.status).toBe(403);
        });
        it("Should return 400 if group name already exists", async () => {
            const res = await req(server).post("/groups")
                .set('x-auth-token', token)
                .send({groupName: group_a1.groupName, account: group_a1.account});
            expect(res.status).toBe(400);
            expect(res.text).toContain('Group with the same name already exists under this account!');
        });
        it("Should return 200 if OK", async () => {
            const res = await req(server).post("/groups")
                .set('x-auth-token', token)
                .send({groupName: 'group', account: account_a._id});
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('groupName', 'group');

        });
    });

    describe("Test GET /by_id/:id", () => {
        it("should return 404 if group not found", async () => {
            const res = await req(server)
                .get('/groups/by_id/' + mongoose.Types.ObjectId().toHexString())
                .set('x-auth-token', token)
                .send();
            expect(res.status).toBe(404);
        });

        it("should return 200 if OK", async () => {
            const res = await req(server).get(`/groups/by_id/${group_a1._id}`)
                .set('x-auth-token', token)
                .send();
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty("id", group_a1._id.toHexString());
            expect(res.body).toHaveProperty("groupName", group_a1.groupName);
            expect(res.body).toHaveProperty("account");
        });
    });

    describe("Test GET /by_name/:name", () => {
        function exec(name) {
            return req(server).get('/groups/by_name/' + name)
                .set('x-auth-token', token)
                .send();
        }

        it('Should return 404 if group name not found', async () => {
            const res = await exec('name');
            expect(res.status).toBe(404);
            expect(res.text).toContain('Group not found!');
        });

        it('Should return 200 and group object', async () => {
            const res = await exec(group_a1.groupName);
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('groupName', group_a1.groupName);
        })
    });

    // get groups by account id
    describe("Test GET /groups/:account_id", () => {
        it('Should return 200 and a list of groups', async () => {
            const res = await req(server).get('/groups/by_account/' + account_a._id)
                .set('x-auth-token', token)
                .send();

            expect(res.status).toBe(200);
            expect(res.body.length).toBe(3);
            expect(res.body[0]).toHaveProperty('groupName', group_a1.groupName);
            expect(res.body[1]).toHaveProperty('groupName', group_a2.groupName);
        });
    });

    describe("Test PUT /groups/:id", () => {
        function exec(usr, data, id) {
            const _token = usr.generateAuthToken();
            return req(server).put('/groups/' + id)
                .set('x-auth-token', _token).send(data);
        }

        it('Should return 403 if unauthorized account manager access', async () => {
            const res = await exec(account_user_b, {groupName: 'test'}, group_a1._id);
            expect(res.status).toBe(403);
        });

        // it('Should return 400 if invalid data submitted', async () => {
        //     const res = await exec(account_user_a, {}, group_a1._id);
        //     expect(res.status).toBe(400);
        // });

        it('Should return 400 if another group exists with the same name in the same account', async () => {
            const res = await exec(account_user_a, {groupName: 'group_a2', account: account_a._id}, group_a1._id);
            expect(res.status).toBe(400);
            expect(res.text).toContain('Other group with the same name already exists!');
        });

        it('Should return 200 and updated group', async () => {
            const res = await exec(account_user_a, {
                groupName: 'group_a11',
                account: account_a._id,
                address: {longitude: '35', latitude: '35'}
            }, group_a1._id);
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('groupName', 'group_a11');
            expect(res.body.address).toHaveProperty('longitude', '35');
        });
    });

    describe('Test DELETE /groups/:id', () => {

        function exec(usr, id) {
            const _token = usr.generateAuthToken();
            return req(server).delete('/groups/' + id).set('x-auth-token', _token).send();
        }

        it('Should return 404 if group not found', async () => {
            const res = await exec(account_user_a, mongoose.Types.ObjectId());
            expect(res.status).toBe(400);
            expect(res.text).toContain('Group not found');
        });
        //
        it('Should return 403 if unauthorized access', async () => {
            const res = await exec(account_user_b, group_a1._id);
            expect(res.status).toBe(403);
            expect(res.text).toContain('Forbidden');

        });
        //
        it('Should return 200 and deleted group', async () => {
            const res = await exec(account_user_a, group_a2._id);
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('groupName', group_a2.groupName);
        });
    });

    describe('Test POST /path/:id/:pathName', () => {
        function exec(usr, name, group_id) {
            const _token = usr.generateAuthToken();
            return req(server)
                .post(`/groups/path/${group_id}/${name}`)
                .set('x-auth-token', _token)
                .send();
        }

        it('Should return 404 if group not found', async () => {
            const res = await exec(root1, 'path', mongoose.Types.ObjectId().toHexString());
            expect(res.status).toBe(404);
            expect(res.text).toContain('Group not found!');
        });
        //
        it('Should return 403 if unauthorized access to a group from account manager', async () => {
            const res = await exec(account_user_b, 'path', group_a1._id);
            expect(res.status).toBe(403);
            expect(res.text).toContain('Forbidden');
        });
        //
        it('Should return 403 if unauthorized access to a group from group admin', async () => {
            const res = await exec(group_user_a2, 'path', group_a1._id);
            expect(res.status).toBe(403);
            expect(res.text).toContain('Forbidden');
        });
        //
        it('Should return 400 if path name already exists in the same group', async () => {
            const path = await new Path({pathName: 'path', group: group_a1._id}).save();
            const res = await exec(group_user_a1, 'path', group_a1._id);
            expect(res.status).toBe(400);
            expect(res.text).toContain('Path name already exists on the same group!');
        });

        it('Should return 200 and add path and return group', async () => {
            const res = await exec(group_user_a1, 'path_a1', group_a1._id);
            expect(res.status).toBe(200);
            expect(res.body.paths.length).toBe(1);
        });

    });

    describe('Test PUT /path/:id/:oldPathName/:pathName', () => {
        function exec(usr, group_id, oldName, newName) {
            const _token = usr.generateAuthToken();
            return req(server)
                .put(`/groups/path/${group_id}/${oldName}/${newName}`)
                .set('x-auth-token', _token)
                .send();
        }

        it('Should return 404 if group not found', async () => {
            const res = await exec(root1, mongoose.Types.ObjectId().toHexString(), 'path', 'path1');
            expect(res.status).toBe(404);
            expect(res.text).toContain('Group not found');
        });

        it('Should return 403 if unauthorized access to a group', async () => {
            const res = await exec(group_user_a2, group_a1._id, 'path', 'path1');
            expect(res.status).toBe(403);
            expect(res.text).toContain('Forbidden');
        });

        it('Should return 400 if old path does not exist', async () => {
            const res = await exec(root1, group_a1._id, 'noPath', 'path1');
            expect(res.status).toBe(404);
            expect(res.text).toContain('Path not found');
        });

        it('Should return 400 if new path name already exists', async () => {
            let path = new Path({pathName: "My-Path", group: group_a1._id});
            path = await path.save();
            const res = await exec(root1, group_a1._id, 'path', 'My-Path');
            expect(res.status).toBe(400);
            expect(res.text).toContain('Path name already exists!');
        });

        it('Should return 200 updated path', async () => {
            const res = await exec(root1, group_a1._id, 'path', 'new-path');
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('pathName', 'new-path');
        });
    });

    describe('Test GET /path/:id', () => {
        function exec(usr, id){
            const _token = usr.generateAuthToken();
            return req(server)
                .get(`/groups/path/${id}`)
                .set('x-auth-token', _token)
                .send();
        }

        it('Should return 404 if group not found', async () => {
            const res = await exec(root1, mongoose.Types.ObjectId().toHexString());
            expect(res.status).toBe(404);
            expect(res.text).toContain('group not found');
        });

        it('Should return 403 if unauthorized access to a group', async () => {
            const res = await exec(group_user_a2, group_a1._id);
            expect(res.status).toBe(403);
            expect(res.text).toContain('Forbidden');
        });

        it('Should return 200 with list of paths', async () => {
            const res = await exec(group_user_a1, group_a1._id);
            expect(res.status).toBe(200);
            expect(res.body.length).toBeTruthy();
            expect(res.body[0]).toHaveProperty('pathName')
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

}
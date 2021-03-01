const request = require('supertest');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const {Account} = require('../../models/account');
const {Group} = require('../../models/group');
const {User} = require('../../models/user');

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

describe('Testing /users', () => {
    beforeAll(async () => {
        server = require('../../index');
        await populate();
    });
    afterAll(async () => {
        await server.close();
        await Account.remove({});
        await Group.remove({});
        await User.remove({});
    });

    describe('/register', () => {
        afterAll(async () => {
            await User.remove({name: 'user'});
        })

        function exec() {
            return {
                name: 'user',
                email: 'user@mail.com',
                phone: '123456789',
                password: 'password',
                role: 'group',
                account: account_a._id,
                group: group_a1._id
            };
        }

        it('Should return 401 if user not logged in', async () => {
            const usr = exec();
            const res = await request(server).post('/users/register').send(usr);
            expect(res.status).toBe(401);
        });

        it('Should return 403 if group user trying to create user', async () => {
            const token = group_user_a1.generateAuthToken();
            const usr = exec();
            const res = await request(server).post('/users/register')
                .set('x-auth-token', token)
                .send(usr);
            expect(res.status).toBe(403);
            expect(res.text).toContain('Forbidden- action needs higher user access level');
        });

        it('Should return 403 if account manager trying to create user in another account', async () => {
            const token = account_user_b.generateAuthToken();
            const usr = exec();
            const res = await request(server).post('/users/register')
                .set('x-auth-token', token)
                .send(usr);
            expect(res.status).toBe(403);
            expect(res.text).toContain('Forbidden- trying to access other account');
        });

        it('Should return 404 if group does not exists', async () => {
            const token = account_user_a.generateAuthToken();
            const usr = exec();
            usr.group = mongoose.Types.ObjectId();
            const res = await request(server).post('/users/register')
                .set('x-auth-token', token)
                .send(usr);
            expect(res.status).toBe(404);
            expect(res.text).toContain('Group not found');
        });

        it('Should return 403 if group does not belong to user account', async () => {
            const token = account_user_a.generateAuthToken();
            const usr = exec();
            usr.group = group_b1._id;
            const res = await request(server).post('/users/register')
                .set('x-auth-token', token)
                .send(usr);
            expect(res.status).toBe(403);
            expect(res.text).toContain('Forbidden- trying to access group from another account');
        });

        it('Should return 403 if account admin tries to create root or account admins', async () => {
            const token = account_user_a.generateAuthToken();
            const usr = exec();
            usr.role = 'root';
            let res = await request(server).post('/users/register')
                .set('x-auth-token', token)
                .send(usr);
            expect(res.status).toBe(403);
            expect(res.text).toContain('Forbidden');
        });

        it('Should return 400 if email already exists', async () => {
            const token = account_user_a.generateAuthToken();
            const usr = exec();
            usr.email = root1.email;
            const res = await request(server).post('/users/register')
                .set('x-auth-token', token)
                .send(usr);
            expect(res.status).toBe(400);
            expect(res.text).toContain('User email already exists');
        });

        it('Should return 200 if OK', async () => {
            const token = account_user_a.generateAuthToken();
            const usr = exec();
            usr.group = group_a1._id;
            const res = await request(server).post('/users/register')
                .set('x-auth-token', token)
                .send(usr);
            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('_id');
        });

    });

    describe('/login', () => {

        it('Should return 400 if invalid data submitted', async () => {
            const res = await request(server).post('/users/login').send({});
            expect(res.status).toBe(400);
        });

        it('Should return 404 if wrong email', async () => {
            const res = await request(server).post('/users/login').send({
                email: 'mail@email.com',
                password: 'password'
            });
            expect(res.status).toBe(404);
            expect(res.text).toContain('Wrong email or password');
        });

        it('Should return 404 if invalid password', async () => {
            const res = await request(server).post('/users/login').send({email: root1.email, password: 'xyz'});
            expect(res.status).toBe(404);
            expect(res.text).toContain('Wrong email or password');
        });

        it('Should return 200 and name, email', async () => {
            const res = await request(server).post('/users/login').send({email: root1.email, password: '123456'});
            expect(res.status).toBe(200);
            expect(res.text).toContain('name', root1.name);
        });

    });

    // get by id
    describe('/:id', () => {

        it('should return user when root search', async () => {
           const token = root1.generateAuthToken();
           const res = await request(server).get('/users/'+group_user_a1._id)
               .set('x-auth-token', token).send();
           expect(res.status).toBe(200);
           expect(res.body.length).toBe(1);
           expect(res.body[0]).toHaveProperty('_id', group_user_a1._id.toHexString());
        });

        it('should return nobody when account manager tries searching another account user', async () => {
            const token = account_user_b.generateAuthToken();
            const res = await request(server).get('/users/'+group_user_a1._id)
                .set('x-auth-token', token).send();
            expect(res.status).toBe(200);
            expect(res.body.length).toBe(0);
        });
    });

    // search by name, phone, email, or role
    describe('/search/:key/:value', () => {

        it('Should return 403 if group admin trying to access', async () => {
            const token = group_user_a1.generateAuthToken();
            const res = await request(server).get(`/users/search/name/group_admin`)
                .set('x-auth-token', token).send();
            expect(res.status).toBe(403);
            expect(res.text).toContain('Forbidden');
        });

        it('Should return 200 with data', async () => {
            const token = account_user_a.generateAuthToken();
            const res = await request(server).get(`/users/search/name/gr`)
                .set('x-auth-token', token).send();
            expect(res.status).toBe(200);
            expect(res.body.length).toBe(2);
            expect(res.body[0]).toHaveProperty('name', 'group-user-a1');
        });
    });

    // search by account id
    describe('/account/:id', () => {
        it('should return 403 if account manager try searching in another account', async () => {
            const token = account_user_b.generateAuthToken();
            const res = await request(server).get('/users/account/' + account_a._id)
                .set('x-auth-token', token)
                .send();
            expect(res.status).toBe(403);
            expect(res.text).toContain('Forbidden- trying to access other account');
        });

        it('should return 200 and 2 users when searching using account admin', async () => {
            const token = account_user_a.generateAuthToken();
            const res = await request(server).get('/users/account/' + account_a._id)
                .set('x-auth-token', token).send();
            expect(res.status).toBe(200);
            expect(res.body.length).toBe(3);
        });
    });

    // searching by group id
    describe('/group/:id', () => {
        // return 200 and data
        it('Should return 200 and data', async () => {
            const token = account_user_a.generateAuthToken();
            const res = await request(server).get('/users/group/' + group_a1._id)
                .set('x-auth-token', token).send();
            expect(res.status).toBe(200);
            expect(res.body.length).toBe(1);
            expect(res.body[0]).toHaveProperty('name', 'group-user-a1')


        });

    });

    // Edit user
    describe('/:id', () => {

        it('Should return 404 if user not found', async () => {
            const token = account_user_a.generateAuthToken();
            const res = await request(server).put('/users/60185f98284ead069ba44400')
                .set('x-auth-token', token)
                .send({name: 'User-1'});
            expect(res.status).toBe(404);
            expect(res.text).toContain('User not found');
        });

        it('Should return 403 if account manager trying to access another account user', async () => {
            const token = account_user_a.generateAuthToken();
            const res = await request(server).put('/users/' + group_user_b1._id)
                .set('x-auth-token', token)
                .send({name: 'User-1'});
            expect(res.status).toBe(403);
            expect(res.text).toContain('Forbidden- trying to access other account');
        });

        // 200 if OK
        it('should return 200 with updated data ', async () => {
            let user = new User({
                name: 'user',
                email: 'user@mail.com',
                password: '123465',
                role: 'account',
                account: account_a._id
            });
            user = await account_user_a.save();
            const token = root1.generateAuthToken();
            const res = await request(server).put('/users/' + user._id.toHexString())
                .set('x-auth-token', token)
                .send({name: 'User-1', phone: '123456'});
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('name', 'User-1');
            expect(res.body).toHaveProperty('phone', '123456');

            await User.findByIdAndRemove(user._id);
        });
    });

    // change user password by himself
    describe('/change_password/:id/:password/:oldPassword', () => {

        it('Should return 404 if user not found', async () => {
            const token = group_user_a1.generateAuthToken();
            const res = await request(server).put('/users/change_password/60185f98294ead069ba44408/password/oldPassword')
                .set('x-auth-token', token).send();
            expect(res.status).toBe(404);
            expect(res.text).toContain('User not found!');
        });

        it('Should return 403 if user changing others password', async () => {
            const token = group_user_a1.generateAuthToken();
            const res = await request(server).put('/users/change_password/' + group_user_b1._id + '/password/oldPassword')
                .set('x-auth-token', token).send();
            expect(res.status).toBe(403);
            expect(res.text).toContain('Forbidden');
        });

        it('Should return 403 if user submitted wrong old password', async () => {
            const token = group_user_a1.generateAuthToken();
            const res = await request(server).put('/users/change_password/' + group_user_a1._id + '/new/wrong')
                .set('x-auth-token', token).send();
            expect(res.status).toBe(403);
            expect(res.text).toContain('Forbidden');
        });

        it('Should return 200 and return user', async () => {
            const token = group_user_a1.generateAuthToken();
            const res = await request(server).put('/users/change_password/' + group_user_a1._id + '/new/123456')
                .set('x-auth-token', token).send();
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('name', group_user_a1.name);
        });
    });

    // reset password by root admins or by account managers to group admins
    describe('/reset_password/:id/password', () => {

        it('Should return 404 if user not found', async () => {
            const token = account_user_a.generateAuthToken();
            const res = await request(server).put('/users/reset_password/60185f98284ead069ba44400/password')
                .set('x-auth-token', token).send();
            expect(res.status).toBe(404);
            expect(res.text).toContain('User not found!');
        });

        //
        it('Should return 403 if account resetting other group admins password', async () => {
            const token = account_user_a.generateAuthToken();
            const res = await request(server).put('/users/reset_password/' + group_user_b1._id + '/password')
                .set('x-auth-token', token).send();
            expect(res.status).toBe(403);
            expect(res.text).toContain('Forbidden');
        });
        // return 200 if ok
        it('Should return 200 ', async () => {
            const token = account_user_a.generateAuthToken();
            const res = await request(server).put('/users/reset_password/' + group_user_a1._id + '/password')
                .set('x-auth-token', token).send();
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('name', group_user_a1.name);
        });
    });

    // delete user
    describe('DELETE /:id', () => {

        it('Should return 404 if user not found', async () => {
            const token = root1.generateAuthToken();
            const res = await request(server).delete('/users/60185f98284ead069ba44400')
                .set('x-auth-token', token).send();
            expect(res.status).toBe(404);
            expect(res.text).toContain('User not found!');
        });

        it('Should return 403 if account manager trying to delete user from another group', async () => {
            const token = account_user_a.generateAuthToken();
            const res = await request(server).delete('/users/' + group_user_b1._id)
                .set('x-auth-token', token).send();
            expect(res.status).toBe(403);
            expect(res.text).toContain('Forbidden');
        });
        // Should return 200 if OK
        it('Should return 403 if account manager trying to delete user from another group', async () => {
            const token = account_user_a.generateAuthToken();
            const res = await request(server).delete('/users/' + group_user_a1._id)
                .set('x-auth-token', token).send();
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('name', group_user_a1.name);
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

};
const express = require("express");
const bcrypt = require("bcrypt");
const Joi = require("joi");
Joi.objectId = require("joi-objectid")(Joi);
const _ = require("lodash");
const mongoose = require("mongoose");
const { authenticate, account_auth, account_manager_auth } = require("../middlewares/auth");
const validateId = require("../middlewares/validateID");
const {Group} = require("../models/group");
const {User, validateUser, validateLogin} = require("../models/user");

const router = express();

// Register new user
router.post("/register",[authenticate, account_manager_auth], async (req, res) => {
        const _user = _.pick(req.body, [
            "name",
            "email",
            "phone",
            "password",
            "role",
            "account",
            "group",
        ]);

        _user.name = _user.name.toLowerCase();
        _user.email = _user.email.toLowerCase();
        // return 400 if invalid data submitted
        const {error} = validateUser(_user);
        if (error) return res.status(400).send(error.details[0].message);

        // return 403 if account user tries to create root or account user
        if (req.user.role === "account" && _user.role !== "group")
            return res.status(403).send("Forbidden");

        // return 400 if user email already exists
        let user = await User.findOne({email: _user.email});
        if (user) return res.status(400).send("User email already exists");

        const salt = await bcrypt.genSalt(10);
        _user.password = await bcrypt.hash(_user.password, salt);

        user = new User(_user);
        user = await user.save();
        user = _.pick(user, [
            "_id",
            "name",
            "email",
            "phone",
            "role",
            "account",
            "group",
            "createdOn",
        ]);
        res.status(201).send(user);
    });

// login user
router.post("/login", async (req, res) => {
    const validLogin = validateLogin(req.body);
    const {error} = validLogin;
    if (error) return res.status(400).send(error.details[0].message);

    let user = await User.findOne({email: req.body.email});
    if (!user) return res.status(404).send("Wrong email or password");
    const hasValidPassword = await bcrypt.compare(
        req.body.password,
        user.password
    );
    if (!hasValidPassword) return res.status(404).send("Wrong email or password");

    const token = user.generateAuthToken(user._id);
    res
        .header("x-auth-token", token)
        .send(
            {
                user: _.pick(user, [
                    "_id",
                    "name",
                    "email",
                    "phone",
                    "role",
                    "account",
                    "group",
                ]),
                token
            }

        );
});

///////////////////////////  read users //////////////////////////

// by id
router.get('/:id', [authenticate, account_auth, validateId], async (req, res) => {

    const qry = {_id: req.params.id};
    if (req.user.role === "account") {
        qry.account = req.user.account;
        qry.role = "group";
    };

    const users = await User.find(qry)
        .select("_id name email phone role createdOn account group photo")
        .populate("group ", "groupName")
        .populate("account", "accountName")
        .sort("name");
    return res.send(users);
});

// by name, email, phone
router.get("/search/:key/:value", [authenticate, account_auth], async (req, res) => {
    req.params.value = req.params.value.toLowerCase();
    const qry = {};
    qry[req.params.key] = new RegExp("^" + req.params.value + ".*", "i");

    if (req.user.role === "account") {
        qry.account = req.user.account;
        qry.role = "group";
    }

    const users = await User.find(qry)
        .select("_id name email phone role createdOn account group photo")
        .populate("group ", "groupName")
        .populate("account", "accountName")
        .sort("name");
    return res.send(users);
});

// by account
router.get("/account/:id", [authenticate, account_auth, validateId], async (req, res) => {
    const id = mongoose.Types.ObjectId(req.params.id);
    // return 403 if account manager trying to access another account
    if (req.user.role === "account" && req.user.account !== req.params.id)
        return res.status(403).send("Forbidden- trying to access other account");

    const users = await User.find({
        account: id,
    })
        .select("_id name email phone role createdOn account group photo")
        .populate("group ", "groupName")
        .populate("account", "accountName")
        .sort("name");
    return res.send(users);
});

// by group
router.get("/group/:id", [authenticate, account_auth, validateId], async (req, res) => {
    const id = mongoose.Types.ObjectId(req.params.id);
    const qry = {group: id};

    if (req.user.role === "account") {
        qry.account = mongoose.Types.ObjectId(req.user.account);
        qry.role = "group";
    }
    const users = await User.find(qry)
        .select("_id name email phone role createdOn account group photo")
        .populate("group ", "groupName")
        .populate("account", "accountName")
        .sort("name");
    return res.send(users);
});

//////////////////  update users /////////////////////////
// update name, phone, group
router.put("/:id", [authenticate, account_auth, validateId], async (req, res) => {
    let user = await User.findById(req.params.id);
    // return 404 if user not found
    if (!user) return res.status(404).send("User not found");

    // return 403 if account manager trying to access user from another account
    if (req.user.role === "account" && user.account !== req.user.account)
        return res.status(403).send("Forbidden- trying to access other account");

    const usr = {
        name: req.body.name ? req.body.name : user.name,
        phone: req.body.phone ? req.body.phone : user.phone,
    };
    if (user.role === "group") {
        usr.group = req.body.group ? req.body.group : user.group.toHexString();
    }

    const schema = {
        name: Joi.string().min(3).max(50).required(),
        phone: Joi.string().max(20),
        group: Joi.objectId(),
    };

    const {error} = Joi.validate(usr, schema);
    // return 400 if invalid new user data
    if (error) return res.status(400).send(error.details[0].message);

    if (user.role === "group") {
        // return 404 if group not found
        const group = await Group.findById(usr.group);
        if (!group) return res.status(404).send("group not found");

        // return 403 if group belongs to another account
        if (group.account.toHexString !== user.account.toHexString)
            return res
                .status(403)
                .send("Forbidden- trying to access other account");
    }

    // return 200 if OK
    user = await User.findByIdAndUpdate(req.params.id, usr, {new: true});
    user = _.pick(user, ["_id", "name", "email", "phone", "role", "createdOn"]);
    res.status(200).send(user);
});

// change password for user to change  his own password
router.put("/change_password/:id/:password/:oldPassword", [authenticate, validateId], async (req, res) => {
    // return 404 if user not found
    let user = await User.findById(req.params.id);
    if (!user) return res.status(404).send("User not found!");
    const hasCorrectPassword = await bcrypt.compare(
        req.params.oldPassword,
        user.password
    );
    // User can change password for himself.
    if (req.user.id === req.params.id && hasCorrectPassword) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(req.params.password, salt);
        user = await User.findByIdAndUpdate(
            req.params.id,
            {password: hashedPassword},
            {new: true}
        );
        user = _.pick(user, [
            "_id",
            "name",
            "email",
            "phone",
            "role",
            "createdOn",
        ]);
        return res.status(200).send(user);
    }

    // return 403
    return res.status(403).send("Forbidden");
});

// reset password
router.put("/reset_password/:id/:password", [authenticate, account_auth, validateId], async (req, res) => {
    let user = await User.findById(req.params.id);
    if (!user) return res.status(404).send("User not found!");
    if (
        req.user.role === "root" ||
        (req.user.account === user.account.toHexString() &&
            req.user.role === "account")
    ) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(req.params.password, salt);
        user = await User.findByIdAndUpdate(
            req.params.id,
            {password: hashedPassword},
            {new: true}
        );
        user = _.pick(user, [
            "_id",
            "name",
            "email",
            "phone",
            "role",
            "createdOn",
        ]);
        return res.status(200).send(user);
    }

    // return 403 if unauthorized attempt to change password
    return res.status(403).send("Forbidden");
});

////////////////  delete users /////////////////////////
router.delete("/:id", [authenticate, account_auth, validateId], async (req, res) => {
    let user = await User.findById(req.params.id);
    if (!user) return res.status(404).send("User not found!");
    if (
        req.user.role === "root" ||
        (req.user.account === user.account.toHexString() &&
            req.user.role === "account")
    ) {
        user = await User.findByIdAndRemove(req.params.id);
        user = _.pick(user, [
            "_id",
            "name",
            "email",
            "phone",
            "role",
            "createdOn",
        ]);
        return res.status(200).send(user);
    }

    // return 403 if unauthorized attempt to change password
    return res.status(403).send("Forbidden");
});

module.exports = router;

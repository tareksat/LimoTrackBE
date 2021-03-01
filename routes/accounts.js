const mongoose = require("mongoose");
const express = require("express");
const _ = require("lodash");
const {authenticate, account_auth, root_auth} = require("../middlewares/auth");
const validateId = require("../middlewares/validateID");
const {Account, validateAccount} = require("../models/account");

const router = express();

// create
router.post("/create", [authenticate, root_auth], async (req, res) => {
    // return 400 if invalid
    const validationResult = validateAccount(req.body);
    const {error} = validationResult;
    if (error) return res.status(400).send(error.details[0].message);

    // return 400 if account name already exists
    const oldAccount = await Account.findOne({
        accountName: req.body.accountName,
    });
    if (oldAccount) return res.status(400).send("account name already exists!");

    // insert into database
    let account = new Account({accountName: req.body.accountName});
    account = await account.save();

    // return 200 and inserted account
    res.send(_.pick(account, ["accountName", "_id", "createdOn"]));
});

// Read

// by id
router.get("/:id", [authenticate, root_auth, validateId], async (req, res) => {
    const id = req.params.id;
    const account = await Account.findById(id);
    // return 404 if account not found
    if (!account) return res.status(404).send("Not found!");
    // return 200 and fetched account
    res.send(account);
});

// get all accounts
router.get("/", [authenticate, root_auth], async (req, res) => {
    const accounts = await Account.find({});

    res.send(accounts);
});

// by name
router.get("/by_name/:accountName", [authenticate, root_auth], async (req, res) => {
    const accountName = req.params.accountName;
    const qry = {};
    qry.accountName = new RegExp("^" + accountName + ".*", "i");

    const accounts = await Account.find(qry);

    // return 200 if OK
    res.send(accounts);
});

// Update
// name
router.put("/:id", [authenticate, account_auth, validateId], async (req, res) => {
    const id = req.params.id;
    // return 403 if account manager trying to change name of another account
    if((req.user.role==='account') && (req.user.account !== id)) return res.status(403).send('Forbidden');

    // return 400 if invalid
    const validationResult = validateAccount(req.body);
    const {error} = validationResult;
    if (error) return res.status(400).send(error.details[0].message);

    // return 400 if account name already exists
    const oldAccount = await Account.findOne({
        accountName: req.body.accountName,
    });
    if (oldAccount) return res.status(400).send("account name already exists!");

    const account = await Account.findByIdAndUpdate(
        id,
        {accountName: req.body.accountName},
        {new: true}
    );
    // return 404 if account not found
    if (!account) return res.status(404).send("account not found!");
    // return 200 if OK
    res.send(account);
});

router.put("/set_location/:id", [authenticate, account_auth, validateId], async (req, res) => {
    const id = req.params.id;

    // return 403 if account manager trying to change name of another account
    if((req.user.role==='account') && (req.user.account !== id)) return res.status(403).send('Forbidden');

    // return 400 if invalid location data
    const {longitude, latitude} = req.body;
    if (!latitude || !longitude)
        return res.status(400).send('Location error');

    const account = await Account.findByIdAndUpdate(
        id,
        {location: { longitude, latitude }},
        {new: true}
    );
    // return 404 if account not found
    if (!account) return res.status(404).send("account not found!");
    // return 200 if OK
    res.send(account);
});

// Delete
router.delete("/:id", [authenticate, root_auth, validateId], async (req, res) => {
    const id = req.params.id;
    const account = await Account.findByIdAndRemove(id);
    if (!account) return res.status(404).send('Account not found');
    res.send(account);
});

module.exports = router;

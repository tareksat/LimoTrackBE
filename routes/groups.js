const mongoose = require("mongoose");
const express = require("express");
const _ = require("lodash");
const {authenticate, account_auth} = require("../middlewares/auth");
const validateId = require("../middlewares/validateID");
const {Group, validateGroup} = require("../models/group");
const {Account} = require("../models/account");
const { Path,  validatePath}  = require('../models/path');

const router = express();

// create
router.post("/", [authenticate, account_auth], async (req, res) => {
    // return 400 if not valid req.body
    const {error} = validateGroup(req.body);

    if (error) return res.status(400).send(error.details[0].message);

    // return 403 if account manager creating group in another account
    if (req.user.role === 'account' && req.body.account !== req.user.account)
        return res.status(403).send('Forbidden');

    // return 404 if account id not found in database
    const groupAccount = await Account.findById(req.body.account);
    if (!groupAccount) res.status(404).send("Account not found");

    const {groupName, account, address} = req.body;

    // return 400 if group name is already existing in the same account
    const oldGroup = await Group.findOne({groupName, account});
    if (oldGroup)
        return res
            .status(400)
            .send("Group with the same name already exists under this account!");
    // create group return 200
    let group = new Group({groupName, account, address});
    group = await group.save();
    res.send(group.toJSON());
});

// get by id
router.get("/by_id/:id", [authenticate, account_auth, validateId], async (req, res) => {
    // return 404 if group not found
    const group = await Group.findById(req.params.id).populate("account paths");
    if (!group) return res.status(404).send("Group not found!");

    // return 200 and group if found
    res.send(group.toJSON());
});

// get by name
router.get("/by_name/:name/:account", [authenticate, account_auth], async (req, res) => {

    const qry = {account: req.params.account};
    qry.groupName = new RegExp("^" + req.params.name + ".*", "i");

    const groups = await Group.find(qry).populate("account paths");

    // return 200 and group if found
    res.send(groups);
});

// get all groups by account
router.get("/by_account/:id", [authenticate, account_auth, validateId], async (req, res) => {
    // return 200 and groups
    const _groups = await Group.find({
        account: req.params.id,
    }).populate("account paths");

    let groups = [];
    _groups.map((grp) => {
        groups.push(grp.toJSON());
    });

    res.send(groups);
});

// update
router.put("/:id", [authenticate, account_auth, validateId], async (req, res) => {

    // return 403 if account manager tries to access another account
    let _group = await Group.findById(req.params.id);
    if(req.user.role==='account' && _group.account.toHexString() !== req.user.account) return res.status(403).send('Forbidden');

    // return 400 if invalid group data
    // const {error} = validateGroup(req.body);
    // if (error) res.status(400).send(error.details[0].message);

    // return 400 if same name already exists
    let group = await Group.findOne({groupName: req.body.groupName, account: req.body.account});
    if (group)
        res.status(400).send("Other group with the same name already exists!");

    // return 200 if OK
    group = await Group.findByIdAndUpdate(
        req.params.id,
        {
            groupName: req.body.groupName,
            // 'address.longitude': req.body.address.longitude,
            // 'address.latitude': req.body.address.latitude
        },
        {new: true}
    );
    if (!group) return res.status(404).send("group not found!");
    res.send(group.toJSON());
});

// delete
router.delete("/:id", [authenticate, account_auth, validateId], async (req, res) => {
    let group = await Group.findById(req.params.id);

    // return 404 if group not found
    if(!group)
        return res.status(400).send('Group not found');

    // return 403 if unauthorized access
    if(req.user.role==='account' && req.user.account !== group.account.toHexString())
        return res.status(403).send('Forbidden');

    // return 200 and deleted group
    group = await Group.findByIdAndRemove(req.params.id);
    res.send(group.toJSON());
});

// add path
router.post("/path/:id/:pathName", [authenticate, validateId], async (req, res) => {
    const group_id = req.params.id;
    const pathName = req.params.pathName;

    let group = await Group.findById(group_id);

    // return 404 if group not found
    if (!group) return res.status(404).send("Group not found!");

    // return 403 if unauthorized access to a group

    if(( req.user.role==='account' && req.user.account !== group.account.toHexString()) ||
        (req.user.role==='group' && req.user.group.id!==group_id))
        return res.status(403).send('Forbidden');

    // return 400 if path name already exists in the same group
    const _path = {
        pathName,
        group: group_id
    }

    // return 400 if invalid path data
    const { error } = validatePath(_path);
    if(error)
        return res.status(400).send(error.details[0].message);

    let path = await Path.findOne({ pathName, group:group_id })
    if(path)
        return res.status(400).send("Path name already exists on the same group!");

    // add path and return group
    path = new Path({pathName, group: group_id});
    path = await path.save();

    group.paths.push(path._id);
    group = await Group.findByIdAndUpdate(
        group._id,
        {paths: group.paths},
        {new: true}
    ).populate('path');

    res.send(group.toJSON());
});

// rename path *********
router.put("/path/:id/:path_id/:pathName", [authenticate, validateId], async (req, res) => {
    const group_id = req.params.id;
    const path_id = req.params.path_id;
    const pathName = req.params.pathName;

    let group = await Group.findById(group_id);

    // return 404 if group not found
    if (!group) return res.status(404).send("Group not found!");

    // return 403 if unauthorized access to a group
    if(( req.user.role==='account' && req.user.account !== group.account.toHexString()) ||
        (req.user.role==='group' && req.user.group.id!==group_id))
        return res.status(403).send('Forbidden');

    let path = await Path.findOne({ group: group_id, _id: path_id });

    // return 400 if old path doesn't exist
    if (!path)
        return res.status(404).send("Path not found");

    // return 400 if new path name already exists
    let _path = await Path.findOne({ group: group_id, pathName });
    if (_path)
        return res.status(400).send("Path name already exists!");

    // update path and return group
    path = await Path.findByIdAndUpdate(path._id, {pathName}, {new: true});

    res.send(path);
});

// get group paths
router.get("/path/:id", [authenticate, validateId], async (req, res) => {
    const group_id = req.params.id;

    let group = await Group.findById(group_id)
        .populate("paths", "pathName")
        .select("paths");

    // return 404 if group not found
    if (!group) return res.status(404).send("group not found");

    // return 403 if unauthorized access to a group
    if(( req.user.role==='account' && req.user.account !== group.account.toHexString()) ||
        (req.user.role==='group' && req.user.group.id!==group_id))
        return res.status(403).send('Forbidden');

    // return 200 with list of paths

    res.send(group.paths);
});

// delete path



module.exports = router;

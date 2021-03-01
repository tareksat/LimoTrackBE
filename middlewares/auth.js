const jwt = require("jsonwebtoken");
const config = require("config");
const { Group } = require("../models/group");
const { Account } = require("../models/account");

function authenticate(req, res, next) {
  const token = req.header("x-auth-token");
  // check if token exists
  if (!token) return res.status(401).send("User is not logged in!");

  // validate token
  try {
    const decoded = jwt.verify(token, config.get("jwtPrivateKey"));
    req.user = decoded;
    next();
  } catch (ex) {
    res.status(400).send("bad token");
  }
}

function root_auth(req, res, next) {
  if (req.user.role !== "root") return res.status(403).send("Forbidden");
  next();
}

function account_auth(req, res, next) {
  if (req.user.role === "group") return res.status(403).send("Forbidden");
  next();
}

async function auth_group(req, res, next) {
  // return 404 if group not found
  let group = await Group.findById(req.params.id);
  if (!group) return res.status(404).send("Group not found!");

  // return 403 if account manager trying to view group from another account
  if (
    req.user.role === "account" &&
    req.user.account !== group.account.toHexString()
  )
    return res.status(403).send("Forbidden trying to access another account!");

  // return 403 if group admin trying to view other groups
  if (req.user.role === "group" && req.user.group !== group._id)
    return res
      .status(403)
      .send("Forbidden trying to access group in another account!");

  next();
}

async function account_manager_auth(req, res, next) {
  // for account users only
  if (req.user.role === "group")
    return res
      .status(403)
      .send("Forbidden- action needs higher user access level");
  else if (req.user.role === "account") {
    // return 403 if account doesn't belong to manager
    if (req.body.account !== req.user.account)
      return res.status(403).send("Forbidden- trying to access other account");

    // return 404 if account doesn't exists
    const account = await Account.findById(req.body.account);
    if (!account) return res.status(404).send("Account not found");

    // return 404 if group doesn't exists
    const group = await Group.findById(req.body.group);
    if (!group) return res.status(404).send("Group not found");

    // return 403 if group doesn't belong to user account
    if (group.account.toHexString() !== req.body.account)
      return res
        .status(403)
        .send("Forbidden- trying to access group from another account");
  }
  next();
}

module.exports = {
  authenticate,
  root_auth,
  account_auth,
  auth_group,
  account_manager_auth,
};

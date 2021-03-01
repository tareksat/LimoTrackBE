const mongoose = require("mongoose");
const Joi = require("joi");

const accountSchema = new mongoose.Schema({
  accountName: {
    type: String,
    minlength: 3,
    maxlength: 20,
    required: true,
  },
  location:{
    latitude: String,
    longitude: String
  },
  createdOn: {
    type: Date,
    default: Date.now(),
  },
});

accountSchema.methods.getJson = function () {
  return {
    id: this._id,
  };
};

const Account = mongoose.model("accounts", accountSchema);

function validateAccount(account) {
  const schema = {
    accountName: Joi.string().min(3).max(20).required(),
  };
  return Joi.validate(account, schema);
}

module.exports = { Account, validateAccount };

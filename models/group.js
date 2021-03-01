const mongoose = require("mongoose");
const Joi = require("joi");
Joi.objectId = require("joi-objectid")(Joi);

const groupSchema = new mongoose.Schema({
  groupName: {
    type: String,
    minlength: 3,
    maxlength: 20,
    required: true,
  },
  createdOn: {
    type: Date,
    default: Date.now(),
  },
  address: {
    longitude: String,
    latitude: String
  },
  account: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "accounts",
    required: true,
  },
  paths: {
    type: [{type: mongoose.Schema.Types.ObjectId, ref: 'paths'}],
    default: [],
  },
});

groupSchema.methods.toJSON = function () {
  return {
    _id: this._id,
    groupName: this.groupName,
    createdOn: this.createdOn,
    address: this.address ? this.address : "",
    account: this.account,
    paths: this.paths,
  };
};
const Group = mongoose.model("groups", groupSchema);

function validateGroup(group) {
  const schema = {
    groupName: Joi.string().min(3).max(20).required(),
    account: Joi.objectId().required(),
    address: Joi.string()
  };
  const result = Joi.validate(group, schema);
  return result;
}

module.exports = { Group, validateGroup };

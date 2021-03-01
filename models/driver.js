const mongoose = require("mongoose");
const Joi = require("joi");
Joi.objectId = require("joi-objectid")(Joi);

const driverSchema = new mongoose.Schema({
  name: {
    type: String,
    minLength: 3,
    maxLength: 20,
    required: true,
  },
  phone: {
    type: String,
    maxLength: 20,
    default: "",
  },
  address: {
    type: String,
    maxLength: 1024,
    default: "",
  },
  rating: {
    value: {
      type: Number,
      default: 0,
    },
    counts: {
      type: Number,
      default: 0,
    },
  },
  photo: {
    type: String,
    default: "",
  },
  car: {
    type: String,
    default: ''
  },
  createdOn: {
    type: Date,
    default: Date.now(),
  },
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "groups",
    required: true
  },
  account:{
    type: mongoose.Schema.Types.ObjectId,
    ref: "accounts",
    required: true
  }
});

const Driver = mongoose.model("drivers", driverSchema);

function validateDriver(driver) {
  const schema = {
    name: Joi.string().min(3).max(20).required(),
    phone: Joi.string().max(20),
    address: Joi.string().max(1024),
    photo: Joi.string(),
    car: Joi.string(),
    group: Joi.string().required(),
    account: Joi.string().required()
  };

  return Joi.validate(driver, schema);
}

module.exports = { driverSchema, Driver, validateDriver };

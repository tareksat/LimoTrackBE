const mongoose = require("mongoose");
const Joi = require("joi");
const jwt = require("jsonwebtoken");
const config = require("config");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    minlength: 3,
    maxlength: 50,
    required: true,
  },
  email: {
    type: String,
    maxlength: 50,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    maxlength: 1024,
    required: true,
  },
  phone: {
    type: String,
    maxlength: 20,
    default: "",
  },
  role: {
    type: String,
    enum: ["root", "account", "group"],
    required: true,
  },
  createdOn: {
    type: Date,
    default: Date.now(),
  },
  account: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "accounts",
    required: function () {
      if (this.role !== "root") return true;
      return false;
    },
  },
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "groups",
    required: function () {
      if (this.role === "group") return true;
      return false;
    },
  },
  photo: String,
});

userSchema.methods.generateAuthToken = function () {
  const token = jwt.sign(
    {
      id: this._id,
      name: this.name,
      email: this.email,
      role: this.role,
      group: this.group,
      account: this.account,
    },
    config.get("jwtPrivateKey")
  );
  return token;
};

userSchema.methods.getUser = function () {
  return {
    id: this._id,
    name: this.name,
    phone: this.phone,
    email: this.email,
    role: this.role,
    group: this.group,
    account: this.account,
    createdOn: this.createdOn,
  };
};

const User = mongoose.model("users", userSchema);

function validateUser(user) {
  if (user.role !== "root") {
  }
  const schema = {
    name: Joi.string().min(3).max(50).required(),
    email: Joi.string().max(50).email().required(),
    password: Joi.string().max(1024).required(),
    phone: Joi.string().max(20),
    role: Joi.string().required().valid("root", "account", "group"),
    account: user.role === "root" ? Joi.string() : Joi.string().required(),
    group: user.role === "group" ? Joi.string().required() : Joi.string(),
  };
  return Joi.validate(user, schema);
}

function validateLogin(user) {
  const schema = {
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  };

  return Joi.validate(user, schema);
}

module.exports = {
  userSchema,
  User,
  validateUser,
  validateLogin,
};

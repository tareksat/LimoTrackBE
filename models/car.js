const mongoose = require("mongoose");
const Joi = require("joi");
Joi.objectId = require("joi-objectid")(Joi);
const _ = require("lodash");

const carSchema = new mongoose.Schema({
  info: {
    name: {
      type: String,
      minLength: 3,
      maxLength: 20,
      required: true,
    },
    platNumber: {
      type: String,
      maxLength: 20,
      default: "",
    },
    fuelConsumptionRate: {
      type: Number,
      default: 0,
    },
    gpsDevice: {
      type: String,
      required: true,
    },
    activationDate: {
      type: Date,
      default: Date.now(),
    },
    expirationDate: {
      type: Date,
    },
    simNumber: {
      type: String,
      maxLength: 20,
      default: "",
    },
    vin: {
      type: String,
      maxLength: 20,
      default: "",
    },
    engineNumber: {
      type: String,
      maxLength: 20,
      default: "",
    },
    color: {
      type: String,
      maxLength: 20,
      default: "",
    },
    tankSize: {
      type: Number,
      required: true,
    },
    path: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'paths',
      maxLength: 20,
      default: null,
    },
    driver: {
      type: String,
      default: '',
    },
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "groups",
      required: true,
    },
    account: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "accounts",
      required: true,
    },
    tokens: [String],
    photo: {
      type: String,
      default: "",
    },
  },
  installation: {
    installedBy: {
      type: String,
      maxLength: 20,
      default: "",
    },
    time: {
      type: Date,
      default: Date.now(),
    },
    company: {
      type: String,
      maxLength: 20,
      default: "",
    },
    location: {
      type: String,
      maxLength: 1024,
      default: "",
    },
    photos: [String],
  },
  alertSettings: {
    engineON: {
      type: Boolean,
      default: true,
    },
    engineOFF: {
      type: Boolean,
      default: true,
    },
    doorOpen: {
      type: Boolean,
      default: true,
    },
    doorClosed: {
      type: Boolean,
      default: true,
    },
    fuelLeak: {
      type: Boolean,
      default: true,
    },
    refuel: {
      type: Boolean,
      default: true,
    },
    speedAlert: {
      type: Boolean,
      default: true,
    },
    speedLimit: {
      type: Number,
      default: 100,
    },
    geoFence: {
      alert: {
        type: Boolean,
        default: false,
      },
      topLeft: {
        latitude: Number,
        longitude: Number,
      },
      bottomRight: {
        latitude: Number,
        longitude: Number,
      },
    },
  },
  dashBoard: {
    speed: { type: Number, default: 0 },
    odometer: { type: Number, default: 0 },
    fuelLevel: { type: Number, default: 0 },
    location: {
      longitude: Number,
      latitude: Number,
    },
    lastSeen: Date,
  },
  maintenance: {
    last: {
      time: Date,
      odometer: Number,
    },
    next: {
      time: Date,
      odometer: Number,
    },
  },
});

const Car = mongoose.model("cars", carSchema);

function validateCar(car) {
  const { info, installation, alertSettings, dashBoard, maintenance } = car;
  const validInfo = validateInfo(info);
  if (validInfo.error) return validInfo;
  const validInstallation = validateInstallation(installation);
  if (validInstallation.error) return validInstallation;
  const validAlert = validateAlertSettings(alertSettings);
  if (validAlert.error) return validInstallation;
  const validDashboard = validateDashboard(dashBoard);
  if (validDashboard.error) return validDashboard;
  const validMaintenance = validateMaintenance(maintenance);
  if (validMaintenance.error) return validMaintenance;

  return {};
}

function parseCar(obj) {
  const { info, installation, alertSettings, dashBoard, maintenance } = obj;
  const car = {
    info: parseInfo(info),
    installation: parseInstallation(installation),
    alertSettings: parseAlertSettings(alertSettings),
    dashBoard: parseDashboard(dashBoard),
    maintenance: parseMaintenance(maintenance),
  };
  return car;
}

function parseInfo(obj) {
  const info = _.pick(obj, [
    "name",
    "platNumber",
    "fuelConsumptionRate",
    "gpsDevice",
    "activationDate",
    "expirationDate",
    "simNumber",
    "vin",
    "engineNumber",
    "color",
    "tankSize",
    "path",
    "group",
    "account",
    "driver",
    "tokens",
    "photo",
  ]);
  return info;
}

function parseInstallation(obj) {
  const installation = _.pick(obj, [
    "installedBy",
    "time",
    "company",
    "location",
    "photos",
  ]);
  return installation;
}

function parseAlertSettings(obj) {
  const alertSettings = _.pick(obj, [
    "engineON",
    "engineOFF",
    "doorOpen",
    "doorClosed",
    "fuelLeak",
    "refuel",
    "speedAlert",
    "speedLimit",
    "geoFence",
  ]);
  return alertSettings;
}

function parseDashboard(obj) {
  const dashBoard = _.pick(obj, [
    "speed",
    "odometer",
    "fuelLevel",
    "location",
    "lastSeen",
  ]);
  return dashBoard;
}

function parseMaintenance(obj) {
  const maintenance = _.pick(obj, ["last", "next"]);
  return maintenance;
}

function validateInfo(info) {
  const schema = {
    name: Joi.string().min(3).max(20).required(),
    platNumber: Joi.string().max(20),
    fuelConsumptionRate: Joi.number(),
    gpsDevice: Joi.string().required(),
    activationDate: Joi.date(),
    expirationDate: Joi.date(),
    simNumber: Joi.string().max(20),
    vin: Joi.string().max(20),
    engineNumber: Joi.string().max(20),
    color: Joi.string().max(20),
    tankSize: Joi.number().required(),
    path: Joi.objectId(),
    //driver: Joi.string(),
    group: Joi.objectId().required(),
    account: Joi.objectId().required(),
    tokens: Joi.array(),
    photo: Joi.string(),
  };

  return Joi.validate(info, schema);
}

function validateInstallation(installation) {
  const schema = {
    installedBy: Joi.string().max(20),
    time: Joi.any(),
    company: Joi.string().max(20),
    location: Joi.string().max(20),
    photos: Joi.array(),
  };

  return Joi.validate(installation, schema);
}

function validateAlertSettings(AlertSettings) {
  const schema = {
    engineON: Joi.boolean(),
    engineOFF: Joi.boolean(),
    doorOpen: Joi.boolean(),
    doorClosed: Joi.boolean(),
    fuelLeak: Joi.boolean(),
    refuel: Joi.boolean(),
    speedAlert: Joi.boolean(),
    speedLimit: Joi.number(),
    geoFence: Joi.object({
      alert: Joi.boolean(),
      topLeft: Joi.object({ latitude: Joi.number(), longitude: Joi.number() }),
      bottomRight: Joi.object({
        latitude: Joi.number(),
        longitude: Joi.number(),
      }),
    }),
  };

  return Joi.validate(AlertSettings, schema);
}

function validateDashboard(Dashboard) {
  const schema = {
    speed: Joi.number(),
    odometer: Joi.number(),
    fuelLevel: Joi.number(),
    location: Joi.object({ longitude: Joi.number(), latitude: Joi.number() }),
    lastSeen: Joi.date(),
  };

  return Joi.validate(Dashboard, schema);
}

function validateMaintenance(Maintenance) {
  const schema = {
    last: Joi.object({ time: Joi.any(), odometer: Joi.number() }),
    next: Joi.object({ time: Joi.any(), odometer: Joi.number() }),
  };

  return Joi.validate(Maintenance, schema);
}

module.exports = {
  carSchema,
  Car,
  parseCar,
  parseInfo,
  parseInstallation,
  parseAlertSettings,
  parseDashboard,
  parseMaintenance,
  validateInfo,
  validateInstallation,
  validateAlertSettings,
  validateDashboard,
  validateMaintenance,
  validateCar,
};

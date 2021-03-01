const { isDate } = require("lodash");

/*const {
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
} = require("./models/car");

const mongoose = require("mongoose");
const { date } = require("joi");

const _info = {
  name: "car",
  platNumber: "د ن ط - 836",
  fuelConsumptionRate: 12.8,
  gpsDevice: mongoose.Types.ObjectId().toHexString(),
  activationDate: "",
  expirationDate: "",
  simNumber: "01001860957",
  vin: "123",
  engineNumber: "456",
  color: "silver",
  tankSize: 50,
  path: "Maadi",
  driver: mongoose.Types.ObjectId().toHexString(),
  tokens: [],
  photo: "sss",
};
const _installation = {
  installedBy: "tarek",
  time: "",
  company: "Intec",
  location: "Maadi-Cairo-Egypt",
  photos: [],
};
const _alertSettings = {
  engineON: true,
  engineOFF: true,
  doorOpen: true,
  doorClosed: true,
  fuelLeak: true,
  refuel: true,
  speedAlert: true,
  speedLimit: 120,
  geoFence: {
    alert: true,
    topLeft: {
      latitude: 34.2566,
      longitude: 33.2566,
    },
    bottomRight: {
      latitude: 35.2566,
      longitude: 34.2566,
    },
  },
};
const _dashBoard = {
  speed: 120,
  odometer: 55123,
  fuelLevel: 33.5,
  location: { latitude: 33.255, longitude: 55.5555 },
  lastSeen: 34.233,
};
const _maintenance = {
  last: {
    time: "",
    odometer: 55000,
  },
  next: {
    time: "",
    odometer: 65000,
  },
};

const _car = {
  info: _info,
  installation: _installation,
  alertSettings: _alertSettings,
  dashBoard: _dashBoard,
  maintenance: _maintenance,
};

const { error } = validateDashboard(_dashBoard);
if (error) console.log("Error=>", error.details[0].message);
// const jd = new Date();

// console.log(jd);
// console.log(jd.getHours());
// const d = new Date("2021-01-27T18:24:50.925+00:00");
// const year = d.getFullYear();
// const month = d.getMonth() + 1;
// const day = d.getDate();
// const hour = d.getHours();
// const minute = d.getMinutes();

// console.log(`${day}/${month}/${year} - ${hour}:${minute}`);
*/
// let d1 = new Date("hello");
// let d2 = new Date("2021-04-30T09:42:22.053Z");
// //console.log(`UTC: ${d2.getUTCHours()}, hours: ${d1.getHours()}`);
// let date = new Date();
// date = d1;
// // date.setFullYear(d1.getFullYear());
// // date.setMonth(d1.getMonth());
// // date.setDate(d1.getDate());
// date.setUTCHours(23);
// date.setMinutes(59);
// date.setSeconds(59);
// //date.setMonth(date.getMonth() + 3);
// console.log(typeof Date.parse("2021-04-30T09:4"));
// console.log(Date.parse("2021-04-30T09:4"));
// console.log(date);

function getTimeRange(startDate_str, endDate_str) {
  // validate string is a valid date
  if (!Date.parse(startDate_str) || !Date.parse(endDate_str)) return null;

  const startDate = new Date(startDate_str);
  startDate.setUTCHours(0);
  startDate.setMinutes(0);
  startDate.setSeconds(0);
  const endDate = new Date(endDate_str);
  endDate.setUTCHours(23);
  endDate.setMinutes(59);
  endDate.setSeconds(59);

  return {
    start: startDate,
    end: endDate,
  };
}

console.log(
  getTimeRange("2021-04-30T09:42:22.053Z", "2021-04-30T09:42:22.053Z")
);

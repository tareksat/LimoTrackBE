const userRoute = require("../routes/users");
const accountRoute = require("../routes/accounts");
const groupRoute = require("../routes/groups");
const gpsDeviceRoute = require('../routes/gpsDevices');
const driverRoute = require('../routes/drivers');
const carRoute = require('../routes/cars');

module.exports = function (app) {
  app.use("/users", userRoute);
  app.use("/accounts", accountRoute);
  app.use("/groups", groupRoute);
  app.use('/gpsDevices', gpsDeviceRoute);
  app.use('/drivers', driverRoute);
  app.use('/cars', carRoute);
};

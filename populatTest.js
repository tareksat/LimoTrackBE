require("./startup/database")();

const x = require('./test/services/populateDb')();
x.then(y => console.log(y)).catch(err => console.log(err))
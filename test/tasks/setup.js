// setup.js
module.exports = async () => {
    // ...
    // Set reference to mongod in order to close the server during teardown.
    console.log('Setup Test...')
    global.__MONGOD__ = mongod;
};
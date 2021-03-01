const {
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
} = require("../../../models/car");

const mongoose = require("mongoose");
const date = Date();
function getInfo(){
    return {
        name: "car",
        platNumber: "PLT-123",
        fuelConsumptionRate: 12.8,
        gpsDevice: mongoose.Types.ObjectId().toHexString(),
        activationDate: date,
        expirationDate: date,
        simNumber: "01001860957",
        vin: "123",
        engineNumber: "456",
        color: "color",
        tankSize: 50,
        path: mongoose.Types.ObjectId().toHexString(),
        driver: mongoose.Types.ObjectId().toHexString(),
        tokens: [],
        photo: "photo//URL",
        group: mongoose.Types.ObjectId().toHexString(),
        account: mongoose.Types.ObjectId().toHexString()
    };
}
function getInstallation(){
    return {
        installedBy: "tarek",
        time: date,
        company: "company",
        location: "location",
        photos: [],
    };
}
function getAlertSettings(){
    return {
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
                latitude: 34,
                longitude: 34,
            },
            bottomRight: {
                latitude: 34,
                longitude: 34,
            },
        },
    };
}
function getDashboard(){
    return {
        speed: 120,
        odometer: 55123,
        fuelLevel: 33.5,
        location: { latitude: 33, longitude: 55 },
        lastSeen: date,
    };
}
function getMaintenance(){
    return {
        last: {
            time: date,
            odometer: 55000,
        },
        next: {
            time: date,
            odometer: 65000,
        },
    };
}
function getCar(){
    return {
        info: getInfo(),
        installation: getInstallation(),
        alertSettings: getAlertSettings(),
        dashBoard: getDashboard(),
        maintenance: getMaintenance(),
    };
}

describe('Testing Car model', () => {
    describe('Test Parsing', () => {
        it('Test parse Info', () => {
            const res = parseInfo(getInfo());
            expect(res).toHaveProperty('name', 'car');
            expect(res).toHaveProperty('platNumber', 'PLT-123');
            expect(res).toHaveProperty('fuelConsumptionRate', 12.8);
            expect(res).toHaveProperty('gpsDevice');
            expect(res).toHaveProperty('activationDate', date);
            expect(res).toHaveProperty('expirationDate', date);
            expect(res).toHaveProperty('simNumber', '01001860957');
            expect(res).toHaveProperty('vin', '123');
            expect(res).toHaveProperty('engineNumber', '456');
            expect(res).toHaveProperty('color', 'color');
            expect(res).toHaveProperty('tankSize', 50);
            //expect(res).toHaveProperty('path', 'Maadi');
            expect(res).toHaveProperty('driver');
            expect(res).toHaveProperty('tokens');
            expect(res).toHaveProperty('photo', "photo//URL");
        });

        it('Test parse Installation', ()=>{
            const res = parseInstallation(getInstallation());
            expect(res).toHaveProperty('installedBy', 'tarek');
            expect(res).toHaveProperty('time', date);
            expect(res).toHaveProperty('company', 'company');
            expect(res).toHaveProperty('location', 'location');
            expect(res).toHaveProperty('photos');
        });

        it('Test parse AlertSettings', ()=>{
            const res = parseAlertSettings(getAlertSettings());
            expect(res).toHaveProperty('engineON', true);
            expect(res).toHaveProperty('engineOFF', true);
            expect(res).toHaveProperty('doorOpen', true);
            expect(res).toHaveProperty('doorClosed', true);
            expect(res).toHaveProperty('fuelLeak', true);
            expect(res).toHaveProperty('speedAlert', true);
            expect(res).toHaveProperty('speedLimit', 120);
            expect(res).toHaveProperty('geoFence');
            expect(res).toHaveProperty('refuel', true);
            expect(res.geoFence).toHaveProperty('alert', true);
            expect(res.geoFence).toHaveProperty('topLeft');
            expect(res.geoFence).toHaveProperty('bottomRight');
            expect(res.geoFence.topLeft).toHaveProperty('latitude',34 );
            expect(res.geoFence.topLeft).toHaveProperty('longitude',34 )
            expect(res.geoFence.bottomRight).toHaveProperty('latitude',34 )
            expect(res.geoFence.bottomRight).toHaveProperty('longitude',34 );
        });

        it('Test parse Dashboard', ()=>{
            const res = parseDashboard(getDashboard());
            expect(res).toHaveProperty('speed', 120);
            expect(res).toHaveProperty('odometer', 55123);
            expect(res).toHaveProperty('fuelLevel', 33.5);
            expect(res).toHaveProperty('location');
            expect(res.location).toHaveProperty('latitude', 33);
            expect(res.location).toHaveProperty('longitude', 55);
            expect(res).toHaveProperty('lastSeen', date);
        });

        it('Test parse Maintenance', ()=>{
            const res = parseMaintenance(getMaintenance());
            expect(res).toHaveProperty('last');
            expect(res).toHaveProperty('next');
            expect(res.last).toHaveProperty('time');
            expect(res.last).toHaveProperty('odometer', 55000);
            expect(res.next).toHaveProperty('time');
            expect(res.next).toHaveProperty('odometer', 65000);
        });

        it('Test Parse Car', ()=>{
            const res = parseCar(getCar());
            expect(res).toHaveProperty('info');
            expect(res).toHaveProperty('installation');
            expect(res).toHaveProperty('alertSettings');
            expect(res).toHaveProperty('dashBoard');
            expect(res).toHaveProperty('maintenance');
        })
    });

    describe('Test info validation', () =>{
        it('should not return validation error', () => {
            const info = getInfo();
            const res = validateInfo(info);
            expect(res.error).toBeFalsy();
        });

    });

    describe('Test Installation validation', () => {
       it('should not return validation error', () => {
           const installation = getInstallation();
           const res = validateInstallation(installation);
           expect(res.error).toBeFalsy();
       }) ;
    });

    describe('Test Alert settings validation', () => {
        it('should not return validation error', () => {
            const alert = getAlertSettings();
            const res = validateAlertSettings(alert);
            expect(res.error).toBeFalsy();
        }) ;
    });

    describe('Test Dashboard validation', () => {
        it('should not return validation error', () => {
            const dashboard = getDashboard();
            const res = validateDashboard(dashboard);
            expect(res.error).toBeFalsy();
        }) ;
    });

    describe('Test Maintenance validation', () => {
        it('should not return validation error', () => {
            const maintenance = getMaintenance();
            const res = validateMaintenance(maintenance);
            expect(res.error).toBeFalsy();
        }) ;
    });
});


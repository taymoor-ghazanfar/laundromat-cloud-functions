let functions = require("firebase-functions"),
    admin_utils = require("../utils/admin_utils"),
    registration_utils = require("../utils/admin_utils");

// add a new service item
exports.addServiceType = functions.https.onCall((service_type, context) => {

    return admin_utils.addServiceType(service_type);

});

// get all service items
exports.getServiceTypes = functions.https.onCall((service_type, context) => {

    return admin_utils.getServiceTypes();

});

// function to get all new merchant or delivery boy registration requests
exports.getNewRegistrationRequests = functions.https.onCall((entity_type) => {

    return admin_utils.getRegistrationRequests(entity_type);
});

// confirm (accept) merchant registration request
exports.acceptRegistrationRequest = functions.https.onCall((data, context) => {

    return admin_utils.acceptRegistrationRequest(data);
});

exports.declineRegistrationRequest = functions.https.onCall((data, context) => {

    return admin_utils.declineRegistrationRequest(data);
});

exports.getFareData = functions.https.onCall((data) => {

    return admin_utils.getFareData(data);
});

exports.verifyLogin = functions.https.onCall((data, context) => {

    let username = data.username;
    let password = data.password;

    return admin_utils.verifyLogin(username, password);
});

exports.getMerchants = functions.https.onCall(() => {

    return admin_utils.getAllMerchants();
});

exports.getDeliveryBoys = functions.https.onCall(() => {

    console.log("calling delivery boys");
    return admin_utils.getAllDeliveryBoys();
});

exports.getCustomers = functions.https.onCall(() => {

    return admin_utils.getAllCustomers();
});

exports.getOrders = functions.https.onCall(() => {

    return admin_utils.getAllOrders();
});

exports.getServiceTypes = functions.https.onCall(() => {

    return admin_utils.getServiceTypes();
});

exports.updateSettings = functions.https.onCall((data) => {

    return admin_utils.updateSettings(data);
});

exports.checkRequestHandled = functions.https.onCall((data) => {

    return registration_utils.checkRequestHandled(data);
});

exports.getDeliveryRadius = functions.https.onCall(() => {

    return admin_utils.getDeliveryRadius();
});

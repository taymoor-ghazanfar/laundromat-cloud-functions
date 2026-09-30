let functions = require("firebase-functions"),
    delivery_boy_utils = require("../utils/delivery_boy_utils"),
    registration_utils = require("../utils/registration_utils");

// function to verify new registration request data for delivery boy
exports.verifyNewDeliveryBoyData = functions.https.onCall((delivery_boy, context) => {

    let collection_name = "delivery_boys";

    // check in DELIVERY_BOYS collection
    return delivery_boy_utils.verifyNewDeliveryBoyData(collection_name, delivery_boy)
        .then(function () {

            collection_name = "new_delivery_boys";

            // check in NEW_DELIVERY_BOYS collection
            return delivery_boy_utils.verifyNewDeliveryBoyData(collection_name, delivery_boy);
        });
});

// function to save new delivery boy and vehicle to NEW_DELIVERY_BOY AND NEW_VEHICLE collections
exports.createNewDeliveryBoy = functions.https.onCall((data, context) => {

    return delivery_boy_utils.createNewDeliveryBoy(data);
});

// verify delivery boy login by phone and password
exports.verifyLogin = functions.https.onCall((data, context) => {

    let phone_number = data.phone_number;
    let password = data.password;

    return delivery_boy_utils.getByPhonePassword(phone_number, password);
});

exports.setFcmToken = functions.https.onCall((data, context) => {

    let driver_phone = data.phone_number;
    let fcm_token = data.fcm_token;

    return registration_utils.setFcmToken("delivery_boys", driver_phone, fcm_token);
});

exports.getById = functions.https.onCall((driver_id, context) => {

    return delivery_boy_utils.getById(driver_id);
});

exports.getByOrderId = functions.https.onCall((order_id, context) => {

    return delivery_boy_utils.getByOrderId(order_id);
});

exports.updatePassword = functions.https.onCall((data, context) => {

    return registration_utils.updatePassword(data);
});

exports.checkEditValid = functions.https.onCall((data, context) => {

    let id = data.id;
    let email = data.email;
    let license = data.license;

    let collection = "new_delivery_boys"

    return registration_utils.checkEditValidDriver(collection, id, email, license)
        .then(() => {

            collection = "delivery_boys"

            return registration_utils.checkEditValidDriver(collection, id, email, license);
        });

});

exports.updateDeliveryBoy = functions.https.onCall((data, context) => {

    let driver_id = data.driver_id;
    let full_name = data.full_name;
    let email = data.email;
    let jazz_cash = data.jazz_cash;
    let license = data.license;
    let avatar_updated = data.avatar_updated;
    let avatar_64 = data.avatar_64;

    return delivery_boy_utils.updateDeliveryBoy
    (driver_id, full_name, email, jazz_cash, license, avatar_updated, avatar_64);
});

exports.updateCurrentLocation = functions.https.onCall((data, context) => {

    let phone_number = data.phone_number;
    let latitude = data.latitude;
    let longitude = data.longitude;
    let speed = data.speed;

    return delivery_boy_utils.updateCurrentLocation(phone_number, latitude, longitude, speed);
});

exports.getLiveLocation = functions.https.onCall((data, context) => {

    let driver_id = data.driver_id;

    return delivery_boy_utils.getLiveLocation(driver_id);
});

exports.setAvailability = functions.https.onCall((data, context) => {

    let driver_id = data.driver_id;
    let status = data.status;

    return delivery_boy_utils.setAvailability(driver_id, status);
});

exports.checkPhoneNumber = functions.https.onCall((data, context) => {

    let collection = data["collection"];
    let phone_number = data["phone_number"];

    return registration_utils.checkPhoneNumber(collection, phone_number);
});

exports.changePass = functions.https.onCall((data, context) => {

    let collection = data["collection"];
    let phone_number = data["phone_number"];
    let password = data["password"];

    return registration_utils.forgotPassword(collection, phone_number, password);
});




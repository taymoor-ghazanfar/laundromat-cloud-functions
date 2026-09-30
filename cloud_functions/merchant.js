let functions = require("firebase-functions"),
    merchant_utils = require("../utils/merchant_utils"),
    registration_utils = require("../utils/registration_utils");

// function to verify new registration request data for merchant
exports.verifyNewMerchantData = functions.https.onCall((merchant, context) => {

    let collection_name = "merchants";

    // check in MERCHANTS collection
    return merchant_utils.verifyNewMerchantData(collection_name, merchant)
        .then(function () {

            collection_name = "new_merchants";

            // check in NEW_MERCHANTS collection
            return merchant_utils.verifyNewMerchantData(collection_name, merchant);
        });
});

// function to save new merchant and laundry to NEW_MERCHANTS AND NEW_LAUNDRIES collections
exports.createNewMerchant = functions.https.onCall((data, context) => {

    return merchant_utils.createNewMerchant(data);

});

// verify merchant login by phone and password
exports.verifyLogin = functions.https.onCall((data, context) => {

    let phone_number = data.phone_number;
    let password = data.password;

    return merchant_utils.getByPhonePassword(phone_number, password);
});

// set fcm token for merchant
exports.setFcmToken = functions.https.onCall((data, context) => {

    let merchant_phone = data.phone_number;
    let fcm_token = data.fcm_token;

    return registration_utils.setFcmToken("merchants", merchant_phone, fcm_token);
});

// get merchant by laundry id
exports.getMerchantByLaundryId = functions.https.onCall((laundry_id, context) => {

    return merchant_utils.getMerchantByLaundryId(laundry_id);
});

exports.getById = functions.https.onCall((id, context) => {

    return merchant_utils.getMerchantById(id);
});

exports.updatePassword = functions.https.onCall((data, context) => {

    return registration_utils.updatePassword(data);
});

exports.checkEditValid = functions.https.onCall((data, context) => {

    let id = data.id;
    let email = data.email;

    let collection = "new_merchants"

    return registration_utils.checkEditValid(collection, id, email)
        .then(() => {

            collection = "merchants"

            return registration_utils.checkEditValid(collection, id, email);
        });

});

exports.updateMerchant = functions.https.onCall((data, context) => {

    let merchant_id = data.merchant_id;
    let full_name = data.full_name;
    let email = data.email;
    let jazz_cash = data.jazz_cash;
    let avatar_updated = data.avatar_updated;
    let avatar_64 = data.avatar_64;
    let location_updated = data.location_updated;
    let location = data.location;

    return merchant_utils.updateMerchant
    (merchant_id, full_name, email, jazz_cash, avatar_updated, avatar_64, location_updated, location);
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

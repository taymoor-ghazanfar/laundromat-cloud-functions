let functions = require("firebase-functions"),
    customer_utils = require("../utils/customer_utils"),
    registration_utils = require("../utils/registration_utils");

// function to verify new registration request data for customer
exports.verifyNewCustomerData = functions.https.onCall((customer, context) => {

    return customer_utils.verifyNewCustomerData(customer);
});

// function to save new merchant and laundry to NEW_MERCHANTS AND NEW_LAUNDRIES collections
exports.createNewCustomer = functions.https.onCall((customer, context) => {

    return customer_utils.createNewCustomer(customer);

});

// get customer by id
exports.getCustomerById = functions.https.onCall((customer_id, context) => {

    return customer_utils.getCustomerById(customer_id);

});

// verify merchant login by phone and password
exports.verifyLogin = functions.https.onCall((data, context) => {

    let phone_number = data.phone_number;
    let password = data.password;

    return customer_utils.getByPhonePassword(phone_number, password);
});

// set fcm token for customer
exports.setFcmToken = functions.https.onCall((data, context) => {

    let customer_phone = data.phone_number;
    let fcm_token = data.fcm_token;

    return registration_utils.setFcmToken("customers", customer_phone, fcm_token);
});

// add a new address for a customer
exports.addAddress = functions.https.onCall((data, context) => {

    let customer_id = data.customer_id;
    let location = data.location;

    return customer_utils.addAddress(customer_id, location);
});

// update a laundry address for customer
exports.updateAddress = functions.https.onCall((data, context) => {

    let customer_id = data.customer_id;
    let location = data.location;
    let location_index = data.location_index;
    let update_current_location = data.update_current_location;

    return customer_utils.updateAddress(customer_id, location, location_index, update_current_location);
});

// delete an address for a customer
exports.deleteAddress = functions.https.onCall((data, context) => {

    let customer_id = data.customer_id;
    let location_index = data.location_index;

    return customer_utils.deleteAddress(customer_id, location_index);
});

// update customer location
exports.updateLocation = functions.https.onCall((data, context) => {

    let customer_id = data.customer_id;
    let latitude = data.latitude;
    let longitude = data.longitude;

    return customer_utils.updateLocation(customer_id, latitude, longitude);
});

exports.updatePassword = functions.https.onCall((data, context) => {

    return registration_utils.updatePassword(data);
});

exports.checkEditValid = functions.https.onCall((data, context) => {

    let id = data.id;
    let email = data.email;

    let collection = "new_customers"

    return registration_utils.checkEditValid(collection, id, email)
        .then(() => {

            collection = "customers"

            return registration_utils.checkEditValid(collection, id, email);
        });

});

exports.updateCustomer = functions.https.onCall((data, context) => {

    let customer_id = data.customer_id;
    let full_name = data.full_name;
    let email = data.email;
    let avatar_updated = data.avatar_updated;
    let avatar_64 = data.avatar_64;

    return customer_utils.updateCustomer
    (customer_id, full_name, email, avatar_updated, avatar_64);
});

exports.checkPhoneNumber = functions.https.onCall((data, context) => {

   let collection = data["collection"];
   let phone_number = data["phone_number"];

    return registration_utils.checkPhoneNumber(collection, phone_number);
});

exports.forgotPassword = functions.https.onCall((data, context) => {

    let collection = data["collection"];
    let phone_number = data["phone_number"];
    let password = data["password"];

    return registration_utils.forgotPassword(collection, phone_number, password);
});

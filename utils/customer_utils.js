let functions = require("firebase-functions"),
    admin = require("firebase-admin"),
    registration_utils = require("./registration_utils"),
    image_utils = require("./image_utils"),
    email_utils = require("./email_utils"),
    transaction_utils = require("./transaction_utils"),
    order_utils = require("./order_utils");

let utilsObject = {};

// check if customer data provided by user already exist or not
utilsObject.verifyNewCustomerData = function (customer) {

    return registration_utils.checkDataExist("customers", customer);
}

utilsObject.createNewCustomer = function (customer) {

    customer.id = admin.firestore().collection("customers").doc().id;

    // images to base64
    let customerAvatar = new Buffer(customer.avatarUrl, 'base64');

    // upload customer avatar image
    return image_utils.uploadImage(customerAvatar, "customers/avatars", `customer_avatar_${customer.id}`)
        .then((customerAvatarDownloadUrl) => {

            customer.avatarUrl = customerAvatarDownloadUrl;

            // push new customer to CUSTOMERS collection
            return admin.firestore().collection("customers")
                .doc(customer.id).set(customer)
                .then(function () {

                    // sending confirmation email to customer
                    return email_utils
                        .sendCustomerRegistrationConfirmation
                        (customer.email, customer.fullName).then(() => {

                            return {
                                customerId: customer.id,
                                downloadUrl: customerAvatarDownloadUrl
                            }
                        });

                })
                .catch(e => {

                    throw new functions.https.HttpsError("internal",
                        e.message);
                });
        });
}

// get customer by phone and password
utilsObject.getByPhonePassword = function (phone_number, password) {

    return admin.firestore().collection("customers")
        .where("phoneNumber", "==", phone_number).get()
        .then(querySnapshot => {

            if (querySnapshot.empty) {

                throw new functions.https.HttpsError("not-found",
                    "No customer found with provided phone number");
            }

            let customer = querySnapshot.docs[0].data();
            customer.id = querySnapshot.docs[0].id;

            if (password === customer.password) {

                // get all orders associated with the customer
                return order_utils.getAllUserOrders(customer.orders)
                    .then(orders => {

                        customer.orders = orders;

                        return customer;
                    });
            }

            throw new functions.https.HttpsError("invalid-argument",
                "Password is incorrect");

        })
        .catch(e => {

            throw new functions.https.HttpsError("internal",
                e.message);
        });
}

// add new address to a customer
utilsObject.addAddress = function (customer_id, location) {

    const FieldValue = admin.firestore.FieldValue;

    return admin.firestore()
        .collection("customers")
        .doc(customer_id)
        .update("locations", FieldValue.arrayUnion(location))
        .catch(e => {

            throw new functions.https.HttpsError("internal",
                e.message);
        });
}

// update an address for a customer
utilsObject.updateAddress = function (customer_id, location, location_index, update_current_location) {

    return admin.firestore().collection("customers").doc(customer_id).get()
        .then((doc) => {

            let customer = doc.data();
            let locations = customer.locations;

            locations[location_index] = location;

            //todo: if current location was updated, update it in firestore as well
            if (update_current_location) {

                return utilsObject.updateLocation(customer_id, location.latLng.latitude, location.latLng.longitude)
                    .then(() => {

                        return admin.firestore().collection("customers").doc(customer_id)
                            .update("locations", locations)
                            .catch(e => {

                                throw new functions.https.HttpsError("internal",
                                    e.message);
                            })
                    });

            } else {

                return admin.firestore().collection("customers").doc(customer_id)
                    .update("locations", locations)
                    .catch(e => {

                        throw new functions.https.HttpsError("internal",
                            e.message);
                    })
            }
        })
        .catch(e => {

            throw new functions.https.HttpsError("internal",
                e.message);
        })
}

// delete an address for a customer
utilsObject.deleteAddress = function (customer_id, location_index, location) {

    // check if address is used by an order
    return admin.firestore().collection("orders")
        .where("deliveryLocation", "==", location)
        .get()
        .then(snapshot => {

            if (!snapshot.empty) {

                throw new functions.https.HttpsError("internal",
                    "Location is associated with an in-process order");
            }

            return admin.firestore()
                .runTransaction(transaction => {

                    return transaction
                        .get(admin.firestore().collection("customers").doc(customer_id))
                        .then(doc => {

                            let customer = doc.data();
                            let locations = customer.locations;

                            locations.splice(location_index, 1);

                            return transaction
                                .update(admin.firestore().collection("customers").doc(customer_id), {locations: locations});

                        })
                        .catch(e => {

                            throw new functions.https.HttpsError("internal",
                                e.message);
                        });

                })
                .catch(e => {

                    throw new functions.https.HttpsError("internal",
                        e.message);
                });

        })
        .catch(e => {

            throw new functions.https.HttpsError("internal",
                e.message);
        });
}

// update customer location
utilsObject.updateLocation = function (customer_id, latitude, longitude) {

    return admin.firestore().collection("customers").doc(customer_id)
        .update("location", {

            latitude: latitude,
            longitude: longitude

        })
        .catch(e => {

            throw new functions.https.HttpsError("internal",
                e.message);
        })
}

// get customer by id
utilsObject.getCustomerById = function (customer_id) {

    return admin.firestore().collection("customers")
        .doc(customer_id)
        .get()
        .then(snapshot => {

            let customer = snapshot.data();

            // get all orders associated with the customer
            return order_utils.getAllUserOrders(customer.orders)
                .then(orders => {

                    customer.orders = orders;

                    return customer;
                });

        }).catch(e => {

            throw new functions.https.HttpsError("internal",
                e.message);
        });
}

utilsObject.updateCustomer = function (customer_id, full_name,
                                       email, avatar_updated,
                                       avatar_64) {

    if (avatar_updated) {

        let customerAvatar = new Buffer(avatar_64, 'base64');

        return image_utils.uploadImage(customerAvatar, "customers/avatars", `customer_avatar_${customer_id}`)
            .then((customerAvatarUrl) => {

                let data = {

                    avatarUrl: customerAvatarUrl,
                    fullName: full_name,
                    email: email,
                }

                return admin.firestore().collection("customers").doc(customer_id)
                    .update(data)
                    .then(() => {

                        return customerAvatarUrl;

                    })
                    .catch(e => {

                        throw new functions.https.HttpsError("internal",
                            e.message);
                    });
            });
    } else {

        let data = {

            fullName: full_name,
            email: email,
        }

        return admin.firestore().collection("customers").doc(customer_id)
            .update(data)
            .then(() => {

                return "updated";

            })
            .catch(e => {

                throw new functions.https.HttpsError("internal",
                    e.message);
            });
    }
}


module.exports = utilsObject;
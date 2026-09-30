let functions = require('firebase-functions'),
    admin = require("firebase-admin"),
    vehicle_utils = require("./vehicle_utils"),
    laundry_utils = require("./laundry_utils"),
    email_utils = require("./email_utils"),
    transaction_utils = require("./transaction_utils"),
    trip_utils = require("./trip_utils"),
    order_utils = require("./order_utils"),
    location_utils = require("./location_utils");

let utilsObject = {};

// add a single service type
utilsObject.addServiceType = function (service_type) {

    return utilsObject.checkServiceTypeExist(service_type)
        .then(() => {

            // add the new service item to database
            return admin.firestore()
                .collection("service_types")
                .add(service_type);
        });
}

// get all service types
utilsObject.getServiceTypes = function () {

    return admin.firestore().collection("service_types")
        .get()
        .then(snapshot => {

            // if there are no new merchant requests
            if (snapshot.empty) {

                return null;
            }

            let serviceTypes = [];

            snapshot.forEach(doc => {

                let serviceType = doc.data();
                serviceType.id = doc.id;
                serviceTypes.push(serviceType);
            });

            return serviceTypes;

        })
        .catch(e => {

            throw new functions.https.HttpsError("internal",
                e.message);
        })
}

// check if a service type already exist
utilsObject.checkServiceTypeExist = function (service_type) {

    return admin.firestore()
        .collection("service_types")
        .where("name", "==", service_type.name)
        .get()
        .then(snapshot => {

            // if service item does not exist before
            if (snapshot.empty) {

                return false;
            }
            // else show error
            else {
                throw new functions.https.HttpsError("already-exists",
                    "Service type already exists");
            }
        })
        .catch(e => {

            throw new functions.https.HttpsError("internal",
                e.message);
        });
}

utilsObject.getRegistrationRequests = function (entity_type) {

    if (entity_type === "merchant") {

        return utilsObject.getMerchantRegistrationRequests();
    }
    if (entity_type === "delivery_boy") {

        return utilsObject.getDeliveryBoyRegistrationRequests();
    }
}

// get all merchant registration requests
utilsObject.getMerchantRegistrationRequests = function () {

    return admin.firestore()
        .collection("new_merchants")
        .get()
        .then((snapshot) => {

            // if there are no new merchant requests
            if (snapshot.empty) {

                return null;
            }

            let merchants = [];

            // get all new merchants
            snapshot.forEach(doc => {

                let merchant = doc.data();
                merchant.id = doc.id;
                merchants.push(merchant);
            });

            // get laundry associated with the merchants
            return Promise.all(merchants.map(merchant => {

                return laundry_utils.getLaundry("new_laundries", merchant.laundry)
                    .then(laundry => {

                        merchant.laundry = laundry;
                        return true;
                    });

            })).then(() => {

                return merchants;
            });
        });
}

// function to get all new delivery boy registration requests
utilsObject.getDeliveryBoyRegistrationRequests = function () {

    return admin.firestore()
        .collection("new_delivery_boys")
        .get()
        .then((snapshot) => {

            // if there are no new requests
            if (snapshot.empty) {

                return null;
            }

            let delivery_boys = [];

            // get all new delivery boys
            snapshot.forEach(doc => {

                let delivery_boy = doc.data();
                delivery_boy.id = doc.id;
                delivery_boys.push(delivery_boy);
            });

            // get vehicle associated with the new delivery boys
            return Promise.all(delivery_boys.map(delivery_boy => {

                return vehicle_utils.getVehicle("new_vehicles", delivery_boy.vehicle)
                    .then(vehicle => {

                        delivery_boy.vehicle = vehicle;
                        return true;
                    });

            })).then(() => {

                return delivery_boys;
            });
        });
}

utilsObject.acceptRegistrationRequest = function (data) {

    let entity_type = data.entity_type;

    if (entity_type === "merchant") {

        return utilsObject.acceptMerchantRegistration(data.user);
    }
    if (entity_type === "delivery_boy") {

        return utilsObject.acceptDeliveryBoyRegistration(data.user);
    }
}

utilsObject.acceptMerchantRegistration = function (merchant) {

    const merchant_id = merchant.id;

    const laundry = merchant.laundry;
    const laundry_id = laundry.id;

    // remove id properties (to avoid saving in collection)

    merchant.isActive = true;
    laundry.isActive = true;
    merchant.laundry = laundry_id;

    // add merchant to MERCHANTS COLLECTION
    return admin.firestore().collection("merchants").doc(merchant_id).set(merchant)
        .then(() => {

            // add laundry to LAUNDRIES COLLECTION
            return admin.firestore().collection("laundries").doc(laundry_id).set(laundry)
                .then(() => {

                    // delete merchant from NEW_MERCHANTS collection
                    return admin.firestore().collection("new_merchants").doc(merchant_id).delete()
                        .then(() => {

                            // delete laundry from NEW_LAUNDRIES collection
                            return admin.firestore().collection("new_laundries").doc(laundry_id).delete()
                                .then(() => {

                                    // send confirmation email to the merchant
                                    return email_utils
                                        .sendMerchantRegistrationConfirmation
                                        (merchant.email, merchant.fullName, laundry.name);

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

        })
        .catch(e => {

            throw new functions.https.HttpsError("internal",
                e.message);

        });
}

utilsObject.acceptDeliveryBoyRegistration = function (delivery_boy) {

    const delivery_boy_id = delivery_boy.id;

    const vehicle = delivery_boy.vehicle;
    const vehicle_id = vehicle.id;

    delivery_boy.isActive = true;
    delivery_boy.vehicle = vehicle_id;

    // add delivery boy to DELIVERY_BOYS COLLECTION
    return admin.firestore().collection("delivery_boys").doc(delivery_boy_id).set(delivery_boy)
        .then(() => {

            // add vehicle to VEHICLES COLLECTION
            return admin.firestore().collection("vehicles").doc(vehicle_id).set(vehicle)
                .then(() => {

                    // delete delivery boy from NEW_DELIVERY_BOYS collection
                    return admin.firestore().collection("new_delivery_boys").doc(delivery_boy_id).delete()
                        .then(() => {

                            // delete vehicle from NEW_VEHICLES collection
                            return admin.firestore().collection("new_vehicles").doc(vehicle_id).delete()
                                .then(() => {

                                    // send confirmation email to the delivery boy
                                    return email_utils
                                        .sendDeliveryBoyRegistrationConfirmation
                                        (delivery_boy.email, delivery_boy.fullName, vehicle.plateNumber);

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

        })
        .catch(e => {

            throw new functions.https.HttpsError("internal",
                e.message);

        });
}

utilsObject.declineRegistrationRequest = function (data) {

    let entity_type = data.entity_type;

    if (entity_type === "merchant") {

        return utilsObject.declineMerchantRegistration(data.user);
    }
    if (entity_type === "delivery_boy") {

        return utilsObject.declineDeliveryBoyRegistration(data.user);
    }
}

utilsObject.declineMerchantRegistration = function (merchant) {

    const merchant_id = merchant.id;

    const laundry = merchant.laundry;
    const laundry_id = laundry.id;

    // delete merchant from NEW_MERCHANTS collection
    return admin.firestore().collection("new_merchants").doc(merchant_id).delete()
        .then(() => {

            // delete laundry from NEW_LAUNDRIES collection
            return admin.firestore().collection("new_laundries").doc(laundry_id).delete()
                .then(() => {

                    // send email to the merchant
                    return email_utils
                        .sendMerchantRequestDeclineEmail
                        (merchant.email, merchant.fullName);

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

utilsObject.declineDeliveryBoyRegistration = function (delivery_boy) {

    const delivery_boy_id = delivery_boy.id;
    const vehicle = delivery_boy.vehicle;
    const vehicle_id = vehicle.id;

    // delete delivery boy from NEW_DELIVERY_BOYS collection
    return admin.firestore().collection("new_delivery_boys").doc(delivery_boy_id).delete()
        .then(() => {

            // delete vehicle from NEW_VEHICLES collection
            return admin.firestore().collection("new_vehicles").doc(vehicle_id).delete()
                .then(() => {

                    // send email to the delivery boy
                    return email_utils
                        .sendDeliveryBoyDeclineEmail
                        (delivery_boy.email, delivery_boy.fullName);

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

utilsObject.getFareData = function (data) {

    let customer_latitude = data.customer_latitude;
    let customer_longitude = data.customer_longitude;
    let laundry_latitude = data.laundry_latitude;
    let laundry_longitude = data.laundry_longitude;

    let base_fare;
    let per_km;

    // get the base fare
    return admin.firestore()
        .collection("admin")
        .doc("KyRA3BJvvle7QmLX8DrD")
        .get()
        .then(doc => {

            let admin_doc = doc.data();

            console.log("per km: " + admin_doc.perKm);

            base_fare = admin_doc.baseFare;
            per_km = admin_doc.perKm;

            let customerLocation = `${customer_latitude},${customer_longitude}`;
            let laundryLocation = `${laundry_latitude},${laundry_longitude}`

            // get the distance
            return location_utils.getDistance([customerLocation], [laundryLocation])
                .then(result => {

                    // parsing distance string i.e. 123 KM
                    let distance = result[0].distance;
                    distance = distance.slice(0, -3);

                    console.log("distance: " + distance);

                    // converting distance string to float
                    distance = parseFloat(distance);

                    return {

                        baseFare: base_fare,
                        perKm: per_km,
                        distance: distance
                    }

                })
                .catch(e => {

                    throw new functions.https.HttpsError("internal",
                        e.message);
                });

        }).catch(e => {

            throw new functions.https.HttpsError("internal",
                e.message);
        })
}

utilsObject.verifyLogin = function (username, password) {

    return admin.firestore().collection("admin")
        .doc("KyRA3BJvvle7QmLX8DrD")
        .get()
        .then(doc => {

            let admin = doc.data();

            if (admin.username === username && admin.password === password) {

                return admin;
            }

            throw new functions.https.HttpsError("not-found",
                "No user found with provided credentials");

        })
        .catch(e => {

            throw new functions.https.HttpsError("internal",
                e.message);
        });
}

utilsObject.getAllMerchants = function () {

    return admin.firestore()
        .collection("merchants")
        .get()
        .then((snapshot) => {

            // if there are no new merchant requests
            if (snapshot.empty) {

                return null;
            }

            let merchants = [];

            // get all new merchants
            snapshot.forEach(doc => {

                let merchant = doc.data();
                merchant.id = doc.id;
                merchants.push(merchant);
            });

            // get laundry associated with the merchants
            return Promise.all(merchants.map(merchant => {

                return laundry_utils.getLaundry("laundries", merchant.laundry)
                    .then(laundry => {

                        merchant.laundry = laundry;
                        return true;
                    });

            })).then(() => {

                return merchants;
            });
        });
}

utilsObject.getAllDeliveryBoys = function () {

    console.log("called delivery boys");

    return admin.firestore()
        .collection("delivery_boys")
        .get()
        .then((snapshot) => {

            console.log("querying docs");

            // if there are no new requests
            if (snapshot.empty) {

                return null;
            }

            let delivery_boys = [];

            // get all new delivery boys
            snapshot.forEach(doc => {

                let delivery_boy = doc.data();
                delivery_boy.id = doc.id;
                delivery_boys.push(delivery_boy);
            });

            // get vehicle associated with the new delivery boys
            return Promise.all(delivery_boys.map(delivery_boy => {

                return vehicle_utils.getVehicle("vehicles", delivery_boy.vehicle)
                    .then(vehicle => {

                        delivery_boy.vehicle = vehicle;
                        return true;
                    });

            })).then(() => {

                // get all the trips associated with the delivery boys
                return Promise.all(delivery_boys.map(delivery_boy => {

                    return trip_utils.getAllUserTrips(delivery_boy.trips)
                        .then(trips => {

                            delivery_boy.trips = trips;
                            return true;
                        });

                })).then(() => {

                    return delivery_boys;
                });
            });
        })
        .catch(e => {

            console.log("error on delivery boys");
            throw new functions.https.HttpsError("internal",
                e.message);

        });
}

utilsObject.getAllCustomers = function () {

    return admin.firestore()
        .collection("customers")
        .get()
        .then((snapshot) => {

            // if there are no new requests
            if (snapshot.empty) {

                return null;
            }

            let customers = [];

            // get all new delivery boys
            snapshot.forEach(doc => {

                let customer = doc.data();
                customer.id = doc.id;
                customers.push(customer);
            });

            // get all the orders associated with the delivery boys
            return Promise.all(customers.map(customer => {

                return order_utils.getAllUserOrders(customer.orders)
                    .then(orders => {

                        customer.orders = orders;
                        return true;
                    });

            })).then(() => {

                return customers;
            });
        });
}

utilsObject.getAllOrders = function () {

    return admin.firestore().collection("orders")
        .get()
        .then(snapshot => {

            // if there are no new requests
            if (snapshot.empty) {

                return null;
            }

            let orders = [];

            // get all new delivery boys
            snapshot.forEach(doc => {

                let order = doc.data();
                order.id = doc.id;
                orders.push(order);
            });

            return orders;

        })
        .catch(e => {

            throw new functions.https.HttpsError("internal",
                e.message);
        });
}

utilsObject.updateSettings = function (data) {

    let email = data.email;
    let baseFare = data.base_fare;
    let perKm = data.per_km;
    let deliveryRadius = data.radius;

    return admin.firestore()
        .collection("admin")
        .doc("KyRA3BJvvle7QmLX8DrD")
        .update({

            email,
            baseFare,
            deliveryRadius,
            perKm

        })
        .catch(e => {

            throw new functions.https.HttpsError("internal",
                e.message);
        });
}

utilsObject.checkRequestHandled = function (data) {

    let collection = data["collection"];
    let id = data["id"];

    return admin.firestore().collection(collection).doc(id)
        .get()
        .then(doc => {

            if (!doc.exists) {

                throw new functions.https.HttpsError("not-found",
                    "This registration request has already been handled");
            }

            return true;

        });
}

utilsObject.getDeliveryRadius = function () {

    return admin.firestore().collection("admin")
        .doc("KyRA3BJvvle7QmLX8DrD")
        .get()
        .then(doc => {

            let admin_data = doc.data();

            return admin_data["deliveryRadius"];

        })
        .catch(e => {


        });
}
module.exports = utilsObject;
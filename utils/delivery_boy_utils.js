let functions = require("firebase-functions"),
    admin = require("firebase-admin"),
    transaction_utils = require("./transaction_utils"),
    vehicle_utils = require("./vehicle_utils"),
    trip_utils = require("./trip_utils"),
    email_utils = require("./email_utils"),
    location_utils = require("./location_utils"),
    registration_utils = require("./registration_utils"),
    image_utils = require("./image_utils");

let utilsObject = {};

utilsObject.verifyNewDeliveryBoyData = function (collection_name, delivery_boy) {

    return registration_utils.checkDataExist(collection_name, delivery_boy);
}

utilsObject.createNewDeliveryBoy = function (data) {

    let delivery_boy = data.delivery_boy;
    let vehicle = data.vehicle;

    const delivery_boy_id = "4YfT666tFFNlvdO2Z9KX"
    const vehicle_id = admin.firestore().collection("new_vehicles").doc().id;

    // add the vehicle id to the delivery boy object
    delivery_boy.vehicle = vehicle_id;

    // delivery boy images to base64
    let deliveryBoyAvatar = new Buffer(delivery_boy.avatarUrl, 'base64');
    let deliveryBoyNic = new Buffer(delivery_boy.nicImageUrl, 'base64');
    let deliveryBoyLicense = new Buffer(delivery_boy.licenseImageUrl, 'base64');

    // vehicle images to base64
    let vehicleFront = new Buffer(vehicle.images["front"], 'base64');
    let vehicleBack = new Buffer(vehicle.images["back"], 'base64');
    let vehicleLeft = new Buffer(vehicle.images["left"], 'base64');
    let vehicleRight = new Buffer(vehicle.images["right"], 'base64');

    // create batch images data for delivery boy
    let delivery_boy_images = [
        {
            base64: deliveryBoyAvatar,
            folder: "delivery_boys/avatars",
            filename: `delivery_boy_avatar_${delivery_boy_id}`
        },
        {
            base64: deliveryBoyNic,
            folder: "delivery_boys/nic_images",
            filename: `delivery_boy_nic_${delivery_boy_id}`
        },
        {
            base64: deliveryBoyLicense,
            folder: "delivery_boys/license_images",
            filename: `delivery_boy_license_${delivery_boy_id}`
        }
    ]

    // create batch images data for vehicle
    let vehicle_images = [
        {
            base64: vehicleFront,
            folder: `vehicles/vehicle_${vehicle.plateNumber}`,
            filename: `${vehicle.plateNumber}_front`
        },
        {
            base64: vehicleBack,
            folder: `vehicles/vehicle_${vehicle.plateNumber}`,
            filename: `${vehicle.plateNumber}_back`
        },
        {
            base64: vehicleLeft,
            folder: `vehicles/vehicle_${vehicle.plateNumber}`,
            filename: `${vehicle.plateNumber}_left`
        },
        {
            base64: vehicleRight,
            folder: `vehicles/vehicle_${vehicle.plateNumber}`,
            filename: `${vehicle.plateNumber}_right`
        }
    ];

    // batch upload delivery boy images
    return image_utils.batchUploadImages(delivery_boy_images)
        .then(download_urls => {

            // set download urls to delivery boy object
            delivery_boy.avatarUrl = download_urls[0];
            delivery_boy.nicImageUrl = download_urls[1];
            delivery_boy.licenseImageUrl = download_urls[2];

            // batch upload vehicle images
            return image_utils.batchUploadImages(vehicle_images)
                .then(download_urls => {

                    // set download urls to vehicle object
                    vehicle.images["front"] = download_urls[0];
                    vehicle.images["back"] = download_urls[1];
                    vehicle.images["left"] = download_urls[2];
                    vehicle.images["right"] = download_urls[3];

                    // push new vehicle to NEW_VEHICLES collection
                    return admin.firestore().collection("new_vehicles")
                        .doc(vehicle_id).set(vehicle)
                        .then(() => {

                            // push new delivery boy to NEW_DELIVERY_BOYS collection
                            return admin.firestore().collection("new_delivery_boys")
                                .doc(delivery_boy_id).set(delivery_boy)
                                .then(() => {

                                    // get admin
                                    return admin.firestore().collection("admin")
                                        .doc("KyRA3BJvvle7QmLX8DrD")
                                        .get()
                                        .then(doc => {

                                            let admin_data = doc.data();

                                            let admin_email = admin_data.email;

                                            // sending confirmation email to delivery boy
                                            return email_utils
                                                .sendDeliveryBoyRegistrationRequestReceived
                                                (delivery_boy.email, delivery_boy.fullName, vehicle.plateNumber)
                                                .then(() => {

                                                    // send email to admin
                                                    return email_utils
                                                        .sendDeliveryBoyRequestReceived
                                                        (admin_email, delivery_boy.fullName, vehicle.plateNumber);
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
                });
        });
}

utilsObject.getById = function (id) {

    return admin.firestore().collection("delivery_boys")
        .doc(id)
        .get()
        .then(doc => {

            let delivery_boy = doc.data();

            // get the vehicle associated with the delivery boy
            let vehicle_id = delivery_boy.vehicle;

            return vehicle_utils.getVehicle("vehicles", vehicle_id)
                .then(vehicle => {

                    delivery_boy.vehicle = vehicle;

                    // get all the trips associated with the delivery boy
                    return trip_utils.getAllUserTrips(delivery_boy.trips)
                        .then(trips => {

                            delivery_boy.trips = trips;

                            return delivery_boy;
                        });
                });

        })
        .catch(e => {

            throw new functions.https.HttpsError("internal",
                e.message);
        });
}

// get merchant by phone and password
utilsObject.getByPhonePassword = function (phone_number, password) {

    return admin.firestore().collection("delivery_boys")
        .where("phoneNumber", "==", phone_number).get()
        .then(querySnapshot => {

            if (querySnapshot.empty) {

                throw new functions.https.HttpsError("not-found",
                    "No delivery boy found with provided phone number");
            }

            let delivery_boy = querySnapshot.docs[0].data();
            delivery_boy.id = querySnapshot.docs[0].id;

            if (password === delivery_boy.password) {

                // get the vehicle associated with the delivery boy
                let vehicle_id = delivery_boy.vehicle;

                return vehicle_utils.getVehicle("vehicles", vehicle_id)
                    .then(vehicle => {

                        delivery_boy.vehicle = vehicle;

                        // get all the trips associated with the delivery boy
                        return trip_utils.getAllUserTrips(delivery_boy.trips)
                            .then(trips => {

                                delivery_boy.trips = trips;

                                return delivery_boy;
                            });
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

// get nearby drivers based on pickup location
utilsObject.getNearbyDeliveryBoys = function (pickup_location) {

    let nearby_drivers = [];

    console.log("pickup location: " + pickup_location);

    // get delivery radius set by admin
    return admin.firestore().collection("admin")
        .doc("KyRA3BJvvle7QmLX8DrD").get()
        .then(doc => {

            let admin_doc = doc.data();

            let delivery_radius = admin_doc.deliveryRadius;

            console.log("delivery radius: " + delivery_radius);

            // get all the delivery boys who are active
            return admin.firestore().collection("delivery_boys")
                .where("isAvailable", "==", true)
                .get()
                .then(snapshot => {

                    if (snapshot.empty) {

                        console.log("delivery boys collection is empty");

                        throw new functions.https.HttpsError("not-found",
                            "No Delivery boy found");
                    }

                    console.log("total delivery boys: " + snapshot.size);

                    return Promise.all(snapshot.docs
                        .map(doc => {

                            let delivery_boy = doc.data();

                            console.log("delivery boy id: " + delivery_boy.id);

                            let current_location = delivery_boy.currentLocation;

                            console.log("delivery boy current location: " + current_location);

                            let pickupLocation = `${pickup_location.latitude},${pickup_location.longitude}`;
                            let riderLocation = `${current_location.latitude},${current_location.longitude}`

                            console.log("data pickup location: " + pickupLocation);
                            console.log("data rider location: " + riderLocation);

                            // get distance between delivery boy current location and source location
                            return location_utils.getDistance([pickupLocation], [riderLocation])
                                .then(result => {

                                    // parsing distance string i.e. 123 KM
                                    let distance = result[0].distance;
                                    distance = distance.slice(0, -3);

                                    // converting distance string to float
                                    distance = parseFloat(distance);

                                    console.log("distance b/w pickup and rider: " + distance);

                                    // if driver is close to delivery radius
                                    if (distance <= delivery_radius) {

                                        console.log("distance is <= radius");
                                        console.log("adding driver: " + delivery_boy.id);
                                        nearby_drivers.push(delivery_boy);
                                        return true;
                                    }
                                });
                        }))
                        .then(() => {

                            console.log("total nearby drivers: " + nearby_drivers.length);

                            // if nearby driver are 0
                            if (nearby_drivers.length > 0) {

                                console.log("found nearby driver --END--");
                                return nearby_drivers;
                            }

                            console.log("no nearby drivers found --END--");
                            throw new functions.https.HttpsError("not-found",
                                "No Delivery boy found");

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

utilsObject.getByOrderId = function (order_id) {

    // get trip
    return admin.firestore().collection("trips")
        .where("order", "==", order_id)
        .where("status", "!=", "DECLINED")
        .get()
        .then(snapshot => {

            if (snapshot.empty) {

                throw new functions.https.HttpsError("internal",
                    "No trip found with provided id");
            }

            // error
            let trip = snapshot.docs[0].data();

            let driver_id = trip.driverId;

            // get delivery boy
            return utilsObject.getById(driver_id)
                .then(driver => {

                    return driver;
                });

        })
        .catch(e => {

            throw new functions.https.HttpsError("internal",
                e.message);
        });
}

utilsObject.updateDeliveryBoy = function (driver_id, full_name,
                                          email, jazz_cash, license, avatar_updated,
                                          avatar_64) {

    if (avatar_updated) {

        let driverAvatar = new Buffer(avatar_64, 'base64');

        return image_utils.uploadImage(driverAvatar, "delivery_boys/avatars", `delivery_boy_avatar_${driver_id}`)
            .then((driverDownloadUrl) => {

                let data = {

                    avatarUrl: driverDownloadUrl,
                    fullName: full_name,
                    email: email,
                    jazzCashNumber: jazz_cash,
                }

                return admin.firestore().collection("delivery_boys").doc(driver_id)
                    .update(data)
                    .then(() => {

                        return driverDownloadUrl;

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
            jazzCashNumber: jazz_cash,
        }

        return admin.firestore().collection("delivery_boys").doc(driver_id)
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

utilsObject.updateCurrentLocation = function (phone_number, latitude, longitude, speed) {

    return admin.firestore().collection("delivery_boys")
        .where("phoneNumber", "==", phone_number).get()
        .then(querySnapshot => {

            if (querySnapshot.empty) {

                throw new functions.https.HttpsError("not-found",
                    "No delivery boy found with provided phone number");
            }

            let delivery_boy = querySnapshot.docs[0].data();

            return admin.firestore().collection("delivery_boys")
                .doc(delivery_boy.id)
                .update({

                    "currentLocation.latitude": latitude,
                    "currentLocation.longitude": longitude,
                    "currentSpeed": speed

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

utilsObject.getLiveLocation = function (driver_id) {

    return admin.firestore().collection("delivery_boys")
        .doc(driver_id)
        .get()
        .then(doc => {

            let driver = doc.data();

            return {

                latitude: driver.currentLocation.latitude,
                longitude: driver.currentLocation.longitude,
                speed: driver.currentSpeed
            }
        })
        .catch(e => {

            throw new functions.https.HttpsError("internal",
                e.message);
        });
}

utilsObject.setAvailability = function (driver_id, status) {

    return admin.firestore().collection("delivery_boys")
        .doc(driver_id)
        .update("isAvailable", status)
        .catch(e => {

            throw new functions.https.HttpsError("internal",
                e.message);
        });
}

module.exports = utilsObject;
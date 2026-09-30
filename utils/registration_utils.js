let functions = require("firebase-functions"),
    admin = require("firebase-admin");

let utilsObject = {};

// check if phone, email or nic already exist in a collection
utilsObject.checkDataExist = function (collection_name, user) {

    return admin.firestore()
        .collection(collection_name)
        .where("phoneNumber", "==", user.phoneNumber)
        .get()
        .then(function (snapshot) {

            // if phone number already exists
            if (!snapshot.empty) {

                throw new functions.https.HttpsError("already-exists",
                    "Phone number is already in use");
            }

            return admin.firestore()
                .collection(collection_name)
                .where("email", "==", user.email)
                .get()
                .then(function (snapshot) {

                    // if email already exists
                    if (!snapshot.empty) {

                        throw new functions.https.HttpsError("already-exists",
                            "Email is already in use");
                    }

                    // if we are searching in customers collection, no need to go further
                    if (collection_name === "customers") {

                        return false;
                    }

                    return admin.firestore()
                        .collection(collection_name)
                        .where("nicNumber", "==", user.nicNumber)
                        .get()
                        .then(function (snapshot) {

                            // if nic number already exists
                            if (!snapshot.empty) {

                                throw new functions.https.HttpsError("already-exists",
                                    "NIC Number is already in use");
                            }
                            if (collection_name === "delivery_boys" || collection_name === "new_delivery_boys") {

                                return admin.firestore()
                                    .collection(collection_name)
                                    .where("licenseNumber", "==", user.licenseNumber)
                                    .get()
                                    .then(function (snapshot) {

                                        // if license number already exists
                                        if (!snapshot.empty) {

                                            throw new functions.https.HttpsError("already-exists",
                                                "License Number is already in use");
                                        }

                                        return false;
                                    });

                            } else {

                                return false;
                            }
                        });
                });
        });
}

// check by plate number if a vehicle exist
utilsObject.checkVehicleDataExist = function (collection_name, vehicle) {

    return admin.firestore()
        .collection(collection_name)
        .where("plateNumber", "==", vehicle.plateNumber)
        .get()
        .then(function (snapshot) {

            // if vehicle already exists
            if (!snapshot.empty) {

                throw new functions.https.HttpsError("already-exists",
                    "Vehicle with provided plate number already exist");
            }

            return false;

        })
        .catch(e => {

            throw new functions.https.HttpsError("internal",
                e.message);
        });
}

// set fcm token for a user
utilsObject.setFcmToken = function (collection_name, user_phone, fcm_token) {

    return admin.firestore()
        .collection(collection_name)
        .where("phoneNumber", "==", user_phone)
        .get()
        .then((snapshot) => {

            if (snapshot.empty) {

                throw new functions.https.HttpsError("internal",
                    "No user found with provided phone number");
            }

            let user = snapshot.docs[0].data();

            return admin.firestore().collection(collection_name).doc(user.id)
                .update({fcmToken: fcm_token}).catch(e => {

                    throw new functions.https.HttpsError("internal",
                        e.message);
                })

        })
        .catch(e => {

            throw new functions.https.HttpsError("internal",
                e.message);
        });
}

utilsObject.updatePassword = function (data) {

    let collection_name = data["collection"];
    let user_id = data["user_id"];
    let password = data["password"];

    return admin.firestore().collection(collection_name).doc(user_id)
        .update("password", password)
        .then(() => {

            return true;

        })
        .catch(e => {

            throw new functions.https.HttpsError("internal",
                e.message);
        });
}

utilsObject.checkEditValid = function (collection, id, email) {

    return admin.firestore().collection(collection)
        .where("email", "==", email)
        .get()
        .then(snapshot => {

            if (snapshot.size > 1) {

                throw new functions.https.HttpsError("internal",
                    "Email is already taken");
            }

            return true;

        })
        .catch(e => {

            throw new functions.https.HttpsError("internal",
                e.message);
        });
}

utilsObject.checkEditValidDriver = function (collection, id, email, license) {

    return admin.firestore().collection(collection)
        .where("email", "==", email)
        .get()
        .then(snapshot => {

            if (snapshot.size > 1) {

                throw new functions.https.HttpsError("internal",
                    "Email is already taken");
            }

            return admin.firestore().collection(collection)
                .where("licenseNumber", "==", license)
                .get()
                .then(snapshot => {

                    if (snapshot.size > 1) {

                        throw new functions.https.HttpsError("internal",
                            "License is already taken");
                    }

                    return true;

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

utilsObject.checkPhoneNumber = function (collection, phone_number) {

    return admin.firestore().collection(collection)
        .where("phoneNumber", "==", phone_number)
        .get()
        .then(snapshot => {

            if (snapshot.empty) {

                throw new functions.https.HttpsError("not-found",
                    "Phone number is incorrect");
            }

            return true;

        })
        .catch(e => {

            throw new functions.https.HttpsError("internal",
                e.message);
        });
}

utilsObject.forgotPassword = function (collection, phone_number, password) {

    return admin.firestore().collection(collection)
        .where("phoneNumber", "==", phone_number)
        .get()
        .then(snapshot => {

            if (snapshot.empty) {

                throw new functions.https.HttpsError("not-found",
                    "No user found with provided phone number");
            }

            let user = snapshot.docs[0].data();

            return admin.firestore().collection(collection).doc(user.id)
                .update("password", password)
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

module.exports = utilsObject;
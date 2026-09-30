let functions = require('firebase-functions'),
    admin = require("firebase-admin");

let utilsObject = {};

utilsObject.setOrderPayed = function (order_id) {

    return admin.firestore().collection("orders")
        .doc(order_id)
        .update("isPayed", true)
        .then(() => {

            return true;

        })
        .catch(e => {

            throw new functions.https.HttpsError("internal",
                e.message);
        });
}

utilsObject.setTripPayed = function (trip_id) {

    return admin.firestore().collection("trips")
        .doc(trip_id)
        .update("isPayed", true)
        .then(() => {

            return true;

        })
        .catch(e => {

            throw new functions.https.HttpsError("internal",
                e.message);
        });
}

module.exports = utilsObject;
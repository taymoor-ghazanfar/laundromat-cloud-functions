let functions = require('firebase-functions'),
    admin = require("firebase-admin"),
    order_utils = require("./order_utils");

let utilsObject = {};

// get trip associated with a delivery boy
utilsObject.getTrip = function (trip_id) {

    return admin.firestore().collection("trips").doc(trip_id).get()
        .then(snapshot => {

            let trip = snapshot.data();
            trip.id = snapshot.id;

            // get order associated with the trip
            return order_utils.getOrder(trip.order)
                .then(order => {

                    trip.order = order;

                    return trip;

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

// get all the trips associated with a delivery boy
utilsObject.getAllUserTrips = function (trip_ids) {

    let trips = [];

    // get trip(s) associated with the delivery boy
    return Promise.all(trip_ids.map(trip_id => {

        return utilsObject.getTrip(trip_id)
            .then(trip => {

                trips.push(trip)
                return true;

            })
            .catch(e => {

                throw new functions.https.HttpsError("internal",
                    e.message);
            });

    })).then(() => {

        return trips;

    }).catch(e => {

        throw new functions.https.HttpsError("internal",
            e.message);
    });
}

module.exports = utilsObject;
let functions = require("firebase-functions"),
    trip_task_utils = require("../utils/trip_task_utils"),
    trip_utils = require("../utils/trip_utils");

exports.declineTripRequest = functions.https.onCall((data, context) => {

    return trip_task_utils.declineTripRequest(data);

});

exports.cancelTrip = functions.https.onCall((data, context) => {

    return trip_task_utils.cancelTrip(data);

});


exports.acceptTripRequest = functions.https.onCall((data, context) => {

    return trip_task_utils.acceptTripRequest(data);

});

exports.startTrip = functions.https.onCall((data, context) => {

    return trip_task_utils.startTrip(data);

});

exports.getTripById = functions.https.onCall((trip_id, context) => {

    return trip_utils.getTrip(trip_id);

});

exports.getTripByOrderId = functions.https.onCall((order_id, context) => {

    return trip_task_utils.getTripByOrderId(order_id);

});

exports.getTripStatus = functions.https.onCall((order_id, context) => {

    return trip_task_utils.getTripStatus(order_id);

});

exports.confirmArrivalToSource = functions.https.onCall((data, context) => {

    return trip_task_utils.confirmArrivalToSource(data);

});

exports.confirmPickedUp = functions.https.onCall((data, context) => {

    return trip_task_utils.confirmPickedUp(data);

});

exports.confirmArrivalToDestination = functions.https.onCall((data, context) => {

    return trip_task_utils.confirmArrivalToDestination(data);

});

exports.confirmDelivery = functions.https.onCall((data, context) => {

    return trip_task_utils.confirmDelivery(data);

});

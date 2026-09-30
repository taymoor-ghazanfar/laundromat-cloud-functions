let functions = require("firebase-functions"),
    payment_utils = require("../utils/payment_utils");

exports.setOrderPayed = functions.https.onCall((order_id, context) => {

    return payment_utils.setOrderPayed(order_id);

});

exports.setTripPayed = functions.https.onCall((trip_id, context) => {

    return payment_utils.setTripPayed(trip_id);

});
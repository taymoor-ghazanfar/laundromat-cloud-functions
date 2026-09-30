let functions = require('firebase-functions'),
    admin = require("firebase-admin");

let utilsObject = {};

// send a fcm message to merchant about order request
utilsObject.sendOrderRequestMessage = function (data) {

    let message = {
        data: {

            task: data.task,
            customer_phone: data.customer_phone,
            merchant_phone: data.merchant_phone,
            order: data.order.id.toString()
        },
        token: data.fcm_token
    };

    return admin.messaging().send(message)
        .catch((e) => {

            throw new functions.https.HttpsError("internal",
                e.message);
        });
}

// send a fcm message to customer about order decline
utilsObject.sendOrderDeclinedMessage = function (data) {

    let message = {
        data: {

            task: data.task,
            order: data.order.id.toString()
        },
        token: data.customer_fcm_token
    };

    return admin.messaging().send(message)
        .catch((e) => {

            console.log(e);

            throw new functions.https.HttpsError("internal",
                e.message);
        });
}

// send a fcm message to customer about order accepted
utilsObject.sendOrderAcceptedMessage = function (data) {

    let message = {
        data: {

            task: data.task,
            order: data.order.id.toString()
        },
        token: data.customer_fcm_token
    };

    return admin.messaging().send(message)
        .catch((e) => {

            throw new functions.https.HttpsError("internal",
                e.message);
        });
}

utilsObject.sendOrderCancelMessageToMerchant = function (data) {

    let message = {
        data: {

            task: data.task,
            merchant_phone: data.merchant_phone,
            order: data.order.id.toString()
        },
        token: data.merchant_fcm_token
    };

    return admin.messaging().send(message)
        .catch((e) => {

            throw new functions.https.HttpsError("internal",
                e.message);
        });
}

utilsObject.sendOrderCancelMessageToCustomer = function (data) {

    let message = {
        data: {

            task: data.task,
            order: data.order.id.toString()
        },
        token: data.customer_fcm_token
    };

    return admin.messaging().send(message)
        .catch((e) => {

            throw new functions.https.HttpsError("internal",
                e.message);
        });
}

utilsObject.sendPickupRequestToDriver = function (data) {

    let message = {
        data: {

            task: data.task,
            trip: data.trip.id.toString(),
            delivery_boy_phone: data.delivery_boy_phone
        },
        token: data.delivery_boy_fcm_token
    };

    return admin.messaging().send(message)
        .catch((e) => {

            throw new functions.https.HttpsError("internal",
                e.message);
        });

}

utilsObject.sendPickupRequestToCustomer = function (data) {

    let message = {
        data: {

            task: data.task,
            trip: data.trip.id.toString(),
            order: data.order.id.toString()
        },
        token: data.customer_fcm_token
    };

    return admin.messaging().send(message)
        .catch((e) => {

            throw new functions.https.HttpsError("internal",
                e.message);
        });
}

utilsObject.sendPickupDeclinedMessage = function (fcm_token, task, order) {

    let message = {
        data: {

            task: task,
            order: order.id.toString()
        },
        token: fcm_token
    };

    return admin.messaging().send(message)
        .catch((e) => {

            throw new functions.https.HttpsError("internal",
                e.message);
        });
}

utilsObject.sendPickupAcceptedMessage = function (fcm_token, task, order) {

    let message = {
        data: {

            task: task,
            order: order.id.toString()
        },
        token: fcm_token
    };

    return admin.messaging().send(message)
        .catch((e) => {

            throw new functions.https.HttpsError("internal",
                e.message);
        });
}

utilsObject.sendOrderDeleteToDriver = function (data) {
    let message = {
        data: {

            task: "TRIP_DELETE",
            trip_id: data.trip_id
        },
        token: data.fcm_token
    };

    return admin.messaging().send(message)
        .catch((e) => {

            throw new functions.https.HttpsError("internal",
                e.message);
        });

}

utilsObject.sendPickupStarted = function (fcm_token, task, order) {

    let message = {
        data: {

            task,
            order: order.id.toString()
        },
        token: fcm_token
    };

    return admin.messaging().send(message)
        .catch((e) => {

            throw new functions.https.HttpsError("internal",
                e.message);
        });
}

utilsObject.sendTripStatusChangedMessage = function (fcm_token, task, trip_type, order) {

    let message = {
        data: {

            task,
            trip_type,
            order: order.id.toString()
        },
        token: fcm_token
    };

    return admin.messaging().send(message)
        .catch((e) => {

            throw new functions.https.HttpsError("internal",
                e.message);
        });
}

utilsObject.sendPickedUpMessageToCustomer = function (fcm_token, task, trip_type, order, transaction1, transaction2) {

    let message = {
        data: {

            task,
            trip_type,
            order: order.id.toString(),
            transaction1,
            transaction2,
        },
        token: fcm_token
    };

    return admin.messaging().send(message)
        .catch((e) => {

            throw new functions.https.HttpsError("internal",
                e.message);
        });
}

utilsObject.sendDeliveringMessageToCustomer = function (fcm_token, task, trip_type, order) {

    let message = {
        data: {

            task,
            trip_type,
            order: order.id.toString()
        },
        token: fcm_token
    };

    return admin.messaging().send(message)
        .catch((e) => {

            throw new functions.https.HttpsError("internal",
                e.message);
        });
}

utilsObject.sendPickedUpMessageToMerchant = function (fcm_token, task, trip_type, order, transaction) {

    let message = {
        data: {

            task,
            trip_type,
            order: order.id.toString(),
            transaction
        },
        token: fcm_token
    };

    return admin.messaging().send(message)
        .catch((e) => {

            throw new functions.https.HttpsError("internal",
                e.message);
        });
}

utilsObject.sendPickedUpMessageToDriver = function (fcm_token, task, transaction) {

    let message = {
        data: {

            task,
            transaction
        },
        token: fcm_token
    };

    return admin.messaging().send(message)
        .catch((e) => {

            throw new functions.https.HttpsError("internal",
                e.message);
        });
}


utilsObject.sendOrderCollectedMessage = function (fcm_token, task, order) {

    let message = {
        data: {

            task,
            order: order.id.toString()
        },
        token: fcm_token
    };

    return admin.messaging().send(message)
        .catch((e) => {

            throw new functions.https.HttpsError("internal",
                e.message);
        });
}

utilsObject.sendOrderStatusChanged = function (fcm_token, task, order) {

    let message = {
        data: {

            task,
            order: order.id.toString()
        },
        token: fcm_token
    };

    return admin.messaging().send(message)
        .catch((e) => {

            throw new functions.https.HttpsError("internal",
                e.message);
        });
}

utilsObject.sendTripCancelMessage = function (fcm_token, task, order_id) {

    let message = {
        data: {

            task,
            order: order_id.toString()
        },
        token: fcm_token
    };

    return admin.messaging().send(message)
        .catch((e) => {

            throw new functions.https.HttpsError("internal",
                e.message);
        });
}


module.exports = utilsObject;
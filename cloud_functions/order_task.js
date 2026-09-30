let functions = require("firebase-functions"),
    order_task_utils = require("../utils/order_task_utils");

exports.getOrderById = functions.https.onCall((order_id, context) => {

    return order_task_utils.getOrderById(order_id);

});

exports.sendOrderRequest = functions.https.onCall((order, context) => {

    return order_task_utils.sendOrderRequest(order);

});

exports.declineOrderRequest = functions.https.onCall((data, context) => {

    let laundry_id = data.laundry_id;
    let customer_id = data.customer_id;
    let order_id = data.order_id;

    return order_task_utils.declineOrderRequest(laundry_id, customer_id, order_id);

});

exports.acceptOrderRequest = functions.https.onCall((data, context) => {

    let laundry_id = data.laundry_id;
    let customer_id = data.customer_id;
    let order_id = data.order_id;

    return order_task_utils.acceptOrderRequest(laundry_id, customer_id, order_id);

});

exports.cancelOrderByCustomer = functions.https.onCall((data, context) => {

    let laundry_id = data.laundry_id;
    let customer_id = data.customer_id;
    let order_id = data.order_id;

    return order_task_utils.cancelOrderByCustomer(laundry_id, customer_id, order_id);

});

exports.cancelOrderByMerchant = functions.https.onCall((data) => {

    let laundry_id = data.laundry_id;
    let customer_id = data.customer_id;
    let order_id = data.order_id;

    return order_task_utils.cancelOrderByMerchant(laundry_id, customer_id, order_id);

});

exports.sendPickupRequest = functions.https.onCall((data) => {

    let trip = data.trip;

    return order_task_utils.sendPickupRequest(trip);
});

exports.changeOrderStatus = functions.https.onCall((data) => {

    return order_task_utils.changeOrderStatus(data);

});
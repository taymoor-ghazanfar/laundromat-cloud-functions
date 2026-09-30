let admin = require("firebase-admin");

admin.initializeApp({
    storageBucket: "laundromat-317518.appspot.com"
});

exports.admin = require('./cloud_functions/admin');
exports.merchant = require('./cloud_functions/merchant');
exports.laundry = require('./cloud_functions/laundry');
exports.delivery_boy = require('./cloud_functions/delivery_boy');
exports.customer = require('./cloud_functions/customer');
exports.vehicle = require('./cloud_functions/vehicle');
exports.order_task = require('./cloud_functions/order_task');
exports.trip_task = require('./cloud_functions/trip_task');
exports.payment = require('./cloud_functions/payment');

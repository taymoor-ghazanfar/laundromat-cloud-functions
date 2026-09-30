let functions = require('firebase-functions'),
    admin = require("firebase-admin"),
    merchant_utils = require("./merchant_utils"),
    customer_utils = require("./customer_utils"),
    laundry_utils = require("./laundry_utils"),
    delivery_boy_utils = require("./delivery_boy_utils"),
    order_utils = require("./order_utils"),
    fcm_utils = require("./fcm_utils"),
    email_utils = require("./email_utils");

let utilsObject = {};

// get a order by id
utilsObject.getOrderById = function (order_id) {

    return order_utils.getOrder(order_id);
}

// send a new order request (from customer to laundry)
utilsObject.sendOrderRequest = function (order) {

    let order_id = admin.firestore().collection("orders").doc().id;
    let customer_id = order.customerId;
    let laundry_id = order.laundryId;

    order.id = order_id;

    // push the order to orders collection
    return admin.firestore().collection("orders")
        .doc(order_id)
        .set(order)
        .then(() => {

            // set order id to customer's document
            return order_utils.setOrderToUser("customers", customer_id, order_id)
                .then(() => {

                    // set order id to laundry document
                    return order_utils.setOrderToUser("laundries", laundry_id, order_id)
                        .then(() => {

                            console.log(laundry_id);

                            // get merchant of the laundry
                            return merchant_utils.getMerchantByLaundryId(laundry_id)
                                .then(merchant => {

                                    // get customer of the order
                                    return customer_utils.getCustomerById(customer_id)
                                        .then(customer => {

                                            let merchant_fcm_token = merchant.fcmToken;
                                            let data = {

                                                task: "ORDER_REQUEST",
                                                fcm_token: merchant_fcm_token,
                                                customer_phone: customer.phoneNumber,
                                                merchant_phone: merchant.phoneNumber,
                                                order: order
                                            }

                                            // send fcm to the merchant about the order
                                            return fcm_utils.sendOrderRequestMessage(data)
                                                .then(() => {

                                                    // send order request email to merchant
                                                    return email_utils.sendOrderRequestToMerchant(merchant.email, data)
                                                        .then(() => {

                                                            // send order request email to customer
                                                            return email_utils.sendOrderRequestToCustomer(customer.email, data)
                                                                .then(() => {

                                                                    return order_id;
                                                                    //todo: finished
                                                                });
                                                        });
                                                });
                                        });
                                });
                        });
                });

        })
        .catch(e => {

            throw new functions.https.HttpsError("internal",
                e.message);
        });
}

// decline order request (by merchant)
utilsObject.declineOrderRequest = function (laundry_id, customer_id, order_id) {

    // change order status to DECLINED
    return admin.firestore().collection("orders").doc(order_id)
        .update("status", "DECLINED")
        .then(() => {

            // get customer by id
            return customer_utils.getCustomerById(customer_id).then(customer => {

                // get laundry by id
                return laundry_utils.getLaundryById(laundry_id).then(laundry => {

                    // get order by id
                    return order_utils.getOrder(order_id).then(order => {

                        // set fcm data
                        let task = "ORDER_DECLINE";
                        let customer_fcm_token = customer.fcmToken.toString();
                        let data = {

                            task,
                            customer_fcm_token,
                            customer_email: customer.email,
                            order: order
                        }

                        // send fcm to the customer
                        return fcm_utils.sendOrderDeclinedMessage(data)
                            .then(() => {

                                // send email to the customer
                                return email_utils.sendOrderDeclinedEmail(data);
                                //todo: finished
                            });
                    });
                });
            });

        })
        .catch(e => {

            throw new functions.https.HttpsError("internal",
                e.message);
        });
}

// accept the order request (by merchant)
utilsObject.acceptOrderRequest = function (laundry_id, customer_id, order_id) {

    // change order status to ACCEPTED
    return order_utils.changeOrderStatus(order_id, "ACCEPTED")
        .then(() => {

            // get customer by id
            return customer_utils.getCustomerById(customer_id).then(customer => {

                // get laundry by id
                return laundry_utils.getLaundryById(laundry_id).then(laundry => {

                    // get order by id
                    return order_utils.getOrder(order_id).then(order => {

                        // set fcm data
                        let task = "ORDER_ACCEPT";
                        let customer_fcm_token = customer.fcmToken.toString();
                        let data = {

                            task,
                            customer_fcm_token,
                            customer_email: customer.email,
                            order: order
                        }

                        // send fcm to the customer
                        return fcm_utils.sendOrderAcceptedMessage(data)
                            .then(() => {

                                // send email to the user
                                return email_utils.sendOrderAcceptedEmail(data);
                                //todo: finished
                            });
                    });
                });
            });

        })
        .catch(e => {

            throw new functions.https.HttpsError("internal",
                e.message);
        });
}

// cancel order by customer
utilsObject.cancelOrderByCustomer = function (laundry_id, customer_id, order_id) {

    // change order status to cancelled
    return order_utils.changeOrderStatus(order_id, "CANCELLED")
        .then(() => {

            // get order by id
            return order_utils.getOrder(order_id)
                .then(order => {

                    // get merchant by laundry id
                    return merchant_utils.getMerchantByLaundryId(laundry_id)
                        .then(merchant => {

                            // get customer by id
                            return customer_utils.getCustomerById(customer_id)
                                .then(customer => {

                                    // set fcm and email data
                                    let task = "ORDER_CANCEL";
                                    let merchant_fcm_token = merchant.fcmToken.toString();
                                    let merchant_phone = merchant.phoneNumber;
                                    let data = {

                                        task,
                                        merchant_fcm_token,
                                        merchant_phone,
                                        customer_email: customer.email,
                                        merchant_email: merchant.email,
                                        order: order
                                    }

                                    // send fcm to merchant
                                    return fcm_utils.sendOrderCancelMessageToMerchant(data)
                                        .then(() => {

                                            // send email to merchant
                                            return email_utils.sendOrderCancelToMerchant(data).then(() => {

                                                // send email to customer
                                                return email_utils.sendOrderCancelToCustomer(data);
                                                //todo finish

                                            });
                                        });
                                });
                        });

                });
        })
}

// cancel order by merchant
utilsObject.cancelOrderByMerchant = function (laundry_id, customer_id, order_id) {

    // change order status to cancelled
    return order_utils.changeOrderStatus(order_id, "CANCELLED")
        .then(() => {

            // get order by id
            return order_utils.getOrder(order_id)
                .then(order => {

                    // get merchant by laundry id
                    return merchant_utils.getMerchantByLaundryId(laundry_id)
                        .then(merchant => {

                            // get customer by id
                            return customer_utils.getCustomerById(customer_id)
                                .then(customer => {

                                    // set fcm and email data
                                    let task = "ORDER_CANCEL";
                                    let customer_fcm_token = customer.fcmToken.toString();
                                    let data = {

                                        task,
                                        customer_fcm_token,
                                        customer_email: customer.email,
                                        merchant_email: merchant.email,
                                        order: order
                                    }

                                    // send fcm to customer
                                    return fcm_utils.sendOrderCancelMessageToCustomer(data)
                                        .then(() => {

                                            // send email to merchant
                                            return email_utils.sendOrderCancelToMerchant(data).then(() => {

                                                // send email to customer
                                                return email_utils.sendOrderCancelToCustomer(data);
                                                //todo finish

                                            });
                                        });
                                });
                        });

                });
        })
}

utilsObject.sendPickupRequest = function (trip) {

    trip.id = admin.firestore().collection("trips").doc().id;
    let trip_clone = JSON.parse(JSON.stringify(trip));
    trip.order = trip.order.id;

    let pickup_location = trip.source;

    // get nearby drivers
    return delivery_boy_utils.getNearbyDeliveryBoys(pickup_location)
        .then(nearby_drivers => {

            // send pickup request to all nearby drivers
            return Promise.all(nearby_drivers
                .map(driver => {

                    // add the pickup request to the delivery boys trips
                    return admin.firestore().collection("delivery_boys")
                        .doc(driver.id)
                        .update("trips", admin.firestore.FieldValue.arrayUnion(trip.id))
                        .then(() => {

                            // set data
                            let data = {

                                task: trip_clone.order.status === "ACCEPTED" ?
                                    "PICKUP_REQUEST" : "DELIVERY_REQUEST",
                                delivery_boy_fcm_token: driver.fcmToken.toString(),
                                delivery_boy_phone: driver.phoneNumber,
                                trip: trip_clone
                            }

                            // send fcm to the driver
                            return fcm_utils.sendPickupRequestToDriver(data)
                                .then(() => {

                                    return true;
                                });

                        }).catch(e => {

                            throw new functions.https.HttpsError("internal",
                                e.message);
                        });
                }))
                .then(() => {

                    // push the trip to database
                    return admin.firestore().collection("trips").doc(trip.id).set(trip)
                        .then(() => {

                            // change the order status in database
                            return order_utils.changeOrderStatus(trip_clone.order.id,
                                trip_clone.order.status === "ACCEPTED" ?
                                    "PICKUP_REQUESTED" : "DELIVERY_REQUESTED")

                                .then(() => {

                                    // get customer by id
                                    return customer_utils.getCustomerById(trip_clone.order.customerId)
                                        .then(customer => {

                                            let data = {

                                                task: trip_clone.order.status === "ACCEPTED" ?
                                                    "PICKUP_REQUEST" : "DELIVERY_REQUEST",
                                                customer_fcm_token: customer.fcmToken.toString(),
                                                customer_email: customer.email,
                                                trip: trip_clone,
                                                order: trip_clone.order
                                            }

                                            // send fcm to the customer
                                            return fcm_utils.sendPickupRequestToCustomer(data)
                                                .then(() => {

                                                    // send email to the customer
                                                    return email_utils.sendPickupEmailToCustomer(data)
                                                        .then(() => {

                                                            return true;
                                                            //todo: finish
                                                        });
                                                });
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
        })
        .catch((e) => {

            throw new functions.https.HttpsError("internal",
                e.message);
        })
}

utilsObject.changeOrderStatus = function (data) {

    let customer_id = data.customer_id;
    let order = data.order;

    // change order status
    return admin.firestore().collection("orders").doc(order.id)
        .update("status", order.status)
        .then(() => {

            // get customer
            return customer_utils.getCustomerById(customer_id)
                .then(customer => {

                    let task = "STATUS_CHANGED";

                    // send fcm to customer
                    return fcm_utils.sendOrderStatusChanged(customer.fcmToken, task, order)
                        .then(() => {

                            return true;
                            // todo: finish
                        })
                });

        })
        .catch(e => {

            throw new functions.https.HttpsError("internal",
                e.message);
        });
}

module.exports = utilsObject;
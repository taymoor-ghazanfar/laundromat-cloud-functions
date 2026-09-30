let functions = require('firebase-functions'),
    admin = require("firebase-admin"),
    fcm_utils = require("../utils/fcm_utils"),
    customer_utils = require("../utils/customer_utils"),
    merchant_utils = require("../utils/merchant_utils"),
    trip_utils = require("../utils/trip_utils"),
    delivery_boy_utils = require("../utils/delivery_boy_utils"),
    email_utils = require("../utils/email_utils");

let utilsObject = {};

// decline trip request
utilsObject.declineTripRequest = function (data) {

    let trip_id = data.trip_id;
    let driver_id = data.driver_id;
    let customer_id = data.customer_id;
    let merchant_id = data.merchant_id;
    let order = data.order;

    // remove the trip from driver document
    return admin.firestore().collection("delivery_boys")
        .doc(driver_id)
        .update("trips", admin.firestore.FieldValue.arrayRemove(trip_id))
        .then(() => {

            // check if every driver has declined this trip
            return admin.firestore().collection("delivery_boys")
                .where("trips", "array-contains", trip_id)
                .get()
                .then(snapshot => {

                    // if every driver has declined this trip
                    if (snapshot.empty) {

                        // change trip status to declined
                        return admin.firestore().collection("trips")
                            .doc(trip_id)
                            .update("status", "DECLINED")
                            .then(() => {

                                let order_status;

                                if (order.status === "ACCEPTED" || order.status === "PICKUP_REQUESTED") {

                                    order_status = "ACCEPTED";

                                } else {

                                    order_status = "WASHED"
                                }

                                // revert order status
                                return admin.firestore().collection("orders")
                                    .doc(order.id)
                                    .update("status", order_status)
                                    .then(() => {

                                        // get customer
                                        return admin.firestore().collection("customers")
                                            .doc(customer_id).get()
                                            .then(doc => {

                                                let customer = doc.data();

                                                // get merchant
                                                return admin.firestore().collection("merchants")
                                                    .doc(merchant_id)
                                                    .get()
                                                    .then(doc => {

                                                        let merchant = doc.data();

                                                        let data = {

                                                            customer_fcm_token: customer.fcmToken,
                                                            merchant_fcm_token: merchant.fcmToken,
                                                            task: order_status === "ACCEPTED" ?
                                                                "PICKUP_DECLINED" : "DELIVERY_DECLINED",
                                                            order: order
                                                        }

                                                        // send fcm to customer
                                                        return fcm_utils.sendPickupDeclinedMessage
                                                        (data.customer_fcm_token, data.task, data.order)
                                                            .then(() => {

                                                                // send fcm to merchant
                                                                return fcm_utils.sendPickupDeclinedMessage
                                                                (data.merchant_fcm_token, data.task, data.order)
                                                                    .then(() => {

                                                                        return true;
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
                                            })

                                    })
                                    .catch(e => {

                                        throw new functions.https.HttpsError("internal",
                                            e.message);
                                    })

                            })
                            .catch(e => {

                                throw new functions.https.HttpsError("internal",
                                    e.message);
                            });
                    }
                    // if the trip request still exist in some driver document
                    else {

                        return true;
                    }
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

utilsObject.cancelTrip = function (data) {

    let trip_id = data.trip_id;
    let trip_type = data.trip_type;
    let customer_id = data.customer_id;
    let merchant_id = data.merchant_id;
    let driver_id = data.driver_id;
    let order_id = data.order_id;

    // change trip status
    return admin.firestore().collection("trips")
        .doc(trip_id)
        .update("status", "CANCELLED")
        .then(() => {

            let order_status;

            if (trip_type === "PICKUP") {

                order_status = "ACCEPTED";
            } else {

                order_status = "WASHED"
            }

            // change order status
            return admin.firestore().collection("orders")
                .doc(order_id)
                .update("status", order_status)
                .then(() => {

                    // get customer
                    return customer_utils.getCustomerById(customer_id)
                        .then(customer => {

                            // get merchant
                            return merchant_utils.getMerchantById(merchant_id)
                                .then(merchant => {

                                    // get driver
                                    return delivery_boy_utils.getById(driver_id)
                                        .then(driver => {

                                            let data = {

                                                customer_fcm_token: customer.fcmToken,
                                                merchant_fcm_token: merchant.fcmToken,
                                                customer_email: customer.email,
                                                merchant_email: merchant.email,
                                                driver_email: driver.email,
                                                task: "TRIP_CANCEL",
                                                order_id: order_id,
                                                trip_id: trip_id
                                            }

                                            // send fcm to customer
                                            return fcm_utils.sendTripCancelMessage(data.customer_fcm_token, data.task, data.order_id)
                                                .then(() => {

                                                    // send fcm to merchant
                                                    return fcm_utils.sendTripCancelMessage(data.merchant_fcm_token, data.task, data.order_id)
                                                        .then(() => {

                                                            // send email to customer
                                                            return email_utils.sendTripCancelEmail(data.customer_email, data.order_id)
                                                                .then(() => {

                                                                    // send email to merchant
                                                                    return email_utils.sendTripCancelEmail(data.merchant_email, data.order_id)
                                                                        .then(() => {

                                                                            // send email to driver
                                                                            return email_utils.sendTripCancelEmailToDriver(data.driver_email, data.trip_id)
                                                                                .then(() => {

                                                                                    //todo: finish
                                                                                    return true;
                                                                                })
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
        })
        .catch(e => {

            throw new functions.https.HttpsError("internal",
                e.message);
        });
}

utilsObject.acceptTripRequest = function (data) {

    let trip_id = data.trip_id;
    let driver_id = data.driver_id;
    let customer_id = data.customer_id;
    let order = data.order;

    // get the trip
    return admin.firestore().collection("trips")
        .doc(trip_id)
        .get()
        .then(doc => {

            let trip = doc.data();

            // change the trip status to accepted
            trip.status = "ACCEPTED";

            // add the driver id to the trip
            trip.driverId = driver_id;

            // update trip
            return admin.firestore().collection("trips")
                .doc(trip_id)
                .set(trip)
                .then(() => {

                    // get all other drivers who received the trip request
                    return admin.firestore().collection("delivery_boys")
                        .where("id", "!=", driver_id)
                        .where("trips", "array-contains", trip_id)
                        .get()
                        .then(snapshot => {

                            if (!snapshot.empty) {

                                return Promise.all(snapshot.docs
                                    .map(doc => {

                                        let driver = doc.data();

                                        // remove the trip from driver trips
                                        return admin.firestore().collection("delivery_boys")
                                            .doc(driver.id)
                                            .update("trips", admin.firestore.FieldValue.arrayRemove(trip_id))
                                            .then(() => {

                                                let data = {

                                                    fcm_token: driver.fcmToken,
                                                    trip_id: trip_id
                                                }

                                                // send fcm to drivers
                                                fcm_utils.sendOrderDeleteToDriver(data).then(() => {

                                                    return true;
                                                });

                                            })
                                            .catch(e => {

                                                throw new functions.https.HttpsError("internal",
                                                    e.message);
                                            });
                                    }))
                                    .then(() => {

                                        let order_status;

                                        if (order.status === "ACCEPTED" || order.status === "PICKUP_REQUESTED") {

                                            order_status = "PICKUP_ACCEPTED";

                                        } else {

                                            order_status = "DELIVERY_ACCEPTED"
                                        }

                                        // change order status
                                        return admin.firestore().collection("orders")
                                            .doc(order.id)
                                            .update("status", order_status)
                                            .then(() => {

                                                // get customer
                                                return customer_utils.getCustomerById(customer_id)
                                                    .then(customer => {

                                                        // get merchant
                                                        return merchant_utils.getMerchantByLaundryId(order.laundryId)
                                                            .then(merchant => {

                                                                let data = {

                                                                    customer_fcm_token: customer.fcmToken,
                                                                    merchant_fcm_token: merchant.fcmToken,
                                                                    task: order_status === "PICKUP_ACCEPTED" ?
                                                                        "PICKUP_ACCEPTED" : "DELIVERY_ACCEPTED",
                                                                    order: order
                                                                }

                                                                // send fcm to the customer
                                                                return fcm_utils.sendPickupAcceptedMessage
                                                                (data.customer_fcm_token, data.task, data.order)
                                                                    .then(() => {

                                                                        // send fcm to the merchant
                                                                        return fcm_utils.sendPickupAcceptedMessage
                                                                        (data.merchant_fcm_token, data.task, data.order)
                                                                            .then(() => {

                                                                                return true;
                                                                                //todo: finish
                                                                            });
                                                                    });
                                                            });
                                                    });
                                            })
                                            .catch(e => {

                                                throw new functions.https.HttpsError("internal",
                                                    e.message);
                                            });

                                    }).catch(e => {

                                        throw new functions.https.HttpsError("internal",
                                            e.message);
                                    });
                            }
                            // if all other drivers have already declined this trip
                            else {

                                let order_status;

                                if (order.status === "ACCEPTED" || order.status === "PICKUP_REQUESTED") {

                                    order_status = "PICKUP_ACCEPTED";

                                } else {

                                    order_status = "DELIVERY_ACCEPTED"
                                }

                                // change order status
                                return admin.firestore().collection("orders")
                                    .doc(order.id)
                                    .update("status", order_status)
                                    .then(() => {

                                        // get customer
                                        return customer_utils.getCustomerById(customer_id)
                                            .then(customer => {

                                                // get merchant
                                                return merchant_utils.getMerchantByLaundryId(order.laundryId)
                                                    .then(merchant => {

                                                        let data = {

                                                            customer_fcm_token: customer.fcmToken,
                                                            merchant_fcm_token: merchant.fcmToken,
                                                            task: order_status === "PICKUP_ACCEPTED" ?
                                                                "PICKUP_ACCEPTED" : "DELIVERY_ACCEPTED",
                                                            order: order
                                                        }

                                                        // send fcm to the customer
                                                        return fcm_utils.sendPickupAcceptedMessage
                                                        (data.customer_fcm_token, data.task, data.order)
                                                            .then(() => {

                                                                // send fcm to the merchant
                                                                return fcm_utils.sendPickupAcceptedMessage
                                                                (data.merchant_fcm_token, data.task, data.order)
                                                                    .then(() => {

                                                                        return true;
                                                                        //todo: finish
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

utilsObject.startTrip = function (data) {

    let trip_id = data.trip_id;
    let trip_type = data.trip_type;
    let trip_start_date = data.trip_start_date;
    let customer_id = data.customer_id;
    let order = data.order;

    // change trip status and update started time
    return admin.firestore().collection("trips")
        .doc(trip_id)
        .update({

            status: "STARTED",
            dateStarted: trip_start_date

        })
        .then(() => {

            let order_status;

            if (trip_type === "PICKUP") {

                order_status = "PICK_UP";

            } else {

                order_status = "DELIVERING";
            }

            // change order status
            return admin.firestore().collection("orders")
                .doc(order.id)
                .update("status", order_status)
                .then(() => {

                    order.status = order_status;

                    // get trip
                    return trip_utils.getTrip(trip_id)
                        .then(trip => {

                            // get customer
                            return customer_utils.getCustomerById(customer_id)
                                .then(customer => {

                                    // get merchant
                                    return merchant_utils.getMerchantByLaundryId(order.laundryId)
                                        .then(merchant => {

                                            let data = {

                                                customer_fcm_token: customer.fcmToken,
                                                merchant_fcm_token: merchant.fcmToken,
                                                task: order_status === "PICK_UP" ?
                                                    "PICKUP_STARTED" : "DELIVERY_STARTED",
                                                order: order,
                                                trip: trip
                                            }

                                            // send fcm to customer
                                            return fcm_utils.sendPickupStarted
                                            (data.customer_fcm_token, data.task, data.order)
                                                .then(() => {

                                                    // send fcm to merchant
                                                    return fcm_utils.sendPickupStarted
                                                    (data.merchant_fcm_token, data.task, data.order)
                                                        .then(() => {

                                                            return true;
                                                            //todo: finish
                                                        });
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
                })
        })
        .catch(e => {

            throw new functions.https.HttpsError("internal",
                e.message);
        });
}
utilsObject.getTripByOrderId = function (order_id) {

    return admin.firestore().collection("trips")
        .where("order", "==", order_id)
        .where("status", "!=", "DECLINED")
        .get()
        .then(snapshot => {

            if (snapshot.empty) {

                throw new functions.https.HttpsError("not-found",
                    "No trip found with provided id");
            }

            let trip;

            for (let x = 0; x < snapshot.docs.length; x++) {

                let search_trip = snapshot.docs[x].data();

                if (search_trip.status !== "COMPLETED" && search_trip.status !== "CANCELLED") {

                    trip = search_trip;
                    break
                }
            }

            return trip_utils.getTrip(trip.id);

        })
        .catch(e => {

            throw new functions.https.HttpsError("internal",
                e.message);
        });
}

utilsObject.getTripStatus = function (order_id) {

    return admin.firestore().collection("trips")
        .where("order", "==", order_id)
        .where("status", "!=", "DECLINED")
        .get()
        .then(snapshot => {

            if (snapshot.empty) {

                throw new functions.https.HttpsError("not-found",
                    "No trip found with provided id");
            }

            let trip = snapshot.docs[0].data();

            return trip.status;

        })
        .catch(e => {

            throw new functions.https.HttpsError("internal",
                e.message);
        });
}

utilsObject.confirmArrivalToSource = function (data) {

    let trip_id = data.trip_id;
    let trip_type = data.trip_type;
    let customer_id = data.customer_id;
    let order = data.order;

    // change trip status
    return admin.firestore().collection("trips").doc(trip_id)
        .update("status", "ARRIVED_SOURCE")
        .then(() => {

            // if trip is a pickup order
            if (trip_type === "PICKUP") {

                // get customer
                return customer_utils.getCustomerById(customer_id)
                    .then(customer => {

                        let data = {

                            customer_fcm_token: customer.fcmToken,
                            task: "ARRIVED_SOURCE",
                            trip_type,
                            order: order
                        }

                        // send fcm to customer only
                        return fcm_utils.sendTripStatusChangedMessage
                        (data.customer_fcm_token, data.task, data.trip_type, data.order)
                            .then(() => {

                                return true;
                                //todo: finish
                            })
                    });
            }
            // if trip is a delivery order
            else {

                // get merchant
                return merchant_utils.getMerchantByLaundryId(order.laundryId)
                    .then(merchant => {

                        let data = {

                            merchant_fcm_token: merchant.fcmToken,
                            task: "ARRIVED_SOURCE",
                            trip_type,
                            order: order
                        }

                        // send fcm to merchant only
                        return fcm_utils.sendTripStatusChangedMessage
                        (data.merchant_fcm_token, data.task, data.trip_type, data.order)
                            .then(() => {

                                return true;
                                //todo: finish
                            })
                    });
            }

        })
        .catch(e => {

            throw new functions.https.HttpsError("internal",
                e.message);
        })
}

utilsObject.confirmPickedUp = function (data) {

    let trip_type = data.trip_type.toString();

    // if this is a pickup trip
    if (trip_type === "PICKUP") {

        let trip_id = data.trip_id;
        let customer_id = data.customer_id;
        let merchant_id = data.merchant_id;
        let driver_id = data.driver_id;
        let order = data.order;
        let customer_transaction1 = data.customer_transaction1;
        let customer_transaction2 = data.customer_transaction2;
        let merchant_transaction = data.merchant_transaction;
        let driver_transaction = data.driver_transaction;

        // update trip status
        return admin.firestore().collection("trips")
            .doc(trip_id).update("status", "PICKED_UP")
            .then(() => {

                // add ORDER transaction to customer
                return admin.firestore().collection("customers").doc(customer_id)
                    .update("transactions", admin.firestore.FieldValue.arrayUnion(customer_transaction1))
                    .then(() => {

                        // add PICKUP FEE transaction to customer
                        return admin.firestore().collection("customers").doc(customer_id)
                            .update("transactions", admin.firestore.FieldValue.arrayUnion(customer_transaction2))
                            .then(() => {

                                // add transaction to merchant
                                return admin.firestore().collection("merchants").doc(merchant_id)
                                    .update("transactions", admin.firestore.FieldValue.arrayUnion(merchant_transaction))
                                    .then(() => {

                                        // add transaction to driver
                                        return admin.firestore().collection("delivery_boys").doc(driver_id)
                                            .update("transactions", admin.firestore.FieldValue.arrayUnion(driver_transaction))
                                            .then(() => {

                                                // get customer
                                                return customer_utils.getCustomerById(customer_id)
                                                    .then(customer => {

                                                        // get merchant
                                                        return merchant_utils.getMerchantById(merchant_id)
                                                            .then(merchant => {

                                                                // get driver
                                                                return delivery_boy_utils.getById(driver_id)
                                                                    .then(driver => {

                                                                        // get trip
                                                                        return trip_utils.getTrip(trip_id)
                                                                            .then(trip => {

                                                                                let data = {

                                                                                    customer_fcm_token: customer.fcmToken,
                                                                                    merchant_fcm_token: merchant.fcmToken,
                                                                                    task: "PICKED_UP",
                                                                                    trip_type,
                                                                                    order: order,
                                                                                    trip: trip,
                                                                                    customer_transaction1: JSON.stringify(customer_transaction1),
                                                                                    customer_transaction2: JSON.stringify(customer_transaction2),
                                                                                    merchant_transaction: JSON.stringify(merchant_transaction),
                                                                                }

                                                                                // send fcm to customer
                                                                                return fcm_utils.sendPickedUpMessageToCustomer
                                                                                (data.customer_fcm_token, data.task,
                                                                                    data.trip_type, data.order, data.customer_transaction1, data.customer_transaction2)
                                                                                    .then(() => {

                                                                                        // send fcm to merchant
                                                                                        return fcm_utils.sendPickedUpMessageToMerchant
                                                                                        (data.merchant_fcm_token, data.task, data.trip_type, data.order, data.merchant_transaction)
                                                                                            .then(() => {

                                                                                                // send email to customer
                                                                                                return email_utils.sendPaymentEmailToCustomer(customer.email, data.order, data.trip)
                                                                                                    .then(() => {

                                                                                                        // send email to driver
                                                                                                        return email_utils.sendEarningEmailToDriver(driver.email, data.order, data.trip)
                                                                                                            .then(() => {

                                                                                                                // send email to merchant
                                                                                                                return email_utils.sendEarningEmailToMerchant(merchant.email, data.order)
                                                                                                                    .then(() => {

                                                                                                                        return true;
                                                                                                                        // todo: finish
                                                                                                                    });
                                                                                                            });
                                                                                                    });
                                                                                            });
                                                                                    });
                                                                            })
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

                            }).catch(e => {

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
    // if this is a delivery trip
    else {

        let trip_id = data.trip_id;
        let customer_id = data.customer_id;
        let merchant_id = data.merchant_id;
        let driver_id = data.driver_id;
        let order = data.order;
        let merchant_transaction = data.merchant_transaction;
        let driver_transaction = data.driver_transaction;

        // update trip status
        return admin.firestore().collection("trips")
            .doc(trip_id).update("status", "PICKED_UP")
            .then(() => {

                // add transaction to merchant
                return admin.firestore().collection("merchants").doc(merchant_id)
                    .update("transactions", admin.firestore.FieldValue.arrayUnion(merchant_transaction))
                    .then(() => {

                        // add transaction to driver
                        return admin.firestore().collection("delivery_boys").doc(driver_id)
                            .update("transactions", admin.firestore.FieldValue.arrayUnion(driver_transaction))
                            .then(() => {

                                // get customer
                                return customer_utils.getCustomerById(customer_id)
                                    .then(customer => {

                                        // get merchant
                                        return merchant_utils.getMerchantById(merchant_id)
                                            .then(merchant => {

                                                // get driver
                                                return delivery_boy_utils.getById(driver_id)
                                                    .then(driver => {

                                                        // get trip
                                                        return trip_utils.getTrip(trip_id)
                                                            .then(trip => {

                                                                let data = {

                                                                    customer_fcm_token: customer.fcmToken,
                                                                    merchant_fcm_token: merchant.fcmToken,
                                                                    task: "PICKED_UP",
                                                                    trip_type,
                                                                    order: order,
                                                                    trip: trip,
                                                                    merchant_transaction: JSON.stringify(merchant_transaction),
                                                                }

                                                                // send fcm to customer
                                                                return fcm_utils.sendDeliveringMessageToCustomer
                                                                (data.customer_fcm_token, data.task,
                                                                    data.trip_type, data.order)
                                                                    .then(() => {

                                                                        // send fcm to merchant
                                                                        return fcm_utils.sendPickedUpMessageToMerchant
                                                                        (data.merchant_fcm_token, data.task, data.trip_type, data.order, data.merchant_transaction)
                                                                            .then(() => {

                                                                                // send email to driver
                                                                                return email_utils.sendEarningEmailToDriver(driver.email, data.order, data.trip)
                                                                                    .then(() => {

                                                                                        // send email to merchant
                                                                                        return email_utils.sendDeliveryFeeEmailToMerchant(merchant.email, data.order, data.trip)
                                                                                            .then(() => {

                                                                                                return true;
                                                                                                // todo: finish
                                                                                            });
                                                                                    });
                                                                            });
                                                                    });
                                                            })
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

            })
            .catch(e => {

                throw new functions.https.HttpsError("internal",
                    e.message);
            });
    }
}

utilsObject.confirmArrivalToDestination = function (data) {

    let trip_id = data.trip_id;
    let trip_type = data.trip_type.toString();
    let merchant_id = data.merchant_id;
    let customer_id = data.customer_id;
    let order = data.order;

    // change trip status
    return admin.firestore().collection("trips").doc(trip_id)
        .update("status", "ARRIVED_DESTINATION")
        .then(() => {

            // if this is a pickup order
            if (trip_type === "PICKUP") {

                // get merchant
                return merchant_utils.getMerchantById(merchant_id)
                    .then(merchant => {

                        let data = {

                            merchant_fcm_token: merchant.fcmToken,
                            task: "ARRIVED_DESTINATION",
                            trip_type,
                            order: order
                        }

                        // send fcm to merchant only
                        return fcm_utils.sendTripStatusChangedMessage
                        (data.merchant_fcm_token, data.task, data.trip_type, data.order)
                            .then(() => {

                                return true;
                                //todo: finish
                            })
                    });
            }

            // if this is a delivery trip
            else {
                // get customer
                return customer_utils.getCustomerById(customer_id)
                    .then(customer => {

                        let data = {

                            customer_fcm_token: customer.fcmToken,
                            task: "ARRIVED_DESTINATION",
                            trip_type,
                            order: order
                        }

                        // send fcm to customer only
                        return fcm_utils.sendTripStatusChangedMessage
                        (data.customer_fcm_token, data.task, data.trip_type, data.order)
                            .then(() => {

                                return true;
                                //todo: finish
                            })
                    });
            }
        })
        .catch(e => {

            throw new functions.https.HttpsError("internal",
                e.message);
        })
}

utilsObject.confirmDelivery = function (data) {

    let trip_id = data.trip_id;
    let trip_type = data.trip_type;
    let customer_id = data.customer_id;
    let merchant_id = data.merchant_id;
    let driver_id = data.driver_id;
    let trip_date_completed = data.trip_date_completed;
    let order = data.order;

    let order_status;

    if (trip_type === "PICKUP") {

        order_status = "COLLECTED"

    } else {

        order_status = "COMPLETED";
    }

    // change trip status
    return admin.firestore().collection("trips").doc(trip_id)
        .update({

            status: "COMPLETED",
            dateFinished: trip_date_completed

        })
        .then(() => {

            let data;

            if (order_status === "COMPLETED") {

                data = {
                    status: order_status,
                    dateCompleted: trip_date_completed
                }
            } else {

                data = {

                    status: order_status
                }
            }

            // change order status
            return admin.firestore().collection("orders").doc(order.id)
                .update(data)
                .then(() => {

                    order.status = order_status;

                    // get customer
                    return customer_utils.getCustomerById(customer_id)
                        .then(customer => {

                            // get merchant
                            return merchant_utils.getMerchantById(merchant_id)
                                .then(merchant => {

                                    // get driver
                                    return delivery_boy_utils.getById(driver_id)
                                        .then(driver => {

                                            if (trip_type === "PICKUP") {

                                                let data = {

                                                    customer_fcm_token: customer.fcmToken,
                                                    merchant_fcm_token: merchant.fcmToken,
                                                    task: "ORDER_COLLECTED",
                                                    order: order
                                                }

                                                // send fcm to customer
                                                return fcm_utils.sendOrderCollectedMessage
                                                (data.customer_fcm_token, data.task, data.order)
                                                    .then(() => {

                                                        // send fcm to merchant
                                                        return fcm_utils.sendOrderCollectedMessage
                                                        (data.merchant_fcm_token, data.task, data.order)
                                                            .then(() => {

                                                                // send email to customer
                                                                return email_utils.sendOrderCollectedEmailToCustomer
                                                                (customer.email, order)
                                                                    .then(() => {

                                                                        // send email to driver
                                                                        return email_utils.sendTripCompletedEmailToDriver
                                                                        (driver.email, trip_id)
                                                                            .then(() => {

                                                                                return true;
                                                                                //todo: finish

                                                                            });
                                                                    });
                                                            });
                                                    });
                                            }
                                            // if trip type is DELIVERY
                                            else {

                                                let data = {

                                                    customer_fcm_token: customer.fcmToken,
                                                    merchant_fcm_token: merchant.fcmToken,
                                                    task: "ORDER_COMPLETED",
                                                    order: order
                                                }

                                                // send fcm to customer
                                                return fcm_utils.sendOrderCollectedMessage
                                                (data.customer_fcm_token, data.task, data.order)
                                                    .then(() => {

                                                        // send fcm to merchant
                                                        return fcm_utils.sendOrderCollectedMessage
                                                        (data.merchant_fcm_token, data.task, data.order)
                                                            .then(() => {

                                                                // send email to customer
                                                                return email_utils.sendOrderCompletedEmailToCustomer
                                                                (customer.email, order)
                                                                    .then(() => {

                                                                        // send email to merchant
                                                                        return email_utils.sendOrderCompletedToMerchant
                                                                        (merchant.email, order)
                                                                            .then(() => {

                                                                                // send email to driver
                                                                                return email_utils.sendTripCompletedEmailToDriver
                                                                                (driver.email, trip_id)
                                                                                    .then(() => {

                                                                                        return true;
                                                                                        //todo: finish

                                                                                    });
                                                                            });
                                                                    });
                                                            });
                                                    });
                                            }
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
        })
}

module.exports = utilsObject;
let functions = require('firebase-functions'),
    admin = require("firebase-admin");

let utilsObject = {};

// get a single order
utilsObject.getOrder = function (order_id) {

    return admin.firestore().collection("orders").doc(order_id).get()
        .then(snapshot => {

            let order = snapshot.data();
            order.id = snapshot.id;

            return order;

        })
        .catch(e => {

            throw new functions.https.HttpsError("internal",
                e.message);
        });
}

// get all the orders associated with a user
utilsObject.getAllUserOrders = function (order_ids) {

    let orders = [];

    return Promise.all(order_ids.map(order_id => {

        return utilsObject.getOrder(order_id)
            .then(order => {

                orders.push(order)
                return true;

            })
            .catch(e => {

                throw new functions.https.HttpsError("internal",
                    e.message);
            });

    })).then(() => {

        return orders;

    }).catch(e => {

        throw new functions.https.HttpsError("internal",
            e.message);
    });
}

// set a order id to a user document
utilsObject.setOrderToUser = function (collection_name, user_id, order_id) {

    return admin.firestore().collection(collection_name).doc(user_id)
        .update("orders", admin.firestore.FieldValue.arrayUnion(order_id))
        .catch(e => {

            throw new functions.https.HttpsError("internal",
                e.message);
        });
}

// change order status to ie. ACCEPTED, DECLINED......
utilsObject.changeOrderStatus = function (order_id, order_status) {

    return admin.firestore().collection("orders").doc(order_id)
        .update("status", order_status)
        .catch(e => {

            throw new functions.https.HttpsError("internal",
                e.message);
        });
}

module.exports = utilsObject;
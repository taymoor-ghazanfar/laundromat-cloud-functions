let functions = require('firebase-functions'),
    admin = require("firebase-admin");

let utilsObject = {};

// get a single transaction
utilsObject.getTransaction = function (transaction_id) {

    return admin.firestore().collection("transactions").doc(transaction_id).get()
        .then(snapshot => {

            let transaction = snapshot.data();
            transaction.id = snapshot.id;

            return transaction;

        })
        .catch(e => {

            throw new functions.https.HttpsError("internal",
                e.message);
        });
}

// get all transactions associated with a user
utilsObject.getAllUserTransactions = function (transaction_ids) {

    let transactions = [];

    // get transaction(s) associated with the delivery boy
    return Promise.all(transaction_ids.map(transaction_id => {

        return utilsObject.getTransaction(transaction_id)
            .then(transaction => {

                transactions.push(transaction)
                return true;

            })
            .catch(e => {

                throw new functions.https.HttpsError("internal",
                    e.message);
            });

    })).then(() => {

        return transactions;

    }).catch(e => {

        throw new functions.https.HttpsError("internal",
            e.message);
    });
}

module.exports = utilsObject;
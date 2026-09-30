require("./merchant_utils");
let functions = require("firebase-functions"),
    admin = require("firebase-admin"),
    laundry_utils = require("./laundry_utils"),
    transaction_utils = require("./transaction_utils"),
    registration_utils = require("./registration_utils"),
    image_utils = require("./image_utils"),
    email_utils = require("./email_utils");

let utilsObject = {};

// check if merchant data provided by user already exist or not
utilsObject.verifyNewMerchantData = function (collection_name, merchant) {

    return registration_utils.checkDataExist(collection_name, merchant);
}

// get merchant by phone and password
utilsObject.getByPhonePassword = function (phone_number, password) {

    return admin.firestore().collection("merchants")
        .where("phoneNumber", "==", phone_number).get()
        .then(querySnapshot => {

            if (querySnapshot.empty) {

                throw new functions.https.HttpsError("not-found",
                    "No merchant found with provided phone number");
            }

            let merchant = querySnapshot.docs[0].data();
            merchant.id = querySnapshot.docs[0].id;

            if (password === merchant.password) {

                // get the laundry associated with the merchant
                let laundry_id = merchant.laundry;

                return laundry_utils.getLaundry("laundries", laundry_id)
                    .then(laundry => {

                        merchant.laundry = laundry;

                        return merchant;
                    });
            }

            throw new functions.https.HttpsError("invalid-argument",
                "Password is incorrect");

        })
        .catch(e => {

            throw new functions.https.HttpsError("internal",
                e.message);
        });
}

utilsObject.createNewMerchant = function (data) {

    let merchant = data.merchant;
    let laundry = data.laundry;

    merchant.id = admin.firestore().collection("new_merchants").doc().id;
    laundry.id = admin.firestore().collection("new_laundries").doc().id;

    // add the laundry id to the merchant laundry object
    merchant.laundry = laundry.id;

    // images to base64
    let merchantAvatar = new Buffer(merchant.avatarUrl, 'base64');
    let merchantNic = new Buffer(merchant.nicImageUrl, 'base64');
    let laundryLogo = new Buffer(laundry.logoUrl, 'base64');

    // upload merchant avatar image
    return image_utils.uploadImage(merchantAvatar, "merchants/avatars", `merchant_avatar_${merchant.id}`)
        .then((merchantAvatarDownloadUrl) => {

            merchant.avatarUrl = merchantAvatarDownloadUrl;

            // upload merchant nic image
            return image_utils.uploadImage(merchantNic, "merchants/nic_images", `merchant_nic_${merchant.id}`)
                .then((merchantNicDownloadUrl) => {

                    merchant.nicImageUrl = merchantNicDownloadUrl;

                    // upload laundry logo image
                    return image_utils.uploadImage(laundryLogo, "laundries/logos", `laundry_logo_${laundry.id}`)
                        .then((laundryLogoDownloadUrl) => {

                            laundry.logoUrl = laundryLogoDownloadUrl;

                            // push new laundry to NEW_LAUNDRIES collection
                            laundry_utils.createNewLaundry(laundry)
                                .then(() => {

                                    // push new merchant to NEW_MERCHANTS collection
                                    return admin.firestore().collection("new_merchants")
                                        .doc(merchant.id).set(merchant)
                                        .then(function () {

                                            // get admin
                                            return admin.firestore().collection("admin")
                                                .doc("KyRA3BJvvle7QmLX8DrD")
                                                .get()
                                                .then(doc => {

                                                    let admin_data = doc.data();

                                                    let admin_email = admin_data.email;

                                                    // sending confirmation email to merchant
                                                    return email_utils
                                                        .sendMerchantRegistrationRequestReceived
                                                        (merchant.email, merchant.fullName, laundry.name)
                                                        .then(() => {

                                                            // send email to admin
                                                            return email_utils
                                                                .sendMerchantRequestReceived
                                                                (admin_email, merchant.fullName, laundry.name);
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
                        });
                });
        });
}

// get a merchant by his laundry id
utilsObject.getMerchantByLaundryId = function (laundry_id) {

    return admin.firestore().collection("merchants")
        .where("laundry", "==", laundry_id)
        .get()
        .then(snapshot => {

            if (snapshot.empty) {

                throw new functions.https.HttpsError("not-found",
                    "No merchant found");
            }

            let merchant = snapshot.docs[0].data();

            // get laundry of the merchant
            return laundry_utils.getLaundry("laundries", laundry_id)
                .then(laundry => {

                    merchant.laundry = laundry;

                    return merchant;
                });

        }).catch(e => {

            throw new functions.https.HttpsError("internal",
                e.message);
        });
}

utilsObject.getMerchantById = function (merchant_id) {

    return admin.firestore().collection("merchants")
        .doc(merchant_id)
        .get()
        .then(doc => {

            let merchant = doc.data();
            let laundry_id = merchant.laundry;

            // get laundry of the merchant
            return laundry_utils.getLaundry("laundries", laundry_id)
                .then(laundry => {

                    merchant.laundry = laundry;

                    return merchant;
                });

        }).catch(e => {

            throw new functions.https.HttpsError("internal",
                e.message);
        });
}

utilsObject.updateMerchant = function (merchant_id, full_name,
                                       email, jazz_cash, avatar_updated,
                                       avatar_64, location_updated, location) {

    if (avatar_updated) {

        let merchantAvatar = new Buffer(avatar_64, 'base64');

        return image_utils.uploadImage(merchantAvatar, "merchants/avatars", `merchant_avatar_${merchant_id}`)
            .then((merchantAvatarDownloadUrl) => {

                let data = {

                    avatarUrl: merchantAvatarDownloadUrl,
                    fullName: full_name,
                    email: email,
                    jazzCashNumber: jazz_cash,
                }

                if (location_updated) {

                    data.location = location;
                }

                return admin.firestore().collection("merchants").doc(merchant_id)
                    .update(data)
                    .then(() => {

                        return merchantAvatarDownloadUrl;

                    })
                    .catch(e => {

                        throw new functions.https.HttpsError("internal",
                            e.message);
                    });
            });
    } else {

        let data = {

            fullName: full_name,
            email: email,
            jazzCashNumber: jazz_cash,
        }

        if (location_updated) {

            data.location = location;
        }

        return admin.firestore().collection("merchants").doc(merchant_id)
            .update(data)
            .then(() => {

                return "updated";

            })
            .catch(e => {

                throw new functions.https.HttpsError("internal",
                    e.message);
            });
    }
}


module.exports = utilsObject;
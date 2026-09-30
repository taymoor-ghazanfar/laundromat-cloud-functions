let functions = require('firebase-functions'),
    admin = require("firebase-admin"),
    order_utils = require("../utils/order_utils"),
    image_utils = require("../utils/image_utils"),
    location_utils = require("../utils/location_utils");


let utilsObject = {};

// get a single laundry (new or existing)
utilsObject.getLaundry = function (collection_id, laundry_id) {

    return admin.firestore().collection(collection_id).doc(laundry_id).get()
        .then(snapshot => {

            let laundry = snapshot.data();
            laundry.id = snapshot.id;

            // get all orders associated with the laundry
            return order_utils.getAllUserOrders(laundry.orders)
                .then(orders => {

                    laundry.orders = orders;
                    return laundry;
                });

        })
        .catch(e => {

            throw new functions.https.HttpsError("unknown",
                e.message);
        });
}

// create new laundry request
utilsObject.createNewLaundry = function (laundry) {

    return admin.firestore().collection("new_laundries")
        .doc(laundry.id).set(laundry)
        .catch(e => {

            throw new functions.https.HttpsError("internal",
                e.message);
        });
}

utilsObject.checkMenuCategoryExist = function (laundry_id, category_title) {

    return admin.firestore()
        .collection("laundries")
        .doc(laundry_id)
        .get()
        .then(doc => {

            let laundry = doc.data();

            for (let menuCategory of laundry.menu) {

                if (menuCategory.title === category_title) {

                    throw new functions.https.HttpsError("already-exists",
                        "Menu category already exist");
                }
            }

            return false;

        })
        .catch(e => {

            throw new functions.https.HttpsError("internal",
                e.message);
        });
}

// add new menu category to a laundry
utilsObject.addMenuCategory = function (laundry_id, category) {

    const FieldValue = admin.firestore.FieldValue;

    return admin.firestore()
        .collection("laundries")
        .doc(laundry_id)
        .update("menu", FieldValue.arrayUnion(category))
        .catch(e => {

            throw new functions.https.HttpsError("internal",
                e.message);
        });
}

// update menu category to a laundry
utilsObject.updateMenuCategory = function (laundry_id, category, category_index) {

    return admin.firestore()
        .runTransaction(transaction => {

            return transaction
                .get(admin.firestore().collection("laundries").doc(laundry_id))
                .then(doc => {

                    let laundry = doc.data();
                    let menu = laundry.menu;

                    menu[category_index] = category;

                    return transaction
                        .update(admin.firestore().collection("laundries").doc(laundry_id), {menu: menu});

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

// delete menu category of a laundry
utilsObject.deleteMenuCategory = function (laundry_id, index) {

    return admin.firestore()
        .runTransaction(transaction => {

            return transaction
                .get(admin.firestore().collection("laundries").doc(laundry_id))
                .then(doc => {

                    let laundry = doc.data();
                    let menu = laundry.menu;

                    menu.splice(index, 1);

                    return transaction
                        .update(admin.firestore().collection("laundries").doc(laundry_id), {menu: menu});

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

// add new menu item to a laundry
utilsObject.addMenuItem = function (laundry_id, category, menu_item) {

    // upload the menu item image
    return image_utils
        .uploadImage(menu_item.imageUrl, `menu_items/laundry_${laundry_id}`, `${menu_item.name}_${laundry_id}`)
        .then(download_url => {

            // set the image download url to the menu item
            menu_item.imageUrl = download_url;

            return admin.firestore().collection("laundries").doc(laundry_id).get()
                .then(doc => {

                    let laundry = doc.data();
                    let menu = laundry.menu;

                    for (let x = 0; x < menu.length; x++) {

                        if (menu[x].title === category.title) {

                            // add the menu item to laundry menu
                            menu[x].washableItems.push(menu_item);
                            break;
                        }
                    }

                    return admin.firestore().collection("laundries").doc(laundry_id)
                        .update({menu: menu})
                        .then(() => {

                            return download_url;

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
}

// update menu item of a laundry
utilsObject.updateMenuItem = function (laundry_id, category, menu_item, menu_item_index, image_updated) {

    // if image was updated
    if (image_updated) {

        // upload the menu item image
        return image_utils
            .uploadImage(menu_item.imageUrl, `menu_items/laundry_${laundry_id}`, `${menu_item.name}_${laundry_id}`)
            .then(download_url => {

                return utilsObject.setMenuItem(laundry_id, category, menu_item, menu_item_index, download_url);
            });

    } else {

        return utilsObject.setMenuItem(laundry_id, category, menu_item, menu_item_index, null);
    }
}

// update menu item (internal)
utilsObject.setMenuItem = function (laundry_id, category, menu_item, menu_item_index, image_url) {

    if (image_url != null) {

        // set the image download url to the menu item
        menu_item.imageUrl = image_url;
    }

    return admin.firestore().collection("laundries").doc(laundry_id).get()
        .then(doc => {

            let laundry = doc.data();
            let menu = laundry.menu;

            for (let x = 0; x < menu.length; x++) {

                if (menu[x].title === category.title) {

                    menu[x].washableItems[menu_item_index] = menu_item;
                    break;
                }
            }

            return admin.firestore().collection("laundries").doc(laundry_id)
                .update({menu: menu})
                .then(() => {

                    return image_url == null ? "updated" : image_url;

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

// delete menu item of a laundry
utilsObject.deleteMenuItem = function (laundry_id, category, menu_item_index) {

    return admin.firestore().collection("laundries").doc(laundry_id).get()
        .then(doc => {

            let laundry = doc.data();
            let menu = laundry.menu;
            let menu_item_name;

            for (let x = 0; x < menu.length; x++) {

                if (menu[x].title === category.title) {

                    menu_item_name = menu[x].washableItems[menu_item_index].name;
                    menu[x].washableItems.splice(menu_item_index, 1);
                    break;
                }
            }

            let file_name = `${menu_item_name}_${laundry_id}.jpg`;
            let file_path = `menu_items/laundry_${laundry_id}/${file_name}`;
            let bucket = admin.storage().bucket("laundromat-317518.appspot.com");
            let file = bucket.file(file_path);

            // delete the menu item photo from storage
            return file.delete()
                .then(() => {

                    return admin.firestore().collection("laundries").doc(laundry_id)
                        .update({menu: menu})
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

// get laundries nearby to customer location
utilsObject.getNearbyLaundries = function (latitude, longitude) {

    return admin.firestore().collection("admin")
        .doc("KyRA3BJvvle7QmLX8DrD")
        .get()
        .then(doc => {

            let data = doc.data();

            let delivery_radius = data["deliveryRadius"];

            return admin.firestore()
                .collection("laundries")
                .where("isActive", "==", true)
                .get()
                .then((snapshot) => {

                    // if there are no laundries
                    if (snapshot.empty) {

                        return null;
                    }

                    let laundries = [];

                    return Promise.all(snapshot.docs.map(doc => {

                        let laundry = doc.data();
                        laundry.id = doc.id;

                        if (laundry.menu.length === 0) {

                            return true;
                        }

                        let customerLocation = `${latitude},${longitude}`;
                        let laundryLocation = `${laundry.location.latitude},${laundry.location.longitude}`

                        // check distance b/w laundry and customer (should be <= specified by admin)
                        return location_utils.getDistance([customerLocation], [laundryLocation])
                            .then(result => {

                                // parsing distance string i.e. 123 KM
                                let distance = result[0].distance;
                                distance = distance.slice(0, -3);

                                // converting distance string to float
                                distance = parseFloat(distance);
                                console.log("distance to " + laundry.name + " is: " + distance)

                                // if distance is less than or equal to 5 kilometres, add the laundry
                                if (distance <= delivery_radius) {

                                    console.log("distance is : " + distance + " which is < 5. adding laundry: " + laundry.name);
                                    laundries.push(laundry);
                                    return true;
                                }
                            })
                            .catch(e => {

                                throw new functions.https.HttpsError("internal",
                                    e.message);
                            });

                    })).then(() => {

                        // get orders associated with laundries
                        return Promise.all(laundries.map(laundry => {

                            return order_utils.getAllUserOrders(laundry.orders)
                                .then(orders => {

                                    laundry.orders = orders;
                                    return true;
                                });

                        })).then(() => {

                            console.log("total nearby laundries: " + laundries.length);
                            return laundries;
                        });
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
}

// get laundry by id
utilsObject.getLaundryById = function (laundry_id) {

    return utilsObject.getLaundry("laundries", laundry_id);
}

utilsObject.updateLaundry = function (laundry_id, image_updated, image_64, opening_time, closing_time, discount) {

    if (image_updated) {

        let storeLogo = new Buffer(image_64, 'base64');
        return image_utils.uploadImage(storeLogo, "laundries/logos", `laundry_logo_${laundry_id}`)
            .then(downloadUrl => {

                return admin.firestore().collection("laundries").doc(laundry_id)
                    .update({

                        logoUrl: downloadUrl,
                        "timings.closingTime": closing_time,
                        "timings.openingTime": opening_time,
                        "discount": discount

                    })
                    .then(() => {

                        return downloadUrl;

                    })
                    .catch(e => {

                        throw new functions.https.HttpsError("internal",
                            e.message);
                    });
            });

    } else {

        return admin.firestore().collection("laundries").doc(laundry_id)
            .update({

                "timings.closingTime": closing_time,
                "timings.openingTime": opening_time,
                "discount": discount

            })
            .then(() => {

                return "updated";

            })
            .catch(e => {

                throw new functions.https.HttpsError("internal",
                    e.message);
            });
    }
}

utilsObject.setAvailability = function (laundry_id, status) {

    return admin.firestore().collection("laundries")
        .doc(laundry_id)
        .update("isActive", status)
        .catch(e => {

            throw new functions.https.HttpsError("internal",
                e.message);
        });
}

module.exports = utilsObject;
let functions = require("firebase-functions"),
    laundry_utils = require("../utils/laundry_utils");

// check if menu category already exist
exports.checkMenuCategoryExist = functions.https.onCall((data, context) => {

    let laundry_id = data.laundry_id;
    let category_title = data.category_title;

    return laundry_utils.checkMenuCategoryExist(laundry_id, category_title);
});

// add a new menu category to a laundry
exports.addMenuCategory = functions.https.onCall((data, context) => {

    let laundry_id = data.laundry_id;
    let category = data.category;

    return laundry_utils.addMenuCategory(laundry_id, category);
});

// update menu category of a laundry
exports.updateMenuCategory = functions.https.onCall((data, context) => {

    let laundry_id = data.laundry_id;
    let category = data.category;
    let category_index = data.category_index;

    return laundry_utils.updateMenuCategory(laundry_id, category, category_index);
});

// delete menu category of a laundry
exports.deleteMenuCategory = functions.https.onCall((data, context) => {

    let laundry_id = data.laundry_id;
    let index = data.index;

    return laundry_utils.deleteMenuCategory(laundry_id, index);
});

// add a new menu item to a laundry
exports.addMenuItem = functions.https.onCall((data, context) => {

    let laundry_id = data.laundry_id;
    let category = data.category;
    let menu_item = data.menu_item;

    return laundry_utils.addMenuItem(laundry_id, category, menu_item);
});

// update a menu item of a laundry
exports.updateMenuItem = functions.https.onCall((data, context) => {

    let laundry_id = data.laundry_id;
    let category = data.category;
    let menu_item = data.menu_item;
    let menu_item_index = data.menu_item_index;
    let image_updated = data.imaged_updated;

    return laundry_utils.updateMenuItem(laundry_id, category, menu_item, menu_item_index, image_updated);
});


// delete a menu item of a laundry
exports.deleteMenuItem = functions.https.onCall((data, context) => {

    let laundry_id = data.laundry_id;
    let category = data.category;
    let menu_item_index = data.menu_item_index;

    return laundry_utils.deleteMenuItem(laundry_id, category, menu_item_index);
});

// get laundries nearby to customer location
exports.getNearbyLaundries = functions.https.onCall((data, context) => {

    let latitude = data.latitude;
    let longitude = data.longitude;

    return laundry_utils.getNearbyLaundries(latitude, longitude);
});

exports.updateLaundry = functions.https.onCall((data, context) => {

    let laundry_id = data.laundry_id;
    let image_updated = data.image_updated;
    let image_64 = data.image_64;
    let opening_time = data.opening_time;
    let closing_time = data.closing_time;
    let discount = data.discount;

    return laundry_utils.updateLaundry(laundry_id, image_updated, image_64, opening_time, closing_time, discount);
});

exports.setAvailability = functions.https.onCall((data, context) => {

    let laundry_id = data.laundry_id;
    let status = data.status;

    return laundry_utils.setAvailability(laundry_id, status);
});

exports.getLaundryById = functions.https.onCall((id, context) => {

    return laundry_utils.getLaundryById(id);
});
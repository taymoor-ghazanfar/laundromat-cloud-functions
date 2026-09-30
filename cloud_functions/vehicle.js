let functions = require("firebase-functions"),
    vehicle_utils = require("../utils/vehicle_utils");

// function to verify new registration request data for vehicle
exports.verifyNewVehicleData = functions.https.onCall((vehicle, context) => {

    let collection_name = "vehicles";

    // check in VEHICLES collection
    return vehicle_utils.verifyNewVehicleData(collection_name, vehicle)
        .then(function () {

            collection_name = "new_vehicles";

            // check in NEW_VEHICLES collection
            return vehicle_utils.verifyNewVehicleData(collection_name, vehicle);
        });
});

exports.verifyPlateNumber = functions.https.onCall((data, context) => {

    let plate_number = data.plate_number;

    let collection_name = "vehicles";

    // check in VEHICLES collection
    return vehicle_utils.verifyPlateNumber(collection_name, plate_number)
        .then(function () {

            collection_name = "new_vehicles";

            // check in NEW_VEHICLES collection
            return vehicle_utils.verifyPlateNumber(collection_name, plate_number);
        });
});

exports.updateDetails = functions.https.onCall((data, context) => {

    return vehicle_utils.updateDetails(data);
});

exports.updateImages = functions.https.onCall((data, context) => {

    return vehicle_utils.updateImages(data);
});
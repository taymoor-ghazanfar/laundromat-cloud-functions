let functions = require('firebase-functions'),
    admin = require("firebase-admin"),
    registration_utils = require("./registration_utils"),
    image_utils = require("./image_utils");

let utilsObject = {};

// check if vehicle data provided by user already exist or not
utilsObject.verifyNewVehicleData = function (collection_name, vehicle) {

    return registration_utils.checkVehicleDataExist(collection_name, vehicle);
}

// get vehicle associated with delivery boy (old and new)
utilsObject.getVehicle = function (collection_name, vehicle_id) {

    return admin.firestore().collection(collection_name).doc(vehicle_id).get()
        .then(snapshot => {

            let vehicle = snapshot.data();
            vehicle.id = snapshot.id;

            return vehicle;

        })
        .catch(e => {

            console.log("error on vehicle");
            throw new functions.https.HttpsError("internal",
                e.message);
        });
}

utilsObject.verifyPlateNumber = function (collection_name, plate_number) {

    return admin.firestore().collection(collection_name)
        .where("plateNumber", "==", plate_number)
        .get()
        .then(snapshot => {

            if (collection_name === "vehicles") {

                if (snapshot.size > 2) {

                    throw new functions.https.HttpsError("already-exists",
                        "Vehicle with provided plate number already exist");
                }

                return true;

            } else {

                if (snapshot.size > 1) {

                    throw new functions.https.HttpsError("already-exists",
                        "Vehicle with provided plate number already exist");
                }

                return true;
            }

        })
        .catch(e => {

            throw new functions.https.HttpsError("internal",
                e.message);
        })
}

utilsObject.updateDetails = function (data) {

    let vehicle_id = data.vehicle_id;
    let plateNumber = data.plate_number;
    let name = data.name;
    let model = data.model;
    let color = data.color;

    return admin.firestore().collection("vehicles")
        .doc(vehicle_id)
        .update({

            plateNumber,
            name,
            model,
            color

        })
        .catch(e => {

            throw new functions.https.HttpsError("internal",
                e.message);
        })
}

utilsObject.updateImages = function (data) {

    let vehicle_id = data.vehicle_id;
    let plate_number = data.plate_number;

    let vehicleFront = new Buffer(data["front"], 'base64');
    let vehicleBack = new Buffer(data["back"], 'base64');
    let vehicleLeft = new Buffer(data["left"], 'base64');
    let vehicleRight = new Buffer(data["right"], 'base64');

    // create batch images data for vehicle
    let vehicle_images = [
        {
            base64: vehicleFront,
            folder: `vehicles/vehicle_${plate_number}`,
            filename: `${plate_number}_front`
        },
        {
            base64: vehicleBack,
            folder: `vehicles/vehicle_${plate_number}`,
            filename: `${plate_number}_back`
        },
        {
            base64: vehicleLeft,
            folder: `vehicles/vehicle_${plate_number}`,
            filename: `${plate_number}_left`
        },
        {
            base64: vehicleRight,
            folder: `vehicles/vehicle_${plate_number}`,
            filename: `${plate_number}_right`
        }
    ];

    return image_utils.batchUploadImages(vehicle_images)
        .then(download_urls => {

            return admin.firestore().collection("vehicles")
                .doc(vehicle_id)
                .update({

                    "images.front": download_urls[0],
                    "images.back": download_urls[1],
                    "images.left": download_urls[2],
                    "images.right": download_urls[3]

                })
                .then(() => {

                    return `${download_urls[0]}*${download_urls[1]}*${download_urls[2]}*${download_urls[3]}`;

                })
                .catch(e => {

                    throw new functions.https.HttpsError("internal",
                        e.message);
                });
        });
}

module.exports = utilsObject;
let functions = require('firebase-functions');

let utilsObject = {};

// utilsObject.getDistance = function (location1, location2) {
//
//     let distance = require('google-distance-matrix');
//     distance.key("GOOGLE_MAPS_API_KEY");
//     distance.units("metric");
//     distance.mode("driving");
//
//     let origins = [location1];
//     let destinations = [location2];
//
//     distance.matrix(origins, destinations, function (e, distances) {
//         if (e) {
//
//             throw new functions.https.HttpsError("internal",
//                 e.message);
//         }
//         if (!distances) {
//
//             throw new functions.https.HttpsError("internal",
//                 "failed to get distance");
//         }
//         if (distances.status === 'OK') {
//
//             if (distances.rows[0].elements[0].status === 'OK') {
//
//                 let distance = distances.rows[0].elements[0].distance.text;
//                 console.log(distance);
//                 return distance;
//
//             } else {
//
//                 throw new functions.https.HttpsError("internal",
//                     "failed to get distance");
//             }
//         }
//     });
// }

//////////////////////////////////////////////////////

utilsObject.getDistanceBetweenTwoLocations = function (location1, location2) {

    let distance = require('google-distance-matrix');
    distance.key("GOOGLE_MAPS_API_KEY");
    distance.units("metric");
    distance.mode("driving");

    let origins = [location1];
    let destinations = [location2];

    return new Promise((resolve, reject) => {

        distance.matrix(origins, destinations, (e, distances) => {

                if (e) {

                    reject(new Error('Not OK'));

                } else {

                    if (distances.status === 'OK') {
                        resolve({distance: distances.rows[0].elements[0].distance.text});

                    } else {

                        reject(new Error('Not OK'));
                    }
                }
            }
        );
    });
}

utilsObject.getDistance = function (origins, destinations) {

    const promisedDistances = origins.map((origin) => utilsObject.getDistanceBetweenTwoLocations(origin, destinations));

    return Promise.all(promisedDistances);
}

module.exports = utilsObject;
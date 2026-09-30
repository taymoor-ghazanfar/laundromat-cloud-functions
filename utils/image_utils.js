let functions = require('firebase-functions'),
    admin = require("firebase-admin");

let utilsObject = {};

// upload an image to firebase storage and get download url
utilsObject.uploadImage = function (base64Data, folder, filename) {

    // Convert the base64 string back to an image to upload into the Google Cloud Storage bucket
    let mimeType = 'image/jpeg',
        fileName = `${filename}.jpg`,
        imageBuffer = new Buffer(base64Data, 'base64');

    let bucket = admin.storage().bucket("laundromat-317518.appspot.com");

    // Upload the image to the bucket
    let file = bucket.file(`${folder}/` + fileName);

    return file.save(imageBuffer, {

        metadata: {contentType: mimeType},

    }).then(() => {

        folder = folder.replace("/", "%2F");
        return `https://firebasestorage.googleapis.com/v0/b/laundromat-317518.appspot.com/o/${folder}%2F${fileName}?alt=media`

    }).catch((e) => {

        throw new functions.https.HttpsError("invalid-argument",
            e.message);
    })
}

// batch upload images to firebase storage and get download urls
utilsObject.batchUploadImages = function (data) {

    let download_urls = [];

    // upload each image into specified location and get download urls
    return Promise.all(data.map(image_data => {

        let base64Data = image_data.base64;
        let folder = image_data.folder;
        let filename = image_data.filename;

        return utilsObject.uploadImage(base64Data, folder, filename)
            .then(download_url => {

                download_urls.push(download_url);
                return true;
            });

    })).then(() => {

        return download_urls;
    });
}

module.exports = utilsObject;
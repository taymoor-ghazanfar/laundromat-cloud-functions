let nodeMailer = require("nodemailer"),
    functions = require('firebase-functions'),
    admin = require("firebase-admin");

let utilsObject = {};

const topics = ['REGISTRATION_REQUESTED', 'REGISTRATION_CONFIRMED', 'ORDER_REQUEST', 'ORDER_DECLINED', 'ORDER_CANCELLED', 'PAYMENT'];

const senderEmail = functions.config().email_service.email;
const senderPassword = functions.config().email_service.password;

utilsObject.sendMerchantRequestReceived = function (adminEmailAddress, merchantName, laundryName) {

    let subject = "Merchant registration request received";
    let text =
        "You have a new merchant registration request from " + merchantName + ".\n" +
        "Laundry name is '" + laundryName + "'.\n\n" +
        "You can login to the admin portal and review the received registration request\n"

    return utilsObject.sendEmail(adminEmailAddress, subject, text, topics[0])
        .catch(e => {

            throw new functions.https.HttpsError("internal",
                e.message);
        });
}

utilsObject.sendDeliveryBoyRequestReceived = function (adminEmailAddress, deliveryBoyName, plateNumber) {

    let subject = "Delivery boy registration request received";
    let text =
        "You have a new delivery boy registration request from " + deliveryBoyName + ".\n" +
        "Vehicle plate number is '" + plateNumber + "'.\n\n" +
        "You can login to the admin portal and review the received registration request\n"

    return utilsObject.sendEmail(adminEmailAddress, subject, text, topics[0])
        .catch(e => {

            throw new functions.https.HttpsError("internal",
                e.message);
        });
}

// send a registration request received email to merchant
utilsObject.sendMerchantRegistrationRequestReceived = function (merchantEmailAddress, merchantName, laundryName) {

    let subject = "Merchant registration request received";
    let text =
        "Dear " + merchantName + ",\n" +
        "Your request to register your self on Laundromat as a merchant is received.\n" +
        "Your laundry name is '" + laundryName + "'.\n" +
        "We will notify you about your registration status once we finished reviewing your request.\n" +
        "Thanks\n"


    return utilsObject.sendEmail(merchantEmailAddress, subject, text, topics[0])
        .catch(e => {

            throw new functions.https.HttpsError("internal",
                e.message);
        });
}

// send a registration confirmation email to merchant
utilsObject.sendMerchantRegistrationConfirmation = function (merchantEmailAddress, merchantName, laundryName) {

    let subject = "Merchant registration accepted";
    let text =
        "Dear " + merchantName + ",\n" +
        "Your request to register your self on Laundromat as a merchant is accepted.\n" +
        "Your laundry name is '" + laundryName + "'.\n" +
        "Now you can start using our service by logging in with your provided phone number and password.\n" +
        "Thanks for choosing Laundromat. Make your business shine just like your clothes!\n"

    return utilsObject.sendEmail(merchantEmailAddress, subject, text, topics[1])
        .catch(e => {

            throw new functions.https.HttpsError("internal",
                e.message);
        });
}

utilsObject.sendMerchantRequestDeclineEmail = function (merchantEmailAddress, merchantName) {

    let subject = "Merchant registration declined";
    let text =
        "Dear " + merchantName + ",\n" +
        "Your request to register your self on Laundromat was declined.\n" +
        "Make sure to provide correct and accurate information in future to get accepted."

    return utilsObject.sendEmail(merchantEmailAddress, subject, text, topics[1])
        .catch(e => {

            throw new functions.https.HttpsError("internal",
                e.message);
        });
}
utilsObject.sendDeliveryBoyRegistrationRequestReceived =
    function (delivery_boy_email_address, delivery_boy_name, vehicle_plate_number) {

        let subject = "Delivery boy registration request received";
        let text =
            "Dear " + delivery_boy_name + ",\n" +
            "Your request to register your self on Laundromat as a delivery boy is received.\n" +
            "Your vehicle's plate number is '" + vehicle_plate_number + "'.\n" +
            "We will notify you about your registration status once we finish reviewing your request.\n" +
            "Thanks\n"


        return utilsObject.sendEmail(delivery_boy_email_address, subject, text, topics[0])
            .catch(e => {

                throw new functions.https.HttpsError("internal",
                    e.message);
            });
    }

utilsObject.sendDeliveryBoyRegistrationConfirmation = function (deliveryBoyEmailAddress, deliveryBoyName, plateNumber) {

    let subject = "Delivery boy registration accepted";
    let text =
        "Dear " + deliveryBoyName + ",\n" +
        "Your request to register your self on Laundromat as a delivery boy is accepted.\n" +
        "Your vehicle's plate number is '" + plateNumber + "'.\n" +
        "Now you can start using our service by logging in with your provided phone number and password.\n" +
        "Thanks for choosing Laundromat. Make your business shine just like your clothes!\n"

    return utilsObject.sendEmail(deliveryBoyEmailAddress, subject, text, topics[1])
        .catch(e => {

            throw new functions.https.HttpsError("internal",
                e.message);
        });
}

utilsObject.sendDeliveryBoyDeclineEmail = function (deliveryBoyEmailAddress, deliveryBoyName) {

    let subject = "Delivery boy registration declined";
    let text =
        "Dear " + deliveryBoyName + ",\n" +
        "Your request to register your self on Laundromat was declined.\n" +
        "Make sure to provide correct and accurate information in future to get accepted."

    return utilsObject.sendEmail(deliveryBoyEmailAddress, subject, text, topics[1])
        .catch(e => {

            throw new functions.https.HttpsError("internal",
                e.message);
        });
}

utilsObject.sendCustomerRegistrationConfirmation = function (customerEmailAddress, customerName) {

    let subject = "Customer registration completed";
    let text =
        "Dear " + customerName + ",\n" +
        "You have successfully signed up on Laundromat.\n" +
        "Now you can start booking laundry services from your phone hassle free.\n" +
        "Thanks for choosing Laundromat. Save your time, Let the clothes shine!\n"

    return utilsObject.sendEmail(customerEmailAddress, subject, text, topics[1])
        .catch(e => {

            throw new functions.https.HttpsError("internal",
                e.message);
        });
}

utilsObject.sendOrderRequestToMerchant = function (merchantEmailAddress, data) {

    let order = data.order;

    let subject = "You have received a new order request";
    let text =
        "You have received a new order request in '" + order.laundryName + "'\n\n" +
        "Order ID:          " + order.id.slice(-10) + "\n" +
        "Items quantity:    " + order.itemsQuantity + "\n" +
        "Payment method:    " + order.paymentMethod + "\n" +
        "Total price:       PKR " + order.price + "\n\n" +
        "Login to the merchant app now to get more info about the order.\n" +
        "\u00A9 Laundromat"

    return utilsObject.sendEmail(merchantEmailAddress, subject, text, topics[2])
        .catch(e => {

            throw new functions.https.HttpsError("internal",
                e.message);
        });
}

utilsObject.sendOrderRequestToCustomer = function (customerEmailAddress, data) {

    let order = data.order;

    let subject = "You order request has been sent";
    let text =
        "Your order request has been sent to'" + order.laundryName + "'\n\n" +
        "Order ID: " + order.id.slice(-10) + "\n" +
        "Items quantity: " + order.itemsQuantity + "\n" +
        "Payment method: " + order.paymentMethod + "\n" +
        "Total price: PKR " + order.price + "\n\n" +
        "We will notify you once the laundry updates the status of your order.\n" +
        "\u00A9 Laundromat"

    return utilsObject.sendEmail(customerEmailAddress, subject, text, topics[2])
        .catch(e => {

            throw new functions.https.HttpsError("internal",
                e.message);
        });
}

utilsObject.sendOrderDeclinedEmail = function (data) {

    let emailAddress = data.customer_email;
    let order = data.order;

    let subject = "Your order request has been declined by '" + order.laundryName + "'";
    let text =
        "Your order request for the following order was declined by '" + order.laundryName + "'\n\n" +
        "Order ID: " + order.id.slice(-10) + "\n" +
        "Date requested: " + order.dateCreated + "\n" +
        "Order status: " + order.status + "\n\n" +
        "Don't worry, You can request for the order to another laundry serving in your area at any time.\n" +
        "\u00A9 Laundromat"

    return utilsObject.sendEmail(emailAddress, subject, text, topics[3])
        .catch(e => {

            throw new functions.https.HttpsError("internal",
                e.message);
        });
}

utilsObject.sendOrderAcceptedEmail = function (data) {

    let order = data.order;

    let emailAddress = data.customer_email;
    let laundry_name = order.laundryName;
    let order_id = order.id;
    let order_date = order.dateCreated;
    let order_status = order.status;
    let payment_method = order.paymentMethod;

    let payment_message = "";

    if (payment_method === "CASH") {

        payment_message = "You will pay by cash the order amount + pickup fee to the delivery boy once they arrive " +
            "to pickup your order items";
    } else if (payment_method === "JAZZ_CASH") {

        payment_message = "The order amount + pickup fee will be debited from your Jazz Cash account once the delivery boy " +
            "arrive to pickup your order items";
    }

    let subject = "Your order request has been accepted by '" + laundry_name + "'";
    let text =
        "Your order request for the following order has been accepted by '" + laundry_name + "'\n\n" +
        "Order ID: " + order_id.slice(-10) + "\n" +
        "Date requested: " + order_date + "\n" +
        "Order status: " + order_status + "\n\n" +
        "Your order items will be picked up once the laundry arrange a delivery boy for your location.\n" +
        payment_message + "\n" +
        "You can only cancel your order till your order items has been picked up by the delivery boy\n" +
        "You will be notified about the order status throughout by the laundry\n\n" +
        "Thanks." +
        "\u00A9 Laundromat"

    return utilsObject.sendEmail(emailAddress, subject, text, topics[3])
        .catch(e => {

            throw new functions.https.HttpsError("internal",
                e.message);
        });
}

// send order cancelled to the merchant
utilsObject.sendOrderCancelToMerchant = utilsObject.sendOrderDeclinedEmail = function (data) {

    let emailAddress = data.merchant_email;
    let order = data.order;
    let laundry_name = order.laundryName;
    let order_date = order.dateCreated;
    let order_status = order.status;

    let subject = "Order cancelled";
    let text =
        "Your order in the '" + laundry_name + "' is cancelled\n\n" +
        "Order ID: " + order.id.slice(-10) + "\n" +
        "Date created: " + order_date + "\n" +
        "Order status: " + order_status + "\n\n" +
        "Serve in the best possible way to avoid cancellations in the future.\n" +
        "\u00A9 Laundromat"

    return utilsObject.sendEmail(emailAddress, subject, text, topics[4])
        .catch(e => {

            throw new functions.https.HttpsError("internal",
                e.message);
        });
}

// send order cancelled to the customer
utilsObject.sendOrderCancelToCustomer = utilsObject.sendOrderDeclinedEmail = function (data) {

    let emailAddress = data.customer_email;
    let order = data.order;
    let laundry_name = order.laundryName;
    let order_date = order.dateCreated;
    let order_status = order.status;

    let subject = "Order cancelled";
    let text =
        "Your order in the '" + laundry_name + "' is cancelled\n\n" +
        "Order ID: " + order.id.slice(-10) + "\n" +
        "Date created: " + order_date + "\n" +
        "Order status: " + order_status + "\n\n" +
        "We hope to provide you a better experience next time.\n" +
        "\u00A9 Laundromat"

    return utilsObject.sendEmail(emailAddress, subject, text, topics[4])
        .catch(e => {

            throw new functions.https.HttpsError("internal",
                e.message);
        });
}

utilsObject.sendPickupEmailToCustomer = function (data) {

    let order = data.order;

    let emailAddress = data.customer_email;
    let trip = data.trip;
    let laundry_name = trip.order.laundryName;

    let subject;
    let trip_type;
    let order_status;

    if (order.status === "ACCEPTED") {

        subject = "Order has been requested for pickup";
        trip_type = "pickup";
        order_status = "PICKUP REQUESTED";

    } else {

        subject = "Order has been requested for delivery";
        trip_type = "delivery";
        order_status = "DELIVERY REQUESTED";
    }

    let text =
        "Your order in the '" + laundry_name + "' has been requested for " + trip_type + "\n\n" +
        "Order ID: " + trip.order.id.slice(-10) + "\n" +
        "Order status: " + order_status + "\n\n" +
        "You will be informed once we find a rider to pickup your items.\n" +
        "\u00A9 Laundromat"

    return utilsObject.sendEmail(emailAddress, subject, text, topics[4])
        .catch(e => {

            throw new functions.https.HttpsError("internal",
                e.message);
        });
}

utilsObject.sendPaymentEmailToCustomer = function (email, order_data, trip_data) {

    let order = order_data;
    let trip = trip_data;

    let subject = "Payment successful for ORDER & PICKUP for order : " + order.id;
    let text =
        "You have successfully paid for your order and the delivery fee: " +
        "Order ID: " + order.id.slice(-10) + "\n" +
        "Order Price: PKR" + order.price + "\n" +
        "Pickup Fee: PKR" + trip.cost + "\n\n" +
        "Your order will be completed and delivered to you soon.\n" +
        "\u00A9 Laundromat"

    return utilsObject.sendEmail(email, subject, text, topics[5])
        .catch(e => {

            throw new functions.https.HttpsError("internal",
                e.message);
        });
}

utilsObject.sendEarningEmailToDriver = function (email, order_data, trip_data) {

    let trip = trip_data;

    let subject = "You have received earning from your trip: " + trip.id;
    let text =
        "You have successfully got paid for your trip: " +
        "Trip ID: " + trip.id.slice(-10) + "\n" +
        "Earning: PKR" + trip.cost + "\n\n" +
        "keep up with good service to earn more.\n" +
        "\u00A9 Laundromat"

    return utilsObject.sendEmail(email, subject, text, topics[5])
        .catch(e => {

            throw new functions.https.HttpsError("internal",
                e.message);
        });
}

utilsObject.sendEarningEmailToMerchant = function (email, order_data) {

    let order = order_data;

    let subject = "You have received earning from your order: " + order.id.slice(-10);
    let text =
        "You have successfully got paid for your order: " +
        "Order ID: " + order.id.slice(-10) + "\n" +
        "Earning: PKR " + order.price + "\n\n" +
        "keep up with good service to earn more.\n" +
        "\u00A9 Laundromat"

    return utilsObject.sendEmail(email, subject, text, topics[5])
        .catch(e => {

            throw new functions.https.HttpsError("internal",
                e.message);
        });
}

utilsObject.sendDeliveryFeeEmailToMerchant = function (email, order_data, trip_data) {

    let order = order_data;
    let trip = trip_data;

    let subject = "Delivery fee payed for order: " + order.id.slice(-10);
    let text =
        "You have successfully paid delivery fee for your order: " +
        "Order ID: " + order.id.slice(-10) + "\n" +
        "Fare: PKR " + trip.cost + "\n\n" +
        "Thanks for choosing laundromat.\n" +
        "\u00A9 Laundromat"

    return utilsObject.sendEmail(email, subject, text, topics[5])
        .catch(e => {

            throw new functions.https.HttpsError("internal",
                e.message);
        });
}

utilsObject.sendOrderCollectedEmailToCustomer = function (email, order) {

    let subject = "Your order has been collected";
    let text =
        "Your order with ID: " + order.id.slice(-10) + " has been collected by " + order.laundryName + "\n" +
        "You will be notified once the laundry starts washing your items" + "\n\n" +
        "Your items are in safe hands.\n" +
        "\u00A9 Laundromat"

    return utilsObject.sendEmail(email, subject, text, topics[5])
        .catch(e => {

            throw new functions.https.HttpsError("internal",
                e.message);
        });
}

utilsObject.sendOrderCompletedEmailToCustomer = function (email, order) {

    let subject = "Your order has been completed";
    let text =
        "Your order with ID: " + order.id.slice(-10) + " has been completed\n\n" +
        "Thanks for choosing Laundromat to for laundry services.\n" +
        "\u00A9 Laundromat"

    return utilsObject.sendEmail(email, subject, text, topics[5])
        .catch(e => {

            throw new functions.https.HttpsError("internal",
                e.message);
        });
}

utilsObject.sendOrderCompletedToMerchant = function (email, order) {

    let subject = "Your order has been completed";
    let text =
        "Your order with ID: " + order.id.slice(-10) + " has been completed\n\n" +
        "Thanks for providing services on Laundromat.\n" +
        "\u00A9 Laundromat"

    return utilsObject.sendEmail(email, subject, text, topics[5])
        .catch(e => {

            throw new functions.https.HttpsError("internal",
                e.message);
        });
}

utilsObject.sendTripCompletedEmailToDriver = function (email, trip_id) {

    let subject = "Your trip has been completed";
    let text =
        "Your trip with ID: " + trip_id.slice(-10) + " has been completed\n\n" +
        "Thanks for providing your services on Laundromat.\n" +
        "\u00A9 Laundromat"

    return utilsObject.sendEmail(email, subject, text, topics[5])
        .catch(e => {

            throw new functions.https.HttpsError("internal",
                e.message);
        });
}

utilsObject.sendTripCancelEmail = function (email, order_id) {

    let subject = "Your scheduled collection for order was cancelled";
    let text =
        "Your order with ID: " + order_id.slice(-10) + " has been cancelled for the scheduled collection by the driver\n\n" +
        "We apologise for any inconvenience.\n" +
        "\u00A9 Laundromat"

    return utilsObject.sendEmail(email, subject, text, topics[5])
        .catch(e => {

            throw new functions.https.HttpsError("internal",
                e.message);
        });
}

utilsObject.sendTripCancelEmailToDriver = function (email, trip_id) {

    let subject = "You cancelled your scheduled trip";
    let text =
        "Your trip with ID: " + trip_id.slice(-10) + " has been cancelled upon your request\n\n" +
        "Maintain higher service quality in the future for better customer experience.\n" +
        "\u00A9 Laundromat"

    return utilsObject.sendEmail(email, subject, text, topics[5])
        .catch(e => {

            throw new functions.https.HttpsError("internal",
                e.message);
        });
}


// send an email to a user
utilsObject.sendEmail = function (receiverEmail, subject, text, topic) {

    let smtpTransport = nodeMailer.createTransport({

        service: "Gmail",
        auth: {

            user: senderEmail,
            pass: senderPassword
        }
    });

    let mailOptions = {

        to: receiverEmail,
        from: senderEmail,
        subject: subject,
        text: text
    };

    return smtpTransport.sendMail(mailOptions)
        .then(() => {

            return admin.firestore().collection("emails")
                .add({

                    topic: topic,
                    receiver_address: receiverEmail,
                    subject: subject,
                    text: text,
                    date_created: new Date()
                });
        })
        .catch((e) => {

            throw new functions.https.HttpsError("internal",
                e.message);
        });
}

module.exports = utilsObject;
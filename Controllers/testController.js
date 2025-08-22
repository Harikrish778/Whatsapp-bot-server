const axios = require("axios");
const User = require("../models/User"); // the model we defined earlier

const PHONE_NUMBER_ID = "774499122413641";
const ACCESS_TOKEN = process.env.WHATSAPP_TOKEN;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

// Helper to send WhatsApp messages
async function sendReply(to, message, buttons) {
  const payload = {
    messaging_product: "whatsapp",
    to,
    type: buttons ? "interactive" : "text",
    ...(buttons
      ? {
          interactive: {
            type: "button",
            body: { text: message },
            action: { buttons },
          },
        }
      : { text: { body: message } }),
  };

  try {
    const response = await axios.post(
      `https://graph.facebook.com/v22.0/${PHONE_NUMBER_ID}/messages`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );
    console.log("✅ Sent:", response.data);
  } catch (err) {
    console.error("❌ WhatsApp send error:", err.response?.data || err.message);
  }
}

// GET webhook verification
exports.verifyWebhook = (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && token && mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("✅ WEBHOOK_VERIFIED");
    return res.status(200).send(challenge);
  }
  res.sendStatus(403);
};

// POST webhook for incoming messages
exports.receiveMessage = async (req, res) => {
  console.log("📩 Incoming webhook:", JSON.stringify(req.body, null, 2));

  try {
    const entry = req.body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const message = value?.messages?.[0];

    if (!message) return res.sendStatus(200);

    const from = message.from;
    const text = message.text?.body?.toLowerCase();
    const location = message.location;

    // Fetch or create user
    let user = await User.findOne({ whatsapp: from });
    if (!user) {
      user = new User({ whatsapp: from });
    }

    // Check current step
    switch (user.currentStep) {
      case "awaiting_location":
        if (location) {
          user.location = { lat: location.latitude, lng: location.longitude };
          user.currentStep = "awaiting_age";
          await user.save();
          await sendReply(
            from,
            `👋 Hello and welcome to Warmy HealthConnect!\n\nWe're here to care for you and your loved ones 🌿.\n\nYou have selected Lab Test at Home\n\nCould you please tell me your age?`
          );
        } else {
          await sendReply(from, "Please send your location to proceed.");
        }
        break;

      case "awaiting_age":
        const age = parseInt(text);
        if (!isNaN(age)) {
          user.age = age;
          if (age > 50) {
            user.currentStep = "awaiting_prescription_or_tests";
            await user.save();
            await sendReply(
              from,
              `🙏 Thank you. Since you are above 50, we will prioritize your request 🌟.\nPlease do one of the following:`,
              [
                { type: "reply", reply: { id: "upload_prescription", title: "📷 Upload Prescription" } },
                { type: "reply", reply: { id: "type_tests", title: "✍️ Type Tests" } },
              ]
            );
          } else {
            user.currentStep = "awaiting_prescription_or_tests";
            await user.save();
            await sendReply(
              from,
              `Thank you! Please do one of the following:`,
              [
                { type: "reply", reply: { id: "upload_prescription", title: "📷 Upload Prescription" } },
                { type: "reply", reply: { id: "type_tests", title: "✍️ Type Tests" } },
              ]
            );
          }
        } else {
          await sendReply(from, "Please type a valid age.");
        }
        break;

      case "awaiting_prescription_or_tests":
        if (text) {
          user.requestedTests = text;
          await user.save();
          await sendReply(
            from,
            "✅ Got it! Your lab test request has been recorded. Our team will contact you soon."
          );
        } else if (message.image) {
          user.prescriptionPhoto = message.image.id; // you might want to download via media API
          await user.save();
          await sendReply(
            from,
            "✅ Prescription received! Our team will review and contact you shortly."
          );
        } else {
          await sendReply(
            from,
            "Please upload a prescription photo or type the name of the tests you require."
          );
        }
        break;

      default:
        // Default / first message
        if (text === "lab test at home") {
          user.selectedService = "lab_test_home";
          user.currentStep = "awaiting_location";
          await user.save();
          await sendReply(from, "Please share your location to proceed.");
        } else {
          await sendReply(from, "Hi! Please choose a service: Lab Test at Home, Medicine Delivery, Care at Home.");
        }
        break;
    }
  } catch (err) {
    console.error("❌ Error in webhook:", err.stack || err.message);
  }

  res.sendStatus(200);
};

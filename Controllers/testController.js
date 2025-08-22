const axios = require("axios");

// WhatsApp details (from Meta)
const PHONE_NUMBER_ID = "774499122413641"; // your phone number ID
const ACCESS_TOKEN = process.env.WHATSAPP_TOKEN; // token from .env
const VERIFY_TOKEN = process.env.VERIFY_TOKEN; // verify token from .env

// ✅ Handle GET request for webhook verification
exports.verifyWebhook = (req, res) => {
  console.log("🔎 VERIFY WEBHOOK called");
  console.log("➡️ Query:", req.query);

  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && token) {
    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      console.log("✅ WEBHOOK_VERIFIED");
      return res.status(200).send(challenge);
    } else {
      console.error("❌ Verification failed: token mismatch");
      return res.sendStatus(403);
    }
  } else {
    console.error("❌ Verification failed: missing params");
    return res.sendStatus(400);
  }
};

// ✅ Handle POST request (incoming messages)
exports.receiveMessage = async (req, res) => {
  console.log("📩 Incoming webhook called");
  console.log("➡️ Headers:", req.headers);
  console.log("➡️ Body:", JSON.stringify(req.body, null, 2));

  try {
    const entry = req.body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const message = value?.messages?.[0];

    if (message) {
      const from = message.from; // sender number
      const text = message.text?.body?.toLowerCase(); // message content

      console.log(`📨 Message from ${from}: ${text}`);

      // Simple auto-reply
      if (text === "hi" || text === "hello") {
        await sendReply(
          from,
          "👋 Hello and welcome to Warmy HealthConnect!\n\nWe're here to care for you and your loved ones 💚.\n\nHow can we help you today?\n\nPlease type or choose from below:"
        );
      }

    }
  } catch (err) {
    console.error("❌ Error handling message:", err.stack || err.message);
  }

  // Always respond 200 so WhatsApp doesn’t retry
  res.sendStatus(200);
};

// ✅ Helper function to send WhatsApp message
// ✅ Helper function to send WhatsApp text+buttons
async function sendReply(to, body) {
  try {
    const response = await axios.post(
      `https://graph.facebook.com/v22.0/${PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: "whatsapp",
        to,
        type: "interactive",
        interactive: {
          type: "button",
          body: {
            text: body,
          },
          action: {
            buttons: [
              {
                type: "reply",
                reply: {
                  id: "medicine_delivery",
                  title: "💊 Medicine Delivery",
                },
              },
              {
                type: "reply",
                reply: {
                  id: "care_at_home",
                  title: "🏥 Care at Home",
                },
              },
              {
                type: "reply",
                reply: {
                  id: "lab_test",
                  title: "🧪 Lab Test at Home",
                },
              },
            ],
          },
        },
      },
      {
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ Reply with buttons sent:", JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error("❌ Failed to send reply with buttons:");
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", JSON.stringify(error.response.data, null, 2));
    } else {
      console.error("Message:", error.message);
    }
  }
}

// ✅ Send template message from client request
exports.startMessage = async (req, res) => {
  const { to } = req.body; // recipient number
  console.log("🚀 Sending template message to:", to);

  try {
    const response = await axios.post(
      `https://graph.facebook.com/v22.0/${PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: "whatsapp",
        to,
        type: "template",
        template: {
          name: "hello_world", // template must exist in WhatsApp manager
          language: { code: "en_US" },
        },
      },
      {
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ Template sent:", JSON.stringify(response.data, null, 2));
    res.json({ success: true, data: response.data });
  } catch (error) {
    console.error("❌ Failed to send template message:");
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", JSON.stringify(error.response.data, null, 2));
      res
        .status(error.response.status)
        .json({ success: false, error: error.response.data });
    } else {
      console.error("Message:", error.message);
      res.status(500).json({ success: false, error: error.message });
    }
  }
};

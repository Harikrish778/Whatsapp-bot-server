const axios=require('axios')


// WhatsApp details (from Meta)
const PHONE_NUMBER_ID = "774499122413641"; // your phone number ID
const ACCESS_TOKEN = process.env.WHATSAPP_TOKEN; // put your token in .env
// controllers/webhookController.js
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

// ✅ Handle GET request for webhook verification
exports.verifyWebhook = (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && token) {
    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      console.log("✅ WEBHOOK_VERIFIED");
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  }
};

// ✅ Handle POST request (incoming messages)
exports.receiveMessage = async(req, res) => {
 
  console.log("📩 Incoming webhook:", JSON.stringify(req.body, null, 2));

  try {
    const entry = req.body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const message = value?.messages?.[0];

    if (message) {
      const from = message.from; // sender number
      const text = message.text?.body?.toLowerCase(); // message content

      console.log(`📨 Message from ${from}: ${text}`);

      // If user sends "hi", reply with welcome message
      if (text === "hi") {
        await sendReply(from, "👋 Welcome! Thanks for saying hi!");
      }
    }
  } catch (err) {
    console.error("❌ Error handling message:", err.message);
  }

  res.sendStatus(200); // Tell WhatsApp we received the message
};

// ✅ Helper function to send WhatsApp message
async function sendReply(to, body) {
  try {
    const response = await axios.post(
      `https://graph.facebook.com/v22.0/${PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body },
      },
      {
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ Reply sent:", response.data);
  } catch (error) {
    console.error(
      "❌ Failed to send reply:",
      error.response?.data || error.message
    );
  }
}


exports.startMessage=async(req,res)=>{
  const { to } = req.body;  // recipient number from client side
  try {
    const response = await axios.post(
      `https://graph.facebook.com/v22.0/${PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: "whatsapp",
        to,
        type: "template",
        template: {
          name: "hello_world",
          language: { code: "en_US" }
        }
      },
      {
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          "Content-Type": "application/json"
        }
      }
    );

    res.json({ success: true, data: response.data });
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({ success: false, error: error.response?.data || error.message });
  }
}
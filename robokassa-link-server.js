require("dotenv").config();
const express = require("express");
const crypto = require("crypto");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json());

function generateUniqueId() {
  const maxId = 2147483647;
  const minId = 1;
  return (Date.now() % (maxId - minId + 1)) + minId;
}

function generatePaymentLink(paymentId, sum, email) {
  const shopId = process.env.ROBO_ID;
  const secretKey1 = process.env.ROBO_SECRET1;

  const signature = crypto
    .createHash("md5")
    .update(`${shopId}:${sum}:${paymentId}:${secretKey1}`)
    .digest("hex");

  return `https://auth.robokassa.ru/Merchant/Index.aspx?MerchantLogin=${shopId}&OutSum=${sum}&InvId=${paymentId}&SignatureValue=${signature}&Email=${encodeURIComponent(
    email
  )}&IsTest=0`;
}

app.post("/generate-link", (req, res) => {
  const { sum, email } = req.body;

  if (!sum || !email) {
    return res.status(400).json({ error: "Missing required fields: sum or email" });
  }

  const paymentId = generateUniqueId();
  const paymentLink = generatePaymentLink(paymentId, sum, email);

  return res.json({ paymentLink, paymentId });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Robokassa Link Server running on port ${PORT}`);
});

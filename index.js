require("dotenv").config();
const express = require("express");
const crypto = require("crypto");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

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

  return \`https://auth.robokassa.ru/Merchant/Index.aspx?MerchantLogin=\${shopId}&OutSum=\${sum}&InvId=\${paymentId}&SignatureValue=\${signature}&Email=\${encodeURIComponent(
    email
  )}&IsTest=0\`;
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

app.post("/webhook/robokassa", (req, res) => {
  const { OutSum, InvId, SignatureValue } = req.body;

  if (!OutSum || !InvId || !SignatureValue) {
    return res.status(400).send("Missing required fields");
  }

  const expectedSignature = crypto
    .createHash("md5")
    .update(\`\${OutSum}:\${InvId}:\${process.env.ROBO_SECRET2}\`)
    .digest("hex");

  if (SignatureValue.toLowerCase() !== expectedSignature.toLowerCase()) {
    return res.status(400).send("Invalid signature");
  }

  console.log(\`✅ Payment confirmed: InvId=\${InvId}, OutSum=\${OutSum}\`);
  return res.send("OK");
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(\`Robokassa Microservice running on port \${PORT}\`);
});

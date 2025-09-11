const functions = require("firebase-functions/v1");
const nodemailer = require("nodemailer");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

const gmailUser = functions.config().gmail.user;
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: gmailUser,
    pass: functions.config().gmail.app_password
  },
});

exports.sendVerificationEmail = functions.https.onRequest(async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ success: false, error: "이메일 또는 코드 누락" });
    }

    await transporter.sendMail({
      from: `"CampusEat" <${gmailUser}>`,
      to: email,
      subject: "캠퍼스잇 대학 이메일 인증",
      text: `인증번호: ${code} (3분 내 입력)`,
      html: `<p>인증번호: <strong>${code}</strong></p><p>3분 내 입력해주세요.</p>`,
    });

    await db.collection("emailVerifications").doc(email).set({
      code,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

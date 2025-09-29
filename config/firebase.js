const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

// ✅ Determine environment: local or Render
let serviceAccount;

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  // On Render (or any public environment)
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  console.log("✅ Using Firebase service account from environment variable");
} else {
  // Local development
  const serviceAccountPath = path.join(__dirname, "serviceAccountKey.json");
  if (!fs.existsSync(serviceAccountPath)) {
    console.error("❌ Missing local serviceAccountKey.json file");
    process.exit(1);
  }
  serviceAccount = require(serviceAccountPath);
  console.log("✅ Using local serviceAccountKey.json");
}

// Initialize Firebase only once
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id,
  });
  console.log("✅ Firebase Admin SDK initialized successfully");
}

/**
 * Send push notification to a single device
 */
const sendNotificationToDevice = async (fcmToken, title, body, data = {}) => {
  try {
    const message = {
      token: fcmToken,
      notification: { title, body },
      data: { ...data, timestamp: new Date().toISOString() },
      android: {
        notification: { icon: "ic_notification", color: "#667eea", sound: "default" },
      },
      apns: {
        payload: { aps: { sound: "default", badge: 1 } },
      },
    };

    const response = await admin.messaging().send(message);
    console.log("✅ Push notification sent successfully:", response);
    return { success: true, messageId: response };
  } catch (error) {
    console.error("❌ Push notification error:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Send push notification to multiple devices
 */
const sendNotificationToMultipleDevices = async (fcmTokens, title, body, data = {}) => {
  try {
    const message = {
      tokens: fcmTokens,
      notification: { title, body },
      data: { ...data, timestamp: new Date().toISOString() },
      android: {
        notification: { icon: "ic_notification", color: "#667eea", sound: "default" },
      },
      apns: {
        payload: { aps: { sound: "default", badge: 1 } },
      },
    };

    const response = await admin.messaging().sendMulticast(message);
    console.log(`✅ Push notifications sent: ${response.successCount}/${fcmTokens.length}`);

    const failedTokens = [];
    response.responses.forEach((resp, idx) => {
      if (!resp.success) {
        failedTokens.push(fcmTokens[idx]);
        console.error(`❌ Failed to send to token ${idx}:`, resp.error);
      }
    });

    return {
      success: true,
      successCount: response.successCount,
      failureCount: response.failureCount,
      failedTokens,
    };
  } catch (error) {
    console.error("❌ Multicast push notification error:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Send push notification to a topic (broadcast)
 */
const sendNotificationToTopic = async (topic, title, body, data = {}) => {
  try {
    const message = {
      topic,
      notification: { title, body },
      data: { ...data, timestamp: new Date().toISOString() },
      android: {
        notification: { icon: "ic_notification", color: "#667eea", sound: "default" },
      },
      apns: {
        payload: { aps: { sound: "default", badge: 1 } },
      },
    };

    const response = await admin.messaging().send(message);
    console.log("✅ Topic notification sent successfully:", response);
    return { success: true, messageId: response };
  } catch (error) {
    console.error("❌ Topic notification error:", error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  admin,
  sendNotificationToDevice,
  sendNotificationToMultipleDevices,
  sendNotificationToTopic,
};

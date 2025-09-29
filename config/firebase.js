const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

// ✅ Initialize Firebase only once
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

    if (response.failureCount > 0) {
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
    }

    return {
      success: true,
      successCount: response.successCount,
      failureCount: response.failureCount,
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

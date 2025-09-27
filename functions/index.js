const { onSchedule } = require("firebase-functions/v2/scheduler");
const { onDocumentCreated, onDocumentDeleted, onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { logger } = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();
const { increment, FieldValue } = admin.firestore;

/**
 * 10분마다 실행되어 만료된 번개모임과 관련 채팅 데이터를 삭제합니다.
 */
exports.cleanupExpiredMeetings = onSchedule("every 10 minutes", async (event) => {
    const now = admin.firestore.Timestamp.now();
    const expiredMeetingsQuery = db.collection("meetings").where("datetime", "<=", now);
    const snapshot = await expiredMeetingsQuery.get();
    if (snapshot.empty) {
        return null;
    }
    const batch = db.batch();
    snapshot.forEach(doc => {
        batch.delete(doc.ref);
    });
    return batch.commit();
});

/**
 * 'reviews' 컬렉션의 문서 생성/삭제를 감지하여 'reviewCount'를 업데이트합니다.
 */
exports.onReviewCreated = onDocumentCreated("reviews/{reviewId}", (event) => {
    const reviewData = event.data.data();
    const restaurantRef = db.collection("newUniversities").doc(reviewData.university).collection("newRestaurants").doc(reviewData.restaurantId);
    return restaurantRef.update({ reviewCount: increment(1) });
});

exports.onReviewDeleted = onDocumentDeleted("reviews/{reviewId}", (event) => {
    const deletedData = event.data.data();
    const restaurantRef = db.collection("newUniversities").doc(deletedData.university).collection("newRestaurants").doc(deletedData.restaurantId);
    return restaurantRef.update({ reviewCount: increment(-1) });
});

/**
 * 'meetings' 문서가 삭제될 때 트리거되어 하위 'messages' 컬렉션을 모두 삭제합니다.
 */
exports.onMeetingDeleted = onDocumentDeleted("meetings/{meetingId}", (event) => {
    const messagesRef = db.collection("meetings").doc(event.params.meetingId).collection("messages");
    return deleteSubcollection(messagesRef);
});


/**
 * 'meetings' 문서의 참가자 변경을 감지하여 입장/퇴장/강퇴 메시지와 쪽지를 보냅니다.
 */
exports.onParticipantChanged = onDocumentUpdated("meetings/{meetingId}", async (event) => {
    const dataAfter = event.data.after.data();
    const dataBefore = event.data.before.data();
    const meetingId = event.params.meetingId;
    
    const participantsBefore = dataBefore.participantIds || [];
    const participantsAfter = dataAfter.participantIds || [];

    const joinedUids = participantsAfter.filter(uid => !participantsBefore.includes(uid));
    const leftUids = participantsBefore.filter(uid => !participantsAfter.includes(uid));

    // --- 1. Handle User Joins ---
    if (joinedUids.length > 0) {
        const joinedUid = joinedUids[0];
        const userDoc = await db.collection("users").doc(joinedUid).get();
        if (userDoc.exists) {
            await db.collection("meetings").doc(meetingId).collection("messages").add({
                text: `${userDoc.data().nickname}님이 입장하셨습니다.`,
                senderId: "system",
                createdAt: FieldValue.serverTimestamp(),
            });
        }
    }

    // --- 2. Handle User Leaves/Kicks ---
    if (leftUids.length > 0) {
        const leftUid = leftUids[0];
        const userDoc = await db.collection("users").doc(leftUid).get();
        if (userDoc.exists) {
            const nickname = userDoc.data().nickname;
            const kickedUserIds = dataAfter.kickedUserIds || [];

            // Check if this was a kick event
            if (kickedUserIds.includes(leftUid)) {
                await db.collection("meetings").doc(meetingId).collection("messages").add({
                    text: `${nickname}님이 모임에서 제외되었습니다.`,
                    senderId: "system",
                    createdAt: FieldValue.serverTimestamp(),
                });
                await db.collection("messages").add({
                    senderId: "system",
                    senderNickname: "캠퍼스잇 관리자",
                    recipientId: leftUid,
                    recipientNickname: nickname,
                    content: `[${dataAfter.title}] 모임에서 강퇴당하셨습니다.`,
                    createdAt: FieldValue.serverTimestamp(),
                    isRead: false,
                });
            } else {
                // It's a voluntary leave
                await db.collection("meetings").doc(meetingId).collection("messages").add({
                    text: `${nickname}님이 퇴장하셨습니다.`,
                    senderId: "system",
                    createdAt: FieldValue.serverTimestamp(),
                });
            }
        }
    }
    return null;
});


/**
 * 주어진 컬렉션의 모든 문서를 삭제하는 헬퍼 함수입니다.
 */
async function deleteSubcollection(collectionRef) {
    const snapshot = await collectionRef.limit(500).get();
    if (snapshot.size === 0) return;
    const batch = db.batch();
    snapshot.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
    if (snapshot.size >= 500) {
        return deleteSubcollection(collectionRef);
    }
}
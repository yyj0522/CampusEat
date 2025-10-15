const { onSchedule } = require("firebase-functions/v2/scheduler");
const { onDocumentCreated, onDocumentDeleted } = require("firebase-functions/v2/firestore");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { logger } = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

exports.joinMeeting = onCall(async (request) => {
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "인증이 필요합니다.");
    }
    const { meetingId } = request.data;
    const uid = request.auth.uid;
    const meetingRef = db.collection("meetings").doc(meetingId);

    return db.runTransaction(async (transaction) => {
        const meetingDoc = await transaction.get(meetingRef);
        if (!meetingDoc.exists) {
            throw new HttpsError("not-found", "모임을 찾을 수 없습니다.");
        }
        const meetingData = meetingDoc.data();
        if (meetingData.participantCount >= meetingData.maxParticipants) {
            throw new HttpsError("failed-precondition", "모집 인원이 가득 찼습니다.");
        }
        if (meetingData.participantIds.includes(uid)) {
            logger.info("User already in meeting, skipping.");
            return { status: 'already-joined' };
        }

        const newParticipantInfo = { ...meetingData.participantInfo, [uid]: { joinedAt: admin.firestore.FieldValue.serverTimestamp() } };
        transaction.update(meetingRef, {
            participantIds: admin.firestore.FieldValue.arrayUnion(uid),
            participantCount: admin.firestore.FieldValue.increment(1),
            participantInfo: newParticipantInfo
        });

        const userDoc = await db.collection("users").doc(uid).get();
        const nickname = userDoc.exists ? userDoc.data().nickname : "참가자";
        const messageRef = meetingRef.collection("messages").doc();
        transaction.set(messageRef, {
            text: `${nickname}님이 입장하셨습니다.`,
            senderId: "system",
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return { status: 'success' };
    });
});

exports.leaveMeeting = onCall(async (request) => {
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "인증이 필요합니다.");
    }
    const { meetingId } = request.data;
    const uid = request.auth.uid;
    const meetingRef = db.collection("meetings").doc(meetingId);

    return db.runTransaction(async (transaction) => {
        const meetingDoc = await transaction.get(meetingRef);
        if (!meetingDoc.exists) return { status: 'not-found' };

        const meetingData = meetingDoc.data();
        if (!meetingData.participantIds.includes(uid)) return { status: 'not-a-participant' };

        const newParticipantInfo = { ...meetingData.participantInfo };
        delete newParticipantInfo[uid];
        transaction.update(meetingRef, {
            participantIds: admin.firestore.FieldValue.arrayRemove(uid),
            participantCount: admin.firestore.FieldValue.increment(-1),
            participantInfo: newParticipantInfo
        });

        const userDoc = await db.collection("users").doc(uid).get();
        const nickname = userDoc.exists ? userDoc.data().nickname : "참가자";
        const messageRef = meetingRef.collection("messages").doc();
        transaction.set(messageRef, {
            text: `${nickname}님이 퇴장하셨습니다.`,
            senderId: "system",
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return { status: 'success' };
    });
});

exports.kickUserFromMeeting = onCall(async (request) => {
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "인증이 필요합니다.");
    }
    const { meetingId, targetUserId } = request.data;
    const uid = request.auth.uid;
    const meetingRef = db.collection("meetings").doc(meetingId);

    return db.runTransaction(async (transaction) => {
        const meetingDoc = await transaction.get(meetingRef);
        if (!meetingDoc.exists) {
            throw new HttpsError("not-found", "모임을 찾을 수 없습니다.");
        }
        const meetingData = meetingDoc.data();

        if (meetingData.creatorId !== uid) {
            throw new HttpsError("permission-denied", "모임 방장만 강퇴할 수 있습니다.");
        }
        if (!meetingData.participantIds.includes(targetUserId)) return { status: 'not-a-participant' };

        const newParticipantInfo = { ...meetingData.participantInfo };
        delete newParticipantInfo[targetUserId];
        transaction.update(meetingRef, {
            participantIds: admin.firestore.FieldValue.arrayRemove(targetUserId),
            participantCount: admin.firestore.FieldValue.increment(-1),
            kickedUserIds: admin.firestore.FieldValue.arrayUnion(targetUserId),
            participantInfo: newParticipantInfo
        });

        const targetUserDoc = await db.collection("users").doc(targetUserId).get();
        const nickname = targetUserDoc.exists ? targetUserDoc.data().nickname : "참가자";
        
        const chatMessageRef = meetingRef.collection("messages").doc();
        transaction.set(chatMessageRef, {
            text: `${nickname}님이 모임에서 제외되었습니다.`,
            senderId: "system",
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        const dmRef = db.collection("messages").doc();
        transaction.set(dmRef, {
            senderId: "system",
            senderNickname: "캠퍼스잇 관리자",
            recipientId: targetUserId,
            recipientNickname: nickname,
            content: `[${meetingData.title}] 모임에서 강퇴당하셨습니다.`,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            isRead: false,
        });
        return { status: 'success' };
    });
});

exports.deleteMeeting = onCall(async (request) => {
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "You must be logged in to delete a meeting.");
    }

    const meetingId = request.data.meetingId;
    const uid = request.auth.uid;

    if (!meetingId) {
        throw new HttpsError("invalid-argument", "The function must be called with a 'meetingId'.");
    }

    const meetingRef = db.collection("meetings").doc(meetingId);

    try {
        const doc = await meetingRef.get();
        if (!doc.exists) {
            throw new HttpsError("not-found", "No such meeting exists.");
        }

        if (doc.data().creatorId !== uid) {
            throw new HttpsError("permission-denied", "You do not have permission to delete this meeting.");
        }

        const messagesRef = meetingRef.collection("messages");
        const messagesSnapshot = await messagesRef.get();
        const batch = db.batch();
        messagesSnapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();

        await meetingRef.delete();

        return { success: true };

    } catch (error) {
        logger.error("Error deleting meeting:", error);
        if (error instanceof HttpsError) {
            throw error;
        }
        throw new HttpsError("internal", "Could not delete meeting.");
    }
});

exports.createMeetingChat = onDocumentCreated("meetings/{meetingId}", async (event) => {
    const snap = event.data;
    if (!snap) {
        logger.log("No data associated with the event");
        return;
    }
    const meetingData = snap.data();
    const meetingId = event.params.meetingId;

    logger.log(`New meeting created: ${meetingId}. Adding initial system message.`);

    const messagesRef = snap.ref.collection("messages");

    try {
        await messagesRef.add({
            text: `${meetingData.creatorNickname}님이 모임을 생성했습니다.`,
            senderId: "system",
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        logger.log(`Successfully added initial message for meeting: ${meetingId}`);

    } catch (error) {
        logger.error(`Error adding initial message for meeting ${meetingId}:`, error);
    }
});

exports.cleanupExpiredMeetings = onSchedule("every 10 minutes", async (event) => {
    const now = admin.firestore.Timestamp.now();
    const expiredMeetingsQuery = db.collection("meetings").where("datetime", "<=", now);
    const snapshot = await expiredMeetingsQuery.get();
    if (snapshot.empty) {
        logger.info("No expired meetings to clean up.");
        return null;
    }
    const batch = db.batch();
    snapshot.forEach(doc => {
        batch.delete(doc.ref);
    });
    logger.info(`Deleting ${snapshot.size} expired meetings.`);
    return batch.commit();
});

exports.onReviewCreated = onDocumentCreated("reviews/{reviewId}", (event) => {
    const reviewData = event.data.data();
    const restaurantRef = db.collection("newUniversities").doc(reviewData.university).collection("newRestaurants").doc(reviewData.restaurantId);
    return restaurantRef.update({ reviewCount: admin.firestore.FieldValue.increment(1) });
});

exports.onReviewDeleted = onDocumentDeleted("reviews/{reviewId}", (event) => {
    const deletedData = event.data.data();
    const restaurantRef = db.collection("newUniversities").doc(deletedData.university).collection("newRestaurants").doc(deletedData.restaurantId);
    return restaurantRef.update({ reviewCount: admin.firestore.FieldValue.increment(-1) });
});

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

exports.onMeetingDeleted = onDocumentDeleted("meetings/{meetingId}", (event) => {
    const messagesRef = event.data.ref.collection("messages");
    return deleteSubcollection(messagesRef);
});
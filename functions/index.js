const {onSchedule} = require("firebase-functions/v2/scheduler");
const {onDocumentCreated, onDocumentDeleted} = require("firebase-functions/v2/firestore");
const {logger} = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();
const {increment} = admin.firestore.FieldValue;

/**
 * 10분마다 실행되어 만료된 번개모임과 관련 채팅 데이터를 삭제합니다.
 */
exports.cleanupExpiredMeetings = onSchedule("every 10 minutes", async (event) => {
  const now = admin.firestore.Timestamp.now();

  const expiredMeetingsQuery = db.collection("meetings")
      .where("datetime", "<=", now);
  const snapshot = await expiredMeetingsQuery.get();

  if (snapshot.empty) {
    logger.info("삭제할 만료된 모임이 없습니다.");
    return null;
  }

  const batch = db.batch();
  const deletePromises = [];

  snapshot.forEach((doc) => {
    logger.info(`만료된 모임 삭제 중: ${doc.id}`);
    batch.delete(doc.ref);

    const messagesRef = doc.ref.collection("messages");
    deletePromises.push(deleteSubcollection(messagesRef));
  });

  await batch.commit();
  await Promise.all(deletePromises);

  logger.info(`총 ${snapshot.size}개의 만료된 모임 및 채팅 데이터 삭제 완료.`);
  return null;
});

/**
 * 'reviews' 컬렉션에 새 문서가 생성될 때마다 실행되어
 * 해당 음식점의 'reviewCount'를 1 증가시킵니다.
 */
exports.onReviewCreated = onDocumentCreated("reviews/{reviewId}", (event) => {
  const snapshot = event.data;
  if (!snapshot) {
    logger.log("리뷰 생성 이벤트 데이터 없음");
    return;
  }
  const reviewData = snapshot.data();
  const restaurantId = reviewData.restaurantId;
  const university = reviewData.university;

  if (!restaurantId || !university) {
    logger.error("리뷰에 restaurantId 또는 university 필드가 없습니다.", reviewData);
    return;
  }

  const restaurantRef = db.collection("newUniversities").doc(university)
      .collection("newRestaurants").doc(restaurantId);

  return restaurantRef.update({reviewCount: increment(1)});
});

/**
 * 'reviews' 컬렉션에서 문서가 삭제될 때마다 실행되어
 * 해당 음식점의 'reviewCount'를 1 감소시킵니다.
 */
exports.onReviewDeleted = onDocumentDeleted("reviews/{reviewId}", (event) => {
  const snapshot = event.data;
  if (!snapshot) {
    logger.log("리뷰 삭제 이벤트 데이터 없음");
    return;
  }
  const deletedData = snapshot.data();
  const restaurantId = deletedData.restaurantId;
  const university = deletedData.university;

  if (!restaurantId || !university) {
    logger.error("삭제된 리뷰에 restaurantId 또는 university 필드가 없습니다.", deletedData);
    return;
  }

  const restaurantRef = db.collection("newUniversities").doc(university)
      .collection("newRestaurants").doc(restaurantId);

  return restaurantRef.update({reviewCount: increment(-1)});
});


/**
 * 주어진 컬렉션의 모든 문서를 삭제하는 헬퍼 함수입니다.
 * @param {FirebaseFirestore.CollectionReference} collectionRef 삭제할 컬렉션.
 * @return {Promise<void>} 삭제 작업이 완료되면 resolve되는 Promise.
 */
async function deleteSubcollection(collectionRef) {
  const snapshot = await collectionRef.limit(500).get();
  if (snapshot.size === 0) {
    return;
  }

  const batch = db.batch();
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });
  await batch.commit();
}
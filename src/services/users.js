import { doc, getDoc, setDoc, updateDoc, increment, collection, query, orderBy, onSnapshot, getDocs } from "firebase/firestore";
import { db } from "./firebase";

// Sync user on login
export const syncUser = async (user) => {
  if (!user) return;
  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);
  
  if (!userSnap.exists()) {
    await setDoc(userRef, {
      displayName: user.displayName || user.email.split('@')[0],
      email: user.email,
      points: 0,
      badges: [],
      reportsCount: 0,
      verificationsCount: 0,
      resolvedCount: 0,
    });
  }
};

export const awardPoints = async (userId, type) => {
  if (!userId) return;
  const userRef = doc(db, "users", userId);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) return;

  let userData = userSnap.data();
  let pointsToAdd = 0;
  let updates = {};

  // For initial values if missing
  userData.reportsCount = userData.reportsCount || 0;
  userData.verificationsCount = userData.verificationsCount || 0;
  userData.resolvedCount = userData.resolvedCount || 0;
  userData.points = userData.points || 0;

  if (type === 'REPORT') {
    pointsToAdd = 10;
    updates.reportsCount = increment(1);
    userData.reportsCount += 1;
  } else if (type === 'VERIFY') {
    pointsToAdd = 5;
    updates.verificationsCount = increment(1);
    userData.verificationsCount += 1;
  } else if (type === 'RESOLVED') {
    pointsToAdd = 20;
    updates.resolvedCount = increment(1);
    userData.resolvedCount += 1;
  }

  updates.points = increment(pointsToAdd);
  userData.points += pointsToAdd;

  // Check badges
  const currentBadges = userData.badges || [];
  const newBadges = [...currentBadges];

  if (userData.reportsCount >= 5 && !newBadges.includes('Community Reporter')) {
    newBadges.push('Community Reporter');
  }
  if (userData.reportsCount >= 20 && !newBadges.includes('Civic Champion')) {
    newBadges.push('Civic Champion');
  }
  if (userData.verificationsCount >= 25 && !newBadges.includes('Super Verifier')) {
    newBadges.push('Super Verifier');
  }
  if (userData.resolvedCount >= 5 && !newBadges.includes('Problem Solver')) {
    newBadges.push('Problem Solver');
  }

  if (newBadges.length > currentBadges.length) {
    updates.badges = newBadges;
  }

  await updateDoc(userRef, updates);
};

export const subscribeToLeaderboard = (callback) => {
  const q = query(collection(db, "users"), orderBy("points", "desc"));
  return onSnapshot(q, (snapshot) => {
    let rank = 1;
    const users = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        rank: rank++,
        ...data
      };
    });
    callback(users);
  }, (error) => {
    console.error("Error fetching leaderboard: ", error);
  });
};

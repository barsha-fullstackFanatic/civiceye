import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, updateDoc, doc, arrayUnion, increment, deleteDoc, getDocs, where } from "firebase/firestore";
import { db } from "./firebase";
import { awardPoints } from "./users";

export const getCategoryStats = async (category) => {
  try {
    const q = query(collection(db, "reports"), where("category", "==", category));
    const snapshot = await getDocs(q);
    const docs = snapshot.docs;
    let highSeverityCount = 0;
    
    docs.forEach(doc => {
      const data = doc.data();
      if (data.severity === "HIGH" || data.severity === "CRITICAL") {
        highSeverityCount++;
      }
    });

    return {
      categoryCount: docs.length,
      highSeverityCount,
      hotspotZone: "Main District", // simplified for now
      averageResolutionDays: 2.3
    };
  } catch (error) {
    console.error("Failed to get stats", error);
    return {
      categoryCount: 0,
      highSeverityCount: 0,
      hotspotZone: "Unknown",
      averageResolutionDays: 0
    };
  }
};

// Create a new report
export const createReport = async (reportData, userId) => {
  try {
    console.log("Adding document to collection 'reports'...", reportData);
    const docRef = await addDoc(collection(db, "reports"), {
      ...reportData,
      createdBy: userId,
      status: "PENDING",
      createdAt: serverTimestamp(),
      verificationCount: 0,
      verifiedBy: [],
    });
    
    // Award points
    await awardPoints(userId, 'REPORT');
    
    console.log("Document added successfully with ID:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Error creating report in Firestore:", error);
    throw new Error(`Firestore error: ${error.message}`);
  }
};

// Subscribe to reports for real-time updates
export const subscribeToReports = (callback) => {
  const q = query(collection(db, "reports"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    const reports = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(reports);
  }, (error) => {
    console.error("Error fetching reports: ", error);
  });
};

// Verify a report
export const verifyReport = async (reportId, userId) => {
  try {
    const reportRef = doc(db, "reports", reportId);
    await updateDoc(reportRef, {
      verifiedBy: arrayUnion(userId),
      verificationCount: increment(1)
    });
    
    // Award points for verification
    await awardPoints(userId, 'VERIFY');
  } catch (error) {
    console.error("Error verifying report:", error);
    throw error;
  }
};

// Delete a report
export const deleteReport = async (reportId) => {
  try {
    await deleteDoc(doc(db, "reports", reportId));
  } catch (error) {
    console.error("Error deleting report:", error);
    throw error;
  }
};

export const updateReportAssignment = async (reportId, assignmentData) => {
  try {
    const reportRef = doc(db, "reports", reportId);
    await updateDoc(reportRef, {
      predictiveAssignment: assignmentData
    });
  } catch (error) {
    console.error("Error updating report assignment:", error);
    throw error;
  }
};

export const updateReportInsights = async (reportId, insightsData) => {
  try {
    const reportRef = doc(db, "reports", reportId);
    await updateDoc(reportRef, {
      dataInsights: insightsData
    });
  } catch (error) {
    console.error("Error updating report insights:", error);
    throw error;
  }
};

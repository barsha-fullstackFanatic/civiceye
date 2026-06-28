import { collection, addDoc, Timestamp } from "firebase/firestore";
import { db } from "./firebase";
import { awardPoints } from "./users";

const categories = ["Pothole", "Water Leak", "Garbage", "Streetlight Damage", "Road Damage", "Infrastructure Damage"];
const severities = ["HIGH", "MEDIUM", "LOW"];
const statuses = ["PENDING", "IN_PROGRESS", "RESOLVED"];
const departments = ["Public Works", "Water Board", "Sanitation", "Electricity", "Roads & Highways", "City Maintenance"];

const generateRandomDate = (daysBack = 30) => {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * daysBack));
  date.setHours(Math.floor(Math.random() * 24));
  date.setMinutes(Math.floor(Math.random() * 60));
  return date;
};

const CHENNAI_LAT = 13.0827;
const CHENNAI_LNG = 80.2707;

export const generateDemoData = async (userId, userEmail) => {
  if (userEmail !== "barshadhn2@gmail.com") {
    throw new Error("Unauthorized: Admin access required.");
  }

  const reportsRef = collection(db, "reports");
  
  for (let i = 0; i < 20; i++) {
    const category = categories[Math.floor(Math.random() * categories.length)];
    const severity = severities[Math.floor(Math.random() * severities.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const department = departments[Math.floor(Math.random() * departments.length)];
    const date = generateRandomDate();
    
    const lat = CHENNAI_LAT + (Math.random() * 0.1 - 0.05);
    const lng = CHENNAI_LNG + (Math.random() * 0.1 - 0.05);

    const reportData = {
      title: `Demo: ${category} reported`,
      description: `Needs immediate attention to ensure public safety and proper infrastructure maintenance.`,
      category,
      severity,
      status,
      latitude: lat,
      longitude: lng,
      impactScore: Math.floor(Math.random() * 40) + 60, // 60-100
      department,
      summary: `Automated summary of ${category} incident indicating public hazard.`,
      recommendedPriority: severity,
      createdBy: userId,
      createdAt: Timestamp.fromDate(date),
      verificationCount: Math.floor(Math.random() * 10),
      verifiedBy: []
    };
    
    await addDoc(reportsRef, reportData);
    
    // Periodically award some points just to make leaderboard interesting
    if (Math.random() > 0.5) {
      await awardPoints(userId, 'REPORT');
    }
  }
};

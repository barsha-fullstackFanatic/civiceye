export const calculateImpactScore = (report) => {
  let score = 0;
  
  // Severity Weight
  const severity = report.severity?.toUpperCase() || "LOW";
  let severityScore = 10;
  if (severity === "MEDIUM") severityScore = 25;
  else if (severity === "HIGH") severityScore = 40;
  else if (severity === "CRITICAL") severityScore = 50;
  score += severityScore;

  // Verification Count
  const verifications = report.verifications || [];
  const verCount = verifications.length;
  let verScore = 5;
  if (verCount >= 3 && verCount <= 5) verScore = 10;
  else if (verCount >= 6 && verCount <= 10) verScore = 20;
  else if (verCount > 10) verScore = 30;
  score += verScore;

  // Category Weight
  const category = report.category || "";
  let catScore = 5; // default
  if (category === "Pothole" || category === "Water Leak") catScore = 15;
  else if (category === "Garbage" || category === "Streetlight Damage") catScore = 10;
  else if (category === "Infrastructure Damage") catScore = 20;
  score += catScore;

  // Age Weight
  let ageScore = 5;
  if (report.createdAt) {
    const reportDate = report.createdAt?.toDate ? report.createdAt.toDate() : new Date(report.createdAt);
    const now = new Date();
    const diffTime = Math.abs(now - reportDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays >= 1 && diffDays <= 3) ageScore = 10;
    else if (diffDays >= 4 && diffDays <= 7) ageScore = 15;
    else if (diffDays > 7) ageScore = 20;
  }
  score += ageScore;

  // Impact Level
  let impactLevel = "LOW";
  if (score > 30 && score <= 60) impactLevel = "MEDIUM";
  else if (score > 60 && score <= 80) impactLevel = "HIGH";
  else if (score > 80) impactLevel = "CRITICAL";

  // Impact Reason
  const reasonParts = [];
  if (severityScore >= 40) reasonParts.push(`High severity`);
  if (verScore >= 20) reasonParts.push(`Highly verified`);
  if (ageScore >= 15) reasonParts.push(`Unresolved for days`);
  
  const impactReason = reasonParts.length > 0 
    ? `Driven by: ${reasonParts.join(", ")}`
    : "Standard priority based on category and current verifications.";

  return {
    impactScore: score,
    impactLevel,
    impactReason
  };
};

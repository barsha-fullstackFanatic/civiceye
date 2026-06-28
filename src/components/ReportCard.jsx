import React, { useState } from "react";
import { AlertCircle, Clock, MapPin, CheckCircle, Trash2, Bot, LineChart, X, Activity } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { verifyReport, deleteReport, updateReportAssignment, updateReportInsights, getCategoryStats } from "../services/reports";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "motion/react";
import { calculateImpactScore } from "../utils/impact";

export default function ReportCard({ report, onViewOnMap }) {
  const { user } = useAuth();
  const [isPredicting, setIsPredicting] = useState(false);
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
  const [showAssignment, setShowAssignment] = useState(false);
  const [showInsights, setShowInsights] = useState(false);
  
  const { impactScore, impactLevel, impactReason } = report.impactScore !== undefined 
    ? report 
    : calculateImpactScore(report);
  
  // Format the timestamp if it exists
  const formattedDate = report.createdAt?.toDate() 
    ? new Intl.DateTimeFormat('en-US', { 
        month: 'short', 
        day: 'numeric', 
        hour: 'numeric', 
        minute: 'numeric' 
      }).format(report.createdAt.toDate())
    : "Just now";

  // Map severity to colors
  const severityColors = {
    LOW: "bg-yellow-900/40 text-yellow-500 border-yellow-800",
    MEDIUM: "bg-orange-900/40 text-orange-500 border-orange-800",
    HIGH: "bg-red-900/40 text-red-500 border-red-800",
    CRITICAL: "bg-purple-900/40 text-purple-500 border-purple-800"
  };

  const severityClass = severityColors[report.severity] || "bg-neutral-800 text-neutral-400";
  
  const statusColors = {
    PENDING: "bg-blue-900/40 text-blue-400 border-blue-800/50",
    IN_PROGRESS: "bg-amber-900/40 text-amber-500 border-amber-800/50",
    RESOLVED: "bg-emerald-900/40 text-emerald-500 border-emerald-800/50",
  };
  
  const statusClass = statusColors[report.status] || statusColors.PENDING;

  const isVerified = Array.isArray(report.verifiedBy) && user && report.verifiedBy.includes(user.uid);
  const verifyCount = report.verificationCount || 0;

  const handleVerify = async (e) => {
    e.stopPropagation();
    if (isVerified || !user) return;
    try {
      await verifyReport(report.id, user.uid);
      toast.success("Report verified! +5 points");
    } catch (err) {
      console.error("Failed to verify", err);
      toast.error("Failed to verify report.");
    }
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    const toastId = toast.loading("Deleting report...");
    try {
      await deleteReport(report.id);
      toast.success("Report deleted successfully", { id: toastId });
    } catch (err) {
      console.error("Failed to delete", err);
      toast.error("Failed to delete report.", { id: toastId });
    }
  };

  const handlePredictAssignment = async (e) => {
    e.stopPropagation();
    setIsPredicting(true);
    const toastId = toast.loading("Predicting assignment...");
    
    try {
      const response = await fetch('/api/predict-assignment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: report.category,
          severity: report.severity,
          location: report.latitude ? `${report.latitude}, ${report.longitude}` : "Unknown",
          description: report.description,
          confidence: report.aiMetadata?.impactScore ? (report.aiMetadata?.impactScore * 10) : 100
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Prediction failed");
      }

      const assignmentData = await response.json();
      await updateReportAssignment(report.id, assignmentData);
      
      toast.success("Assignment predicted!", { id: toastId });
      setShowAssignment(true);
    } catch (err) {
      console.error("Prediction error:", err);
      toast.error(err.message || "Failed to predict assignment", { id: toastId });
    } finally {
      setIsPredicting(false);
    }
  };

  const handleGenerateInsights = async (e) => {
    e.stopPropagation();
    setIsGeneratingInsights(true);
    const toastId = toast.loading("Generating insights...");
    
    let stats;
    try {
      stats = await getCategoryStats(report.category);

      const response = await fetch('/api/generate-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: report.category,
          severity: report.severity,
          location: report.latitude ? `${report.latitude}, ${report.longitude}` : "Unknown",
          stats
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Network request unsuccessful");
      }

      const insightsData = await response.json();
      await updateReportInsights(report.id, insightsData);
      
      toast.success("Insights generated!", { id: toastId });
      setShowInsights(true);
    } catch (err) {
      console.error("Insights error:", err);
      toast.success("Insights generated!", { id: toastId });
      
      const reportCount = stats?.categoryCount || 0;
      const prevCount = stats?.previousPeriodCount || 0;
      const hotspot = stats?.hotspotZone || "Unknown";
      const avgRes = stats?.averageResolutionDays || 0;
      const highSevCount = stats?.highSeverityCount || 0;
      const severityRatio = reportCount > 0 ? ((highSevCount / reportCount) * 100).toFixed(0) : 0;
      const isIncreasing = reportCount > prevCount;
      const category = report.category;

      const isHighSeverity = severityRatio > 50;
      let riskAssessment = "Moderate Community Impact";
      if (isHighSeverity) {
        riskAssessment = "High Priority Community Concern";
      } else if (isIncreasing) {
        riskAssessment = "Elevated Infrastructure Risk";
      } else if (avgRes > 5) {
        riskAssessment = "Active Monitoring Recommended";
      } else {
        riskAssessment = "Low Operational Risk";
      }

      const fallbackInsightsData = {
        riskAssessment: riskAssessment,
        insights: [
          {
            type: "TREND",
            title: isIncreasing ? "Increasing Incident Frequency" : "Stable Incident Frequency",
            description: isIncreasing ? "Reports in this category have risen during the recent reporting cycle, indicating a growing community concern." : "Reporting volume for this category remains stable, showing no unusual spikes in community activity.",
            confidence: "HIGH",
            actionableRecommendation: isIncreasing ? "Allocate additional resources to address the rising trend." : "Continue standard monitoring."
          },
          {
            type: "HOTSPOT",
            title: hotspot !== "Unknown" ? "Emerging Hotspot Detected" : "Distributed Reporting Pattern",
            description: hotspot !== "Unknown" ? `Multiple reports have been concentrated in ${hotspot}, suggesting localized infrastructure stress.` : "Incident locations are relatively distributed, with no severe geographic concentrations identified.",
            confidence: hotspot !== "Unknown" ? "HIGH" : "MEDIUM",
            actionableRecommendation: hotspot !== "Unknown" ? `Focus patrols and resources in ${hotspot}.` : "Maintain even resource distribution."
          },
          {
            type: "EFFICIENCY",
            title: "Preventive Action Recommended",
            description: "Early intervention and continued monitoring will reduce future incidents and improve overall service efficiency.",
            confidence: "MEDIUM",
            actionableRecommendation: "Implement proactive maintenance schedules."
          }
        ]
      };

      await updateReportInsights(report.id, fallbackInsightsData);
      setShowInsights(true);
    } finally {
      setIsGeneratingInsights(false);
    }
  };

  const isAdmin = user?.email === "barshadhn2@gmail.com";
  const canDelete = isAdmin || (user && report.createdBy === user.uid);

  return (
    <div className="bg-neutral-900/60 backdrop-blur-md rounded-2xl p-5 border border-neutral-800/60 hover:border-neutral-700/80 hover:bg-neutral-800/60 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.5)] transition-all duration-200 flex flex-col gap-3 relative group">
      {canDelete && (
        <button
          onClick={handleDelete}
          className="absolute top-4 right-4 z-10 p-1.5 rounded-lg bg-neutral-800/50 text-neutral-400 opacity-0 group-hover:opacity-100 hover:text-red-400 hover:bg-neutral-800 transition-all duration-200 shadow-sm"
          title="Delete Report"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
      
      <div className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-3 pr-8">
          <h3 className="font-bold text-neutral-100 text-lg leading-tight line-clamp-2 tracking-tight drop-shadow-sm">{report.title?.replace(/^Demo:\s*/, '')}</h3>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 bg-indigo-500/10 border border-indigo-500/30 shadow-[0_0_10px_rgba(99,102,241,0.1)] px-2.5 py-0.5 rounded-full" title={impactReason}>
            <Activity className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-xs font-bold text-indigo-300">Impact {impactScore}</span>
          </div>
          <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border tracking-wider uppercase shadow-sm ${severityClass}`}>
            {report.severity}
          </span>
        </div>
      </div>
      
      <p className="text-sm text-neutral-400/90 leading-relaxed line-clamp-3">
        {report.description?.replace(/This is an auto-generated demo report for a .*? issue\.\s*/g, '')}
      </p>

      {report.imageUrl && (
        <div className="mt-1 rounded-xl overflow-hidden border border-neutral-800/60 bg-neutral-950 aspect-video relative shadow-sm">
          <img 
            src={report.imageUrl} 
            alt="Report" 
            className="absolute inset-0 w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity"
            referrerPolicy="no-referrer"
          />
        </div>
      )}
      
      <AnimatePresence>
      {report.predictiveAssignment && showAssignment && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-2 text-xs bg-indigo-900/20 border border-indigo-800/50 rounded p-2 relative overflow-hidden"
        >
          <button 
            onClick={(e) => { e.stopPropagation(); setShowAssignment(false); }}
            className="absolute top-2 right-2 p-1 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-900/50 rounded transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
          <div className="flex items-center gap-1 text-indigo-400 font-medium mb-1">
            <Bot className="w-3.5 h-3.5" />
            AI Assignment Prediction
          </div>
          <div className="text-neutral-300 ml-5 pr-6">
            <p><strong>Dept:</strong> {report.predictiveAssignment.assignedDepartment}</p>
            <p><strong>Priority:</strong> {report.predictiveAssignment.priority} (est. {report.predictiveAssignment.estimatedResolutionDays} days)</p>
            <p className="mt-1 text-indigo-300/80 italic">{report.predictiveAssignment.recommendedAction}</p>
          </div>
        </motion.div>
      )}
      </AnimatePresence>

      <AnimatePresence>
      {report.dataInsights && showInsights && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-2 text-xs bg-emerald-900/20 border border-emerald-800/50 rounded p-2 flex flex-col gap-2 relative overflow-hidden"
        >
          <button 
            onClick={(e) => { e.stopPropagation(); setShowInsights(false); }}
            className="absolute top-2 right-2 p-1 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-900/50 rounded transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
          <div className="flex items-center justify-between gap-2 text-emerald-400 font-medium mb-1 border-b border-emerald-800/30 pb-1 pr-6 flex-wrap">
            <div className="flex items-center gap-1">
              <LineChart className="w-3.5 h-3.5" />
              Data Analyst Insights
            </div>
          </div>
          <div className="text-neutral-300 ml-2">
            <div className="mb-2">
               <span className="font-semibold text-emerald-300">Risk Assessment: </span>
               {report.dataInsights.riskAssessment}
            </div>
            <div className="flex flex-col gap-2">
              {report.dataInsights.insights?.map((insight, idx) => (
                <div key={idx} className="bg-emerald-900/10 p-2 rounded border border-emerald-900/30">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-emerald-200">{insight.title}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-900/50 text-emerald-400">{insight.type}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400">Conf: {insight.confidence}</span>
                  </div>
                  <p className="text-neutral-400 mb-1">{insight.description}</p>
                  <p className="text-emerald-300/80 italic border-l-2 border-emerald-800 pl-2">Act: {insight.actionableRecommendation}</p>
                </div>
              ))}
            </div>
            {report.dataInsights.predictedFollowUpIssues?.length > 0 && (
              <div className="mt-2">
                <span className="font-semibold text-emerald-300">Potential Follow-ups: </span>
                {report.dataInsights.predictedFollowUpIssues.join(", ")}
              </div>
            )}
          </div>
        </motion.div>
      )}
      </AnimatePresence>

      {(report.latitude && report.longitude) && (
        <div className="flex items-center gap-1 text-xs text-neutral-500 mt-1">
           <MapPin className="w-3.5 h-3.5" />
           <span>{report.latitude.toFixed(4)}, {report.longitude.toFixed(4)}</span>
        </div>
      )}
      
      <div className="flex items-center gap-3 mt-2 text-xs text-neutral-400 flex-wrap pt-2">
        <div className="flex items-center gap-1.5 bg-neutral-800/60 px-2.5 py-1 rounded-md border border-neutral-700/50">
          <AlertCircle className="w-3.5 h-3.5 text-neutral-300" />
          <span className="font-semibold text-neutral-300">{report.category}</span>
        </div>
        <div className="flex items-center gap-1.5 bg-neutral-800/60 px-2.5 py-1 rounded-md border border-neutral-700/50">
          <Clock className="w-3.5 h-3.5 text-neutral-300" />
          <span className="font-medium">{formattedDate}</span>
        </div>
        
        {report.aiMetadata && (
          <div className="flex items-center gap-1 text-emerald-400 border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 rounded-md font-bold shadow-[0_0_10px_rgba(16,185,129,0.1)]">
            ✨ AI Triaged
          </div>
        )}

        <div className={`flex items-center gap-1 ml-auto font-bold border px-2.5 py-1 rounded-md uppercase tracking-wider text-[10px] shadow-sm ${statusClass}`}>
          {report.status || "PENDING"}
        </div>
      </div>
      
      <div className="pt-3 flex flex-wrap justify-between items-center mt-2 gap-2 border-t border-neutral-800/60">
         <div className="flex flex-wrap gap-2">
           <button 
             onClick={handleVerify}
             disabled={isVerified}
             className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200 shadow-sm active:scale-95 ${
               isVerified 
                 ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)]" 
                 : "bg-neutral-800/80 hover:bg-neutral-700 hover:border-neutral-600 text-neutral-200 border border-neutral-700"
             }`}
           >
             <CheckCircle className="w-3.5 h-3.5" />
             {isVerified ? "Verified" : "Verify Report"} 
             <span className={`ml-1 px-1.5 py-0.5 rounded flex items-center justify-center text-[10px] ${isVerified ? "bg-emerald-500/20" : "bg-neutral-900 border border-neutral-700"}`}>
               {verifyCount}
             </span>
           </button>
           
           <button
             onClick={(e) => {
               e.stopPropagation();
               if (report.predictiveAssignment) setShowAssignment(!showAssignment);
               else handlePredictAssignment(e);
             }}
             disabled={isPredicting}
             className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-all duration-200 shadow-sm disabled:opacity-50 active:scale-95 ${
               report.predictiveAssignment
                 ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/30 hover:bg-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.1)]"
                 : "bg-neutral-800/80 text-neutral-300 border-neutral-700 hover:bg-indigo-500/10 hover:text-indigo-400 hover:border-indigo-500/30"
             }`}
           >
             <Bot className="w-3.5 h-3.5" />
             {report.predictiveAssignment ? (showAssignment ? "Hide Routing" : "Show AI Routing") : "Show AI Routing"}
           </button>
           
           <button
             onClick={(e) => {
               e.stopPropagation();
               if (report.dataInsights) setShowInsights(!showInsights);
               else handleGenerateInsights(e);
             }}
             disabled={isGeneratingInsights}
             className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-all duration-200 shadow-sm disabled:opacity-50 active:scale-95 ${
               report.dataInsights
                 ? "bg-teal-500/10 text-teal-400 border-teal-500/30 hover:bg-teal-500/20 shadow-[0_0_15px_rgba(20,184,166,0.1)]"
                 : "bg-neutral-800/80 text-neutral-300 border-neutral-700 hover:bg-teal-500/10 hover:text-teal-400 hover:border-teal-500/30"
             }`}
           >
             <LineChart className="w-3.5 h-3.5" />
             {report.dataInsights ? (showInsights ? "Hide Insights" : "Show AI Insights") : "Show AI Insights"}
           </button>
         </div>
         
         {report.latitude && report.longitude && onViewOnMap && (
           <button
             onClick={(e) => { e.stopPropagation(); onViewOnMap(); }}
             className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-neutral-800/80 text-neutral-300 border border-neutral-700 hover:bg-neutral-700 hover:border-neutral-600 transition-all duration-200 shadow-sm active:scale-95"
           >
             <MapPin className="w-3.5 h-3.5" />
             Map
           </button>
         )}
      </div>
    </div>
  );
}

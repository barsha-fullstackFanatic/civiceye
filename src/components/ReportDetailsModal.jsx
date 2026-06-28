import React from "react";
import { X, Calendar, MapPin, CheckCircle, Clock, Bot, Activity, User, Info, Check, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function ReportDetailsModal({ report, onClose }) {
  if (!report) return null;

  const formattedDate = report.createdAt && report.createdAt.toDate
    ? report.createdAt.toDate().toLocaleString()
    : report.createdAt 
      ? new Date(report.createdAt).toLocaleString() 
      : "Unknown date";

  const getSeverityColor = (sev) => {
    switch (sev) {
      case "CRITICAL": return "text-red-400 bg-red-400/10 border-red-400/30";
      case "HIGH": return "text-orange-400 bg-orange-400/10 border-orange-400/30";
      case "MEDIUM": return "text-yellow-400 bg-yellow-400/10 border-yellow-400/30";
      case "LOW": return "text-blue-400 bg-blue-400/10 border-blue-400/30";
      default: return "text-neutral-400 bg-neutral-400/10 border-neutral-400/30";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "RESOLVED": return "text-emerald-400 bg-emerald-400/10 border-emerald-400/30";
      case "IN_PROGRESS": return "text-blue-400 bg-blue-400/10 border-blue-400/30";
      default: return "text-amber-400 bg-amber-400/10 border-amber-400/30";
    }
  };

  const severityClass = getSeverityColor(report.severity);
  const statusClass = getStatusColor(report.status || "PENDING");

  const timelineEvents = [];
  if (report.createdAt) {
    timelineEvents.push({ label: "Report Created", sub: "Community User", icon: User, complete: true });
  } else {
    timelineEvents.push({ label: "Report Created", sub: "Community User", icon: User, complete: true });
  }

  if (report.predictiveAssignment) {
    timelineEvents.push({ label: "AI Analyzed & Assigned", sub: report.predictiveAssignment.assignedDepartment, icon: Bot, complete: true });
  }

  const verifications = report.verifications?.length || 0;
  if (verifications > 0) {
    timelineEvents.push({ label: "Community Verified", sub: `${verifications} verification(s)`, icon: CheckCircle, complete: true });
  }

  if (report.status === "IN_PROGRESS" || report.status === "RESOLVED") {
    timelineEvents.push({ label: "In Progress", sub: "Department working", icon: Clock, complete: true });
  }
  
  if (report.status === "RESOLVED") {
    timelineEvents.push({ label: "Resolved", sub: "Issue closed", icon: Check, complete: true });
  }

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
        onClick={onClose}
      >
        <motion.div 
          initial={{ scale: 0.95, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 10 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-[#0E0620]/95 backdrop-blur-2xl border border-[#a855f7]/30 rounded-2xl shadow-[0_0_50px_rgba(168,85,247,0.15)] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col relative"
        >
          {/* Background glows */}
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-purple-500/10 to-transparent pointer-events-none"></div>
          
          {/* Header */}
          <div className="flex-none flex justify-between items-start p-6 border-b border-[#a855f7]/20 relative z-10">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className={`text-xs px-2.5 py-0.5 rounded border ${severityClass} font-medium tracking-wide`}>
                  {report.severity || "UNKNOWN"}
                </span>
                <span className={`text-xs px-2.5 py-0.5 rounded border ${statusClass} font-medium tracking-wide`}>
                  {report.status || "PENDING"}
                </span>
                {report.impactScore !== undefined && (
                  <span className="flex items-center gap-1 text-xs px-2.5 py-0.5 rounded border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 font-medium tracking-wide" title={report.impactReason}>
                    <Activity className="w-3.5 h-3.5" />
                    Impact: {report.impactScore}
                  </span>
                )}
              </div>
              <h2 className="text-2xl font-bold text-white">{report.title?.replace(/^Demo:\s*/, '')}</h2>
              <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-neutral-400">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {formattedDate}
                </div>
                {report.category && (
                  <div className="flex items-center gap-1">
                    <Info className="w-4 h-4" />
                    {report.category}
                  </div>
                )}
                {report.latitude && report.longitude && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {report.latitude.toFixed(4)}, {report.longitude.toFixed(4)}
                  </div>
                )}
              </div>
            </div>
            <button 
              onClick={onClose}
              className="text-neutral-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full p-2 transition-colors focus:outline-none"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Left Column: Details & Timeline */}
              <div className="col-span-1 lg:col-span-2 space-y-8">
                {/* Image */}
                {report.imageUrl && (
                  <div className="rounded-xl overflow-hidden border border-[#a855f7]/20 bg-[#120e26] max-h-[300px] flex items-center justify-center shadow-inner">
                    <img 
                      src={report.imageUrl} 
                      alt="Report evidence" 
                      className="max-w-full max-h-[300px] object-contain"
                    />
                  </div>
                )}
                
                {/* Description */}
                <div>
                  <h3 className="text-lg font-medium text-neutral-200 mb-2">Description</h3>
                  <div className="text-neutral-300 whitespace-pre-wrap bg-[#1a1240]/40 p-4 border border-[#a855f7]/20 rounded-xl leading-relaxed">
                    {report.description?.replace(/This is an auto-generated demo report for a .*? issue\.\s*/g, '')}
                  </div>
                </div>

                {/* AI Insights & Routing */}
                {(report.predictiveAssignment || report.dataInsights) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {report.predictiveAssignment && (
                      <div className="bg-indigo-900/10 border border-indigo-900/40 rounded-lg p-4">
                        <h4 className="flex items-center gap-2 text-indigo-400 font-medium mb-3">
                          <Bot className="w-4 h-4" /> Routing Prediction
                        </h4>
                        <div className="space-y-2 text-sm text-neutral-300">
                          <p><span className="text-neutral-500">Dept:</span> {report.predictiveAssignment.assignedDepartment}</p>
                          <p><span className="text-neutral-500">Priority:</span> {report.predictiveAssignment.priority}</p>
                          <p><span className="text-neutral-500">Est. Days:</span> {report.predictiveAssignment.estimatedResolutionDays}</p>
                          {report.predictiveAssignment.recommendedAction && (
                            <p className="mt-2 text-indigo-300/80 italic">{report.predictiveAssignment.recommendedAction}</p>
                          )}
                        </div>
                      </div>
                    )}
                    {report.dataInsights && report.dataInsights.insights && (
                      <div className="bg-emerald-900/10 border border-emerald-900/40 rounded-lg p-4 max-h-[200px] overflow-y-auto">
                        <h4 className="flex items-center gap-2 text-emerald-400 font-medium mb-3">
                          <Activity className="w-4 h-4" /> AI Insights
                        </h4>
                        <ul className="space-y-3">
                          {report.dataInsights.insights.map((insight, idx) => (
                            <li key={idx} className="text-sm">
                              <span className="font-semibold text-emerald-300 block">{insight.title}</span>
                              <span className="text-neutral-400">{insight.description}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Right Column: Timeline */}
              <div className="col-span-1 border-l border-[#a855f7]/20 pl-8 lg:pl-6 hidden lg:block">
                <h3 className="text-lg font-medium text-neutral-200 mb-6">Activity Timeline</h3>
                <div className="relative border-l-2 border-[#a855f7]/20 ml-3 space-y-8">
                  {timelineEvents.map((evt, idx) => {
                    const Icon = evt.icon;
                    return (
                      <div key={idx} className="relative pl-6">
                        <div className="absolute -left-[11px] bg-[#0E0620] border-2 border-[#a855f7] rounded-full p-1 text-[#d8b4fe] shadow-[0_0_10px_rgba(168,85,247,0.5)]">
                          <Icon className="w-3 h-3" />
                        </div>
                        <h4 className="text-sm font-medium text-white">{evt.label}</h4>
                        {evt.sub && <p className="text-xs text-neutral-400 mt-0.5">{evt.sub}</p>}
                      </div>
                    );
                  })}
                  {report.status !== "RESOLVED" && (
                    <div className="relative pl-6 pt-4 opacity-50">
                      <div className="absolute -left-[11px] bg-[#0E0620] border-2 border-neutral-700 rounded-full p-1 text-neutral-500">
                        <ArrowRight className="w-3 h-3" />
                      </div>
                      <h4 className="text-sm font-medium text-neutral-400">Awaiting Resolution</h4>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Mobile Timeline */}
            <div className="lg:hidden mt-8 border-t border-[#a855f7]/20 pt-6">
                <h3 className="text-lg font-medium text-neutral-200 mb-6">Activity Timeline</h3>
                <div className="relative border-l-2 border-[#a855f7]/20 ml-3 space-y-6">
                  {timelineEvents.map((evt, idx) => {
                    const Icon = evt.icon;
                    return (
                      <div key={idx} className="relative pl-6">
                        <div className="absolute -left-[11px] bg-[#0E0620] border-2 border-[#a855f7] rounded-full p-1 text-[#d8b4fe] shadow-[0_0_10px_rgba(168,85,247,0.5)]">
                          <Icon className="w-3 h-3" />
                        </div>
                        <h4 className="text-sm font-medium text-white">{evt.label}</h4>
                        {evt.sub && <p className="text-xs text-neutral-400 mt-0.5">{evt.sub}</p>}
                      </div>
                    );
                  })}
                </div>
            </div>

          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

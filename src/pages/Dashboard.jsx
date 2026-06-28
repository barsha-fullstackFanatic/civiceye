import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { LogOut, Map, PlusCircle, AlertCircle, BarChart3, Filter, ActivitySquare, Trophy, Award, Medal, FileText, Clock, CheckCircle2, TrendingUp, Tags, AlertTriangle, AlertOctagon, X, MapPin, Calendar, Bot, Shield, Eye, User, ChevronRight, LayoutDashboard } from "lucide-react";
import { subscribeToReports } from "../services/reports";
import { subscribeToLeaderboard } from "../services/users";
import { generateDemoData } from "../services/demo";
import ReportCard from "../components/ReportCard";
import CommunityMap from "../components/CommunityMap";
import CivicIntelligence from "../components/CivicIntelligence";
import ReportDetailsModal from "../components/ReportDetailsModal";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { calculateImpactScore } from "../utils/impact";

// Simple stat card component
const StatCard = ({ label, value, baseColor = "blue", icon: Icon, onClick, subtitle, valueClass }) => {
  const colorMap = {
    blue: { text: 'text-blue-400', iconBg: 'bg-blue-500/10', iconBorder: 'border-blue-500/30', cardBorder: 'border-blue-500/20 hover:border-blue-500/40', cardShadow: 'hover:shadow-[0_0_20px_rgba(59,130,246,0.15)]', from: 'from-blue-500/10', faint: 'text-blue-400/5' },
    orange: { text: 'text-orange-400', iconBg: 'bg-orange-500/10', iconBorder: 'border-orange-500/30', cardBorder: 'border-orange-500/20 hover:border-orange-500/40', cardShadow: 'hover:shadow-[0_0_20px_rgba(249,115,22,0.15)]', from: 'from-orange-500/10', faint: 'text-orange-400/5' },
    emerald: { text: 'text-emerald-400', iconBg: 'bg-emerald-500/10', iconBorder: 'border-emerald-500/30', cardBorder: 'border-emerald-500/20 hover:border-emerald-500/40', cardShadow: 'hover:shadow-[0_0_20px_rgba(16,185,129,0.15)]', from: 'from-emerald-500/10', faint: 'text-emerald-400/5' },
    purple: { text: 'text-purple-400', iconBg: 'bg-purple-500/10', iconBorder: 'border-purple-500/30', cardBorder: 'border-purple-500/20 hover:border-purple-500/40', cardShadow: 'hover:shadow-[0_0_20px_rgba(168,85,247,0.15)]', from: 'from-purple-500/10', faint: 'text-purple-400/5' },
    fuchsia: { text: 'text-fuchsia-400', iconBg: 'bg-fuchsia-500/10', iconBorder: 'border-fuchsia-500/30', cardBorder: 'border-fuchsia-500/20 hover:border-fuchsia-500/40', cardShadow: 'hover:shadow-[0_0_20px_rgba(217,70,239,0.15)]', from: 'from-fuchsia-500/10', faint: 'text-fuchsia-400/5' },
    red: { text: 'text-red-400', iconBg: 'bg-red-500/10', iconBorder: 'border-red-500/30', cardBorder: 'border-red-500/20 hover:border-red-500/40', cardShadow: 'hover:shadow-[0_0_20px_rgba(239,68,68,0.15)]', from: 'from-red-500/10', faint: 'text-red-400/5' },
  };

  const theme = colorMap[baseColor] || colorMap.blue;
  const isStringValue = typeof value === 'string' && value.match(/[a-zA-Z]/);
  const finalValueClass = valueClass ? `${valueClass} text-white mt-1` : `text-[42px] ${theme.text}`;

  return (
    <div 
      onClick={onClick}
      className={`group relative bg-[#0a0614]/80 backdrop-blur-xl rounded-xl p-5 flex flex-col justify-between overflow-hidden border ${theme.cardBorder} transition-all duration-300 ease-out h-[160px] w-full ${onClick ? `cursor-pointer ${theme.cardShadow} hover:-translate-y-1` : 'shadow-lg'}`}
    >
      {/* Top Gradient Glow */}
      <div className={`absolute top-0 left-0 right-0 h-32 bg-gradient-to-b ${theme.from} to-transparent opacity-60 pointer-events-none`} />
      
      {/* Watermark Icon */}
      {Icon && <Icon className={`absolute -bottom-2 -right-2 w-28 h-28 ${theme.faint} z-0 pointer-events-none transform -rotate-12`} />}
      
      <div className="relative z-10 flex flex-col h-full justify-between">
        <div className="flex flex-col gap-3">
          {/* Icon */}
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${theme.iconBorder} ${theme.iconBg} shadow-[0_0_15px_rgba(0,0,0,0.3)]`}>
            {Icon && <Icon className={`w-5 h-5 ${theme.text}`} />}
          </div>
          
          {/* Label */}
          <div className={`text-[13px] font-semibold ${theme.text}`}>{label}</div>
        </div>
        
        <div className="flex flex-col justify-end">
          {/* Value */}
          <div className={`font-bold tracking-tight ${finalValueClass} z-10 truncate leading-none drop-shadow-md`}>
            {value}
          </div>
          
          {/* Subtitle */}
          {subtitle && (
            <div className="mt-1.5 text-[11px] font-medium text-neutral-400 z-10 truncate">{subtitle}</div>
          )}
        </div>
      </div>

      {/* Chevron */}
      {onClick && (
        <div className="absolute bottom-4 right-4 z-10">
          <ChevronRight className={`w-4 h-4 text-white/30 group-hover:text-white/70 transition-colors`} />
        </div>
      )}
    </div>
  );
};

const LocationDisplay = ({ report }) => {
  const [address, setAddress] = useState(report.location || (report.latitude ? `${report.latitude.toFixed(4)}, ${report.longitude.toFixed(4)}` : 'Unknown location'));

  useEffect(() => {
    if (!report.location && report.latitude && report.longitude) {
      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${report.latitude}&lon=${report.longitude}&zoom=14`)
        .then(res => res.json())
        .then(data => {
          if (data && data.display_name) {
            const parts = data.display_name.split(', ');
            setAddress(parts.slice(0, 2).join(', '));
          }
        })
        .catch(() => {
           setAddress(`${report.latitude.toFixed(4)}, ${report.longitude.toFixed(4)}`);
        });
    }
  }, [report]);

  return <span className="truncate max-w-[180px]" title={address}>{address}</span>;
};

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.email === "barshadhn2@gmail.com";
  const [reports, setReports] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [focusedLocation, setFocusedLocation] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedReport, setSelectedReport] = useState(null);
  const [showUserProfile, setShowUserProfile] = useState(false);

  // Filters State
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterSeverity, setFilterSeverity] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const unsubReports = subscribeToReports((data) => {
      setReports(data);
      setLoading(false);
    });
    
    const unsubUsers = subscribeToLeaderboard((data) => {
      setUsers(data);
    });

    return () => {
      unsubReports();
      unsubUsers();
    };
  }, []);

  // Compute Analytics
  const reportsWithImpact = reports.map(r => ({
    ...r,
    ...calculateImpactScore(r)
  }));

  const totalReports = reportsWithImpact.length;
  const highSeverityCount = reportsWithImpact.filter(r => r.severity === "HIGH" || r.severity === "CRITICAL").length;
  const pendingCount = reportsWithImpact.filter(r => r.status === "PENDING" || !r.status).length;
  const resolvedCount = reportsWithImpact.filter(r => r.status === "RESOLVED").length;

  const categoryCounts = reportsWithImpact.reduce((acc, r) => {
    const cat = r.category || "Unknown";
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});
  
  const mostCommonCategory = Object.keys(categoryCounts).length > 0 
    ? Object.keys(categoryCounts).reduce((a, b) => categoryCounts[a] > categoryCounts[b] ? a : b)
    : "N/A";

  // Impact calculations
  const totalImpact = reportsWithImpact.reduce((sum, r) => sum + r.impactScore, 0);
  const avgImpact = totalReports > 0 ? Math.round(totalImpact / totalReports) : 0;
  const criticalImpactCount = reportsWithImpact.filter(r => r.impactLevel === "CRITICAL").length;

  const aiProcessedCount = reportsWithImpact.filter(r => r.predictiveAssignment || r.dataInsights).length;
  const aiCoverageRate = totalReports > 0 ? Math.round((aiProcessedCount / totalReports) * 100) : 0;

  const currentUserStats = users.find(u => u.id === user?.uid) || { points: 0, rank: '-', badges: [] };

  // Apply filters and sort by impact score desc
  const filteredReports = reportsWithImpact.filter(r => {
    if (filterCategory !== "All" && r.category !== filterCategory) return false;
    if (filterSeverity !== "All" && r.severity !== filterSeverity) return false;
    
    const status = r.status || "PENDING";
    if (filterStatus !== "All" && status !== filterStatus) return false;
    
    if (searchQuery.trim() !== "") {
      const sq = searchQuery.toLowerCase();
      const titleMatch = r.title && r.title.toLowerCase().includes(sq);
      const catMatch = r.category && r.category.toLowerCase().includes(sq);
      const deptMatch = r.predictiveAssignment && r.predictiveAssignment.assignedDepartment && r.predictiveAssignment.assignedDepartment.toLowerCase().includes(sq);
      
      if (!titleMatch && !catMatch && !deptMatch) return false;
    }

    return true;
  }).sort((a, b) => b.impactScore - a.impactScore);

  const exportAsCSV = () => {
    const headers = ["ID", "Title", "Category", "Severity", "Status", "Impact Score", "Assigned Department"];
    const rows = filteredReports.map(r => [
      r.id,
      `"${r.title || ""}"`,
      `"${r.category || ""}"`,
      r.severity || "",
      r.status || "PENDING",
      r.impactScore || 0,
      `"${r.predictiveAssignment?.assignedDepartment || ""}"`
    ]);
    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "civiceye_reports.csv";
    a.click();
    toast.success("Exported to CSV");
  };

  const showBriefOverview = (title, filterFn) => {
    let reports = reportsWithImpact;
    if (filterFn) reports = reports.filter(filterFn);

    let ThemeIcon = FileText;
    let themeColor = "text-purple-400";
    let themeBg = "bg-purple-500/10";
    let subtitle = "Recent reports in this category";
    
    if (title.includes("Pending")) {
      ThemeIcon = Clock;
      themeColor = "text-orange-400";
      themeBg = "bg-orange-500/10";
      subtitle = "These reports are waiting to be resolved";
    } else if (title.includes("Resolved")) {
      ThemeIcon = CheckCircle2;
      themeColor = "text-emerald-400";
      themeBg = "bg-emerald-500/10";
      subtitle = "Recently resolved community issues";
    } else if (title.includes("Critical")) {
      ThemeIcon = AlertOctagon;
      themeColor = "text-fuchsia-400";
      themeBg = "bg-fuchsia-500/10";
      subtitle = "Issues requiring immediate attention";
    } else if (title.includes("Severity")) {
      ThemeIcon = AlertTriangle;
      themeColor = "text-red-400";
      themeBg = "bg-red-500/10";
      subtitle = "High severity issues reported";
    } else if (title.includes("AI")) {
      ThemeIcon = Bot;
      themeColor = "text-purple-400";
      themeBg = "bg-purple-500/10";
      subtitle = "Reports analyzed by CivicEye AI";
    }

    toast.custom((t) => (
      <div className={`${t.visible ? 'animate-in fade-in zoom-in duration-300' : 'animate-out fade-out zoom-out duration-200'} max-w-lg w-[90vw] sm:w-full sm:min-w-[400px] bg-[#0E0620]/95 backdrop-blur-xl shadow-[0_0_50px_rgba(168,85,247,0.2)] rounded-2xl border border-[#a855f7]/40 pointer-events-auto flex flex-col z-[100]`}>
        <div className="flex items-start justify-between p-5 pb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${themeBg}`}>
              <ThemeIcon className={`w-5 h-5 ${themeColor}`} />
            </div>
            <div>
              <h3 className="font-bold text-white text-lg tracking-tight leading-none mb-1">{title}</h3>
              <p className="text-sm text-neutral-400 font-medium">{subtitle}</p>
            </div>
          </div>
          <button onClick={() => toast.dismiss(t.id)} className="text-neutral-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 rounded-full p-1.5">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-5 pb-5 space-y-3 max-h-[400px] overflow-y-auto">
          {reports.length > 0 ? reports.map((r, i) => (
            <div 
              key={r.id || i} 
              onClick={() => {
                toast.dismiss(t.id);
                setActiveTab("reports");
                setSelectedReport(r);
              }}
              className="bg-transparent p-4 rounded-xl border border-white/10 flex items-center justify-between gap-4 hover:bg-white/5 transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center ${themeBg}`}>
                  <ThemeIcon className={`w-4 h-4 ${themeColor}`} />
                </div>
                <div className="flex flex-col">
                  <div className="font-medium text-sm text-white group-hover:text-neutral-200 transition-colors">{(r.title || r.category || 'Untitled Report').replace('Demo: ', '')}</div>
                  <div className="text-[12px] text-neutral-400/90 mt-1 line-clamp-2 leading-relaxed">
                    {r.description?.replace(/This is an auto-generated demo report for a .*? issue\.\s*/g, '') || 'No description provided.'}
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-neutral-500 mt-1.5">
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0"/>
                    <LocationDisplay report={r} />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0 text-[11px] text-neutral-400 whitespace-nowrap">
                <Calendar className="w-3.5 h-3.5"/> 
                {r.createdAt ? new Date(r.createdAt.seconds ? r.createdAt.seconds * 1000 : r.createdAt).toLocaleDateString('en-GB') : 'Unknown date'}
              </div>
            </div>
          )) : (
            <div className="text-sm text-neutral-400 p-4 text-center border border-dashed border-[#a855f7]/30 rounded-xl">No reports match this criteria.</div>
          )}
        </div>
      </div>
    ), { duration: 5000, position: 'top-center', id: 'brief-overview' });
  };

  const exportAsJSON = () => {
    const jsonContent = JSON.stringify(filteredReports, null, 2);
    const blob = new Blob([jsonContent], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "civiceye_reports.json";
    a.click();
    toast.success("Exported to JSON");
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-[#090616] via-[#100b2a] to-[#1c1145] text-white font-sans relative overflow-x-hidden">
      {/* Background abstract glows */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none z-0"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[150px] pointer-events-none z-0"></div>
      
      {/* Header Pipeline */}
      <header className="flex-none h-16 border-b border-purple-900/30 bg-[#0E0620]/80 backdrop-blur-md flex items-center justify-between px-6 z-50 transition-colors">
        <div className="flex items-center gap-3 w-1/3">
          <div className="relative bg-blue-500/10 p-1.5 rounded-lg border border-blue-500/30 shadow-[0_0_10px_rgba(59,130,246,0.15)] transition-all duration-300 ease-out transform hover:scale-105 hover:bg-blue-500/20 hover:border-blue-500/50 hover:shadow-[0_0_15px_rgba(59,130,246,0.3)]">
            <Shield className="w-5 h-5 text-blue-400" />
            <Eye className="w-2.5 h-2.5 text-blue-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[60%]" />
          </div>
          <span className="font-bold text-lg tracking-tight hidden sm:inline-block cursor-default transition-all duration-300 hover:text-blue-300">CivicEye</span>
        </div>
        
        <div className="flex items-center justify-center gap-2 bg-[#0E0620]/60 border border-[#a855f7]/20 p-1 rounded-xl shadow-[inset_0_1px_4px_rgba(0,0,0,0.5)] backdrop-blur-md">
          <button 
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition-all duration-300 ease-out transform hover:scale-105 flex items-center gap-1.5 border ${
              activeTab === "overview" 
                ? "bg-[#1a1240] text-white shadow-sm border-[#a855f7]/40 hover:bg-[#2a1b63]/80 hover:border-[#a855f7]/60 hover:shadow-[0_0_15px_rgba(168,85,247,0.2)]" 
                : "text-white/60 bg-transparent border-transparent hover:text-white hover:bg-[#1a1240]/60 hover:border-[#a855f7]/30 hover:shadow-[0_0_15px_rgba(168,85,247,0.15)]"
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span className="hidden sm:inline-block">Overview</span>
          </button>
          <button 
            onClick={() => setActiveTab("reports")}
            className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition-all duration-300 ease-out transform hover:scale-105 flex items-center gap-1.5 border ${
              activeTab === "reports" 
                ? "bg-[#1a1240] text-white shadow-sm border-[#a855f7]/40 hover:bg-[#2a1b63]/80 hover:border-[#a855f7]/60 hover:shadow-[0_0_15px_rgba(168,85,247,0.2)]" 
                : "text-white/60 bg-transparent border-transparent hover:text-white hover:bg-[#1a1240]/60 hover:border-[#a855f7]/30 hover:shadow-[0_0_15px_rgba(168,85,247,0.15)]"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline-block">Reports</span>
          </button>
          <button 
            onClick={() => setActiveTab("intelligence")}
            className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition-all duration-300 ease-out transform hover:scale-105 flex items-center gap-1.5 border ${
              activeTab === "intelligence" 
                ? "bg-[#1a1240] text-white shadow-sm border-[#a855f7]/40 hover:bg-[#2a1b63]/80 hover:border-[#a855f7]/60 hover:shadow-[0_0_15px_rgba(168,85,247,0.2)]" 
                : "text-white/60 bg-transparent border-transparent hover:text-white hover:bg-[#1a1240]/60 hover:border-[#a855f7]/30 hover:shadow-[0_0_15px_rgba(168,85,247,0.15)]"
            }`}
          >
            <ActivitySquare className="w-4 h-4" />
            <span className="hidden sm:inline-block">Civic Intelligence</span>
          </button>
        </div>

        <div className="flex items-center justify-end gap-2 w-1/3">
          {isAdmin && (
            <button
              onClick={async () => {
                if (!isAdmin) {
                  toast.error("Unauthorized: Admin access required.");
                  return;
                }
                try {
                  const toastId = toast.loading("Generating demo data...");
                  await generateDemoData(user.uid, user.email);
                  toast.success("Demo data generated!", { id: toastId });
                } catch (e) {
                  if (e.message === "Unauthorized: Admin access required.") {
                    toast.error(e.message);
                  } else {
                    console.error("Demo data generation error:", e);
                    toast.error("Failed to generate demo data. See console for details.");
                  }
                }
              }}
              className="text-xs bg-indigo-900 border border-indigo-700 text-indigo-200 px-2 py-1 rounded transition-all duration-300 ease-out transform hover:scale-105 hover:bg-indigo-800/80 hover:border-indigo-500/50 hover:shadow-[0_0_15px_rgba(99,102,241,0.2)]"
            >
              Generate Demo Data
            </button>
          )}
          
          <div className="relative">
            <button 
              onClick={() => setShowUserProfile(!showUserProfile)}
              className="w-9 h-9 rounded-full bg-[#1a1240] border border-[#a855f7]/40 flex items-center justify-center text-white/80 transition-all duration-300 hover:bg-[#2a1b63] hover:text-white hover:border-[#a855f7]/60 hover:shadow-[0_0_15px_rgba(168,85,247,0.2)]"
            >
              <User className="w-4 h-4" />
            </button>

            {showUserProfile && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowUserProfile(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-64 bg-[#0E0620]/95 backdrop-blur-xl border border-[#a855f7]/30 rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] p-4 flex flex-col gap-3 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="flex flex-col border-b border-purple-900/30 pb-3">
                    <span className="text-xs text-neutral-400 font-medium tracking-wide uppercase">Signed in as</span>
                    <span className="text-sm font-semibold text-white truncate mt-0.5">{user?.email}</span>
                  </div>
                  
                  <div className="flex items-center justify-between pb-3 border-b border-purple-900/30">
                    <div className="flex items-center gap-1.5 text-yellow-500">
                      <Trophy className="w-4 h-4" />
                      <span className="text-sm font-medium">Impact Points</span>
                    </div>
                    <span className="text-lg font-bold text-white">
                      {users.find(u => u.id === user?.uid)?.points || 0}
                    </span>
                  </div>

                  <button 
                    onClick={logout}
                    className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 transition-colors pt-1 w-full"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 relative">
        {activeTab === "overview" && (
          <div className="bg-transparent relative z-10 p-2 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto space-y-6 lg:space-y-8">
              {/* Gamification Dashboard Widget */}
              <div className="bg-gradient-to-r from-indigo-900/40 to-blue-900/20 border border-indigo-500/30 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-[0_4px_20px_-10px_rgba(99,102,241,0.3)] hover:border-indigo-500/40 transition-all duration-200">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-500/20 rounded-full flex items-center justify-center border border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                    <Trophy className="w-6 h-6 text-yellow-400 drop-shadow-md" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-0.5 tracking-tight">Your Civic Impact</h3>
                    <div className="text-sm text-indigo-200/80">
                      Rank <span className="font-bold text-white">#{currentUserStats.rank}</span> • <span className="font-bold text-white">{currentUserStats.points}</span> pts
                    </div>
                  </div>
                </div>
                <div className="flex flex-col sm:items-end gap-2">
                  <div className="flex gap-2">
                    {currentUserStats.badges?.length > 0 ? (
                      currentUserStats.badges.map(badge => (
                        <div key={badge} className="px-2.5 py-1 bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-xs rounded-md font-medium" title={badge}>
                          <Award className="w-3.5 h-3.5 inline mr-1" />
                          {badge}
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-indigo-400 opacity-80 border border-indigo-900/50 px-2.5 py-1 rounded-md">No badges yet</div>
                    )}
                  </div>
                  <Link to="/leaderboard" className="text-xs text-indigo-400 font-medium flex items-center gap-1 transition-all duration-300 ease-out transform hover:scale-105 border border-transparent hover:border-indigo-500/40 hover:text-indigo-300 hover:shadow-[0_0_15px_rgba(99,102,241,0.2)] bg-transparent hover:bg-indigo-500/10 px-2 py-1 rounded-md">
                    View Leaderboard &rarr;
                  </Link>
                </div>
              </div>

              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.15)]">
                  <LayoutDashboard className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white tracking-tight">System Overview</h1>
                  <p className="text-sm text-neutral-400 font-medium mt-0.5">Track and manage all civic reports in one place</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1.5 sm:gap-4">
                <StatCard label="Total Reports" value={totalReports} baseColor="purple" icon={FileText} onClick={() => showBriefOverview("All Reports")} />
                <StatCard label="Pending" value={pendingCount} baseColor="orange" icon={Clock} onClick={() => showBriefOverview("Pending Reports", r => r.status === 'PENDING')} />
                <StatCard label="Resolved" value={resolvedCount} baseColor="emerald" icon={CheckCircle2} onClick={() => showBriefOverview("Resolved Reports", r => r.status === 'RESOLVED')} />
                <StatCard label="Avg Impact Score" value={avgImpact} baseColor="blue" icon={TrendingUp} />
                <StatCard label="Most Common" value={mostCommonCategory} baseColor="blue" icon={Tags} onClick={() => showBriefOverview(`Common: ${mostCommonCategory}`, r => r.category === mostCommonCategory)} valueClass="text-[13px] sm:text-[15px] leading-[18px] sm:leading-[22px] whitespace-normal sm:truncate" />
                <StatCard label="Critical Impact" value={criticalImpactCount} baseColor="fuchsia" icon={AlertOctagon} onClick={() => showBriefOverview("Critical Impact Reports", r => calculateImpactScore(r) >= 80)} />
                <StatCard label="High Severity" value={highSeverityCount} baseColor="red" icon={AlertTriangle} onClick={() => showBriefOverview("High Severity Reports", r => r.severity === 'HIGH' || r.severity === 'CRITICAL')} />
                <StatCard label="AI PROCESSED" value={aiProcessedCount} subtitle={`${aiCoverageRate}% Coverage`} baseColor="purple" icon={Bot} onClick={() => showBriefOverview("AI Processed Reports", r => r.predictiveAssignment || r.dataInsights)} />
              </div>
            </div>
          </div>
        )}

        {activeTab === "reports" && (
          <div className="bg-transparent relative z-10 p-2 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto space-y-6 lg:space-y-8">
              <div className="bg-[#120e26]/60 backdrop-blur-[12px] border border-[#a855f7]/25 p-6 rounded-2xl shadow-[0_4px_24px_-8px_rgba(0,0,0,0.5)] hover:border-[#a855f7]/40 transition-colors duration-200">
                 <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-5 border-b border-neutral-800/60 pb-4">
                   <h2 className="text-lg font-bold text-neutral-200 flex items-center gap-2 tracking-tight">
                     <Filter className="w-5 h-5 text-neutral-400" />
                     Operation Controls
                   </h2>
                   <div className="flex items-center gap-2">
                     <button onClick={exportAsCSV} className="text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-700 hover:border-neutral-600 px-4 py-2 rounded-lg transition-all duration-200 shadow-sm active:scale-95">
                       Export CSV
                     </button>
                     <button onClick={exportAsJSON} className="text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-700 hover:border-neutral-600 px-4 py-2 rounded-lg transition-all duration-200 shadow-sm active:scale-95">
                       Export JSON
                     </button>
                   </div>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                   <div>
                     <label className="block text-[11px] font-semibold text-neutral-400 mb-2 uppercase tracking-widest">Search</label>
                     <input 
                       type="text"
                       placeholder="Title, Category, Dept..."
                       value={searchQuery}
                       onChange={e => setSearchQuery(e.target.value)}
                       className="w-full bg-neutral-950/80 border border-neutral-800 text-sm rounded-xl px-4 py-2.5 text-neutral-200 focus:outline-none focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-neutral-600 focus:shadow-[0_0_15px_rgba(59,130,246,0.1)]"
                     />
                   </div>
                   <div>
                     <label className="block text-[11px] font-semibold text-neutral-400 mb-2 uppercase tracking-widest">Category</label>
                     <select 
                       value={filterCategory} 
                       onChange={e => setFilterCategory(e.target.value)}
                       className="w-full bg-neutral-950/80 border border-neutral-800 text-sm rounded-xl px-4 py-2.5 text-neutral-200 focus:outline-none focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20 transition-all appearance-none cursor-pointer focus:shadow-[0_0_15px_rgba(59,130,246,0.1)]"
                     >
                       <option value="All">All Categories</option>
                       <option value="Pothole">Pothole</option>
                       <option value="Water Leak">Water Leak</option>
                       <option value="Garbage">Garbage</option>
                       <option value="Streetlight Damage">Streetlight Damage</option>
                       <option value="Road Damage">Road Damage</option>
                       <option value="Infrastructure Damage">Infrastructure Damage</option>
                       <option value="Other">Other</option>
                     </select>
                   </div>
                   <div>
                     <label className="block text-[11px] font-semibold text-neutral-400 mb-2 uppercase tracking-widest">Severity</label>
                     <select 
                       value={filterSeverity} 
                       onChange={e => setFilterSeverity(e.target.value)}
                       className="w-full bg-neutral-950/80 border border-neutral-800 text-sm rounded-xl px-4 py-2.5 text-neutral-200 focus:outline-none focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20 transition-all appearance-none cursor-pointer focus:shadow-[0_0_15px_rgba(59,130,246,0.1)]"
                     >
                       <option value="All">All Severities</option>
                       <option value="LOW">Low</option>
                       <option value="MEDIUM">Medium</option>
                       <option value="HIGH">High</option>
                       <option value="CRITICAL">Critical</option>
                     </select>
                   </div>
                   <div>
                     <label className="block text-[11px] font-semibold text-neutral-400 mb-2 uppercase tracking-widest">Status</label>
                     <select 
                       value={filterStatus} 
                       onChange={e => setFilterStatus(e.target.value)}
                       className="w-full bg-neutral-950/80 border border-neutral-800 text-sm rounded-xl px-4 py-2.5 text-neutral-200 focus:outline-none focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20 transition-all appearance-none cursor-pointer focus:shadow-[0_0_15px_rgba(59,130,246,0.1)]"
                     >
                       <option value="All">All Statuses</option>
                       <option value="PENDING">Pending</option>
                       <option value="IN_PROGRESS">In Progress</option>
                       <option value="RESOLVED">Resolved</option>
                     </select>
                   </div>
                 </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-start">
                <div className="w-full min-h-[300px] md:min-h-[400px] lg:min-h-[500px] h-[300px] md:h-[400px] lg:h-[500px] rounded-2xl overflow-hidden border border-neutral-800/60 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.5)]">
                  <CommunityMap reports={filteredReports} focusedLocation={focusedLocation} />
                </div>

                <div className="w-full bg-[#120e26]/60 backdrop-blur-[12px] flex flex-col border border-[#a855f7]/25 rounded-2xl overflow-hidden shadow-[0_4px_24px_-8px_rgba(0,0,0,0.5)] h-[300px] md:h-[400px] lg:h-[500px]">
                  <div className="p-5 border-b border-neutral-800/60 flex justify-between items-center bg-neutral-900/50">
                    <h2 className="font-bold text-neutral-200 tracking-tight">Highest Impact Issues</h2>
                    <div className="px-2.5 py-1 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold tracking-wide">
                      {filteredReports.length} {filteredReports.length === 1 ? "Result" : "Results"}
                    </div>
                  </div>
                  
                  <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                    {loading ? (
                      // Loading state
                      [1, 2, 3, 4].map((i) => (
                        <div key={i} className="bg-neutral-900/40 rounded-2xl p-5 border border-neutral-800 flex flex-col gap-4 animate-pulse">
                          <div className="flex justify-between items-start">
                            <div className="h-5 w-3/4 bg-neutral-800 rounded-md"></div>
                            <div className="h-5 w-12 bg-neutral-800 rounded-md"></div>
                          </div>
                          <div className="space-y-2">
                            <div className="h-3 w-full bg-neutral-800/60 rounded-sm"></div>
                            <div className="h-3 w-5/6 bg-neutral-800/60 rounded-sm"></div>
                          </div>
                          <div className="flex gap-2 mt-2">
                            <div className="h-6 w-16 bg-neutral-800/80 rounded-md"></div>
                            <div className="h-6 w-16 bg-neutral-800/80 rounded-md"></div>
                          </div>
                        </div>
                      ))
                    ) : filteredReports.length > 0 ? (
                      // Reports list
                      filteredReports.map((report) => (
                        <div 
                          key={report.id}
                          onClick={() => setSelectedReport(report)}
                          className="cursor-pointer group"
                        >
                          <ReportCard 
                            report={report} 
                            onViewOnMap={(e) => {
                              if (e) e.stopPropagation();
                              if (report.latitude && report.longitude) {
                                setFocusedLocation({
                                  latitude: report.latitude,
                                  longitude: report.longitude
                                });
                              }
                            }} 
                          />
                        </div>
                      ))
                    ) : (
                      // Empty state
                      <div className="h-full flex flex-col items-center justify-center text-neutral-500 pb-12 mt-[10vh]">
                        <div className="w-16 h-16 bg-neutral-900/50 flex items-center justify-center rounded-full mb-4 border border-neutral-800/50">
                          <Filter className="w-8 h-8 opacity-40 text-neutral-400" />
                        </div>
                        <h3 className="text-neutral-300 font-medium text-base mb-1">No reports found</h3>
                        <p className="text-sm text-neutral-500 max-w-[200px] text-center">Adjust your filters or submit a new report to see them here.</p>
                      </div>
                    )}
                    
                    {!loading && (
                      <div className="text-center text-xs text-neutral-600 mt-6 pb-2">
                        Syncing with regional nodes...
                      </div>
                    )}
                  </div>

                  <div className="p-4 border-t border-neutral-800/60 bg-neutral-950/50">
                    <button 
                      onClick={() => navigate("/report")}
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 shadow-[0_4px_14px_0_rgba(37,99,235,0.39)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.23)] transition-all duration-200 active:scale-[0.98]"
                    >
                      <PlusCircle className="w-5 h-5" />
                      New Report
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "intelligence" && (
          <div className="flex-1 bg-transparent relative z-10 p-2 sm:p-6 lg:p-8">
            <div className="max-w-6xl mx-auto">
              <div className="flex justify-between items-end mb-8">
                <div>
                  <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                    <ActivitySquare className="w-6 h-6 text-indigo-400" />
                    Civic Intelligence
                  </h1>
                  <p className="text-neutral-400">Predictive insights and trends derived from community reporting.</p>
                </div>
              </div>
              
              <CivicIntelligence reports={reports} />
            </div>
          </div>
        )}
      </div>

      {selectedReport && (
        <ReportDetailsModal 
          report={selectedReport} 
          onClose={() => setSelectedReport(null)} 
        />
      )}
    </div>
  );
}

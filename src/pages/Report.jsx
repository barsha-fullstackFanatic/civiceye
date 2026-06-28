import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Send, UploadCloud, Sparkles } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { createReport } from "../services/reports";
import toast from "react-hot-toast";

export default function Report() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [aiMetadata, setAiMetadata] = useState(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "Pothole",
    severity: "MEDIUM"
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setError(null);
    setAiMetadata(null); // Reset metadata on new image
  };

  const handleAnalyzeImage = async () => {
    if (!imageFile) return;
    
    setAnalyzing(true);
    setError(null);

    try {
      // Read file as base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64Data = reader.result.split(',')[1];
          
          console.log("Sending image to /api/analyze-image");
          // Send to Gemini
          const response = await fetch('/api/analyze-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              mimeType: imageFile.type,
              data: base64Data
            })
          });

          if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error || `HTTP error ${response.status}`);
          }

          const data = await response.json();
          // Auto-populate form
          setFormData(prev => ({
            ...prev,
            title: data.summary || prev.title,
            category: data.category || prev.category,
            severity: data.severity || prev.severity,
          }));

          setAiMetadata(data);
        } catch (innerErr) {
          console.error("Analysis fetch error:", innerErr);
          setError("AI analysis failed: " + innerErr.message + ". You can still submit manually.");
        } finally {
          setAnalyzing(false);
        }
      };
      reader.onerror = () => {
        throw new Error('Error reading file');
      };
      reader.readAsDataURL(imageFile);
      
    } catch (err) {
      console.error(err);
      setError("AI analysis failed: " + err.message + ". You can still submit manually.");
      setAnalyzing(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.description) {
      setError("Please fill out all required fields.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const loc = await new Promise((resolve) => {
        if (!navigator.geolocation) {
          resolve({ latitude: null, longitude: null });
        } else {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              resolve({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
              });
            },
            () => {
              resolve({ latitude: null, longitude: null });
            }
          );
        }
      });

      const reportData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        severity: formData.severity,
        status: "PENDING"
      };

      if (loc.latitude) {
        reportData.latitude = loc.latitude;
        reportData.longitude = loc.longitude;
      }
      
      if (aiMetadata) {
        console.log("Adding AI metadata to document...");
        reportData.impactScore = aiMetadata.impactScore;
        reportData.department = aiMetadata.department;
        reportData.summary = aiMetadata.summary;
        reportData.recommendedPriority = aiMetadata.recommendedPriority;
      }

      try {
        await createReport(reportData, user.uid);
        toast.success("Report submitted successfully! +10 points");
      } catch (firestoreError) {
        console.error("Firestore save failed:", firestoreError);
        throw new Error("Step 5 Failed (Firestore addDoc): " + firestoreError.message);
      }
      
      navigate("/dashboard");
    } catch (err) {
      console.error("Submit error:", err);
      setError(err.message || "Failed to submit report. Please try again.");
      toast.error("Failed to submit report.");
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-neutral-900 text-white font-sans">
      <header className="flex-none h-16 border-b border-neutral-800 bg-neutral-950 flex items-center px-6 sticky top-0 z-10">
        <button 
          onClick={() => navigate("/dashboard")}
          className="mr-4 text-neutral-400 p-2 -ml-2 rounded-lg transition-all duration-300 ease-out transform hover:scale-105 border border-transparent hover:border-blue-500/30 hover:bg-neutral-800/80 hover:text-white hover:shadow-[0_0_15px_rgba(59,130,246,0.15)]"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="font-semibold text-lg tracking-tight">New Report</span>
      </header>

      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="max-w-2xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-6 bg-neutral-950 p-6 sm:p-8 rounded-2xl border border-neutral-800 shadow-xl">
            
            <div className="space-y-1">
              <h1 className="text-2xl font-bold text-white">Report an Issue</h1>
              <p className="text-neutral-400 text-sm">Help improve your community by detailing the problem.</p>
            </div>

            {error && (
              <div className="bg-red-900/30 border border-red-800 text-red-400 p-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1.5">
                  Upload Image
                </label>
                <div onClick={() => !analyzing && fileInputRef.current?.click()} className={`border-2 border-dashed ${imagePreview ? 'border-neutral-700 bg-neutral-900 border-solid' : 'border-neutral-700 hover:border-neutral-500 bg-neutral-900/50'} rounded-lg p-4 transition-colors cursor-pointer text-center relative overflow-hidden group`}>
                  
                  {analyzing ? (
                    <div className="flex flex-col items-center justify-center py-6 text-emerald-500 space-y-3">
                      <Sparkles className="w-8 h-8 animate-pulse" />
                      <div className="text-sm font-medium">AI is analyzing image...</div>
                    </div>
                  ) : imagePreview ? (
                    <div className="relative">
                      <img src={imagePreview} alt="Preview" className="mx-auto max-h-48 rounded object-contain" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-sm font-medium rounded">
                        Click to change image
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-6 text-neutral-400 space-y-2">
                      <UploadCloud className="w-8 h-8 opacity-70" />
                      <div className="text-sm">Click to upload an image</div>
                      <div className="text-xs text-neutral-500">AI will automatically classify the issue</div>
                    </div>
                  )}

                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={analyzing}
                  />
                </div>
                
                {imagePreview && !analyzing && (
                  <div className="flex justify-end mt-2 mb-4">
                     <button
                        type="button"
                        onClick={handleAnalyzeImage}
                        disabled={analyzing || !imageFile}
                        className="px-4 py-2 text-sm font-medium text-blue-400 bg-blue-900/20 hover:bg-blue-900/40 border border-blue-800/50 rounded-lg shadow transition-all flex items-center justify-center gap-2"
                     >
                        <Sparkles className="w-4 h-4" />
                        Analyze Image
                     </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1.5">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g., Large pothole on Main St."
                  className="w-full bg-neutral-900/60 border border-neutral-700/80 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all placeholder:text-neutral-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1.5">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Provide more details about the issue..."
                  rows={4}
                  className="w-full bg-neutral-900/60 border border-neutral-700/80 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all resize-none placeholder:text-neutral-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-1.5">
                    Category
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full bg-neutral-900/60 border border-neutral-700/80 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all appearance-none"
                  >
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
                  <label className="block text-sm font-medium text-neutral-300 mb-1.5">
                    Severity
                  </label>
                  <select
                    name="severity"
                    value={formData.severity}
                    onChange={handleChange}
                    className="w-full bg-neutral-900/60 border border-neutral-700/80 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all appearance-none"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
              </div>
              
              {aiMetadata && (
                <div className="bg-blue-900/10 border border-blue-900/30 rounded-lg p-4 mt-2 mb-2">
                  <div className="flex items-center gap-2 text-blue-400 mb-2">
                    <Sparkles className="w-4 h-4" />
                    <h3 className="text-sm font-semibold">AI Insights</h3>
                  </div>
                  <ul className="text-sm text-neutral-300 space-y-1">
                    <li><span className="text-neutral-500">Department:</span> {aiMetadata.department}</li>
                    <li><span className="text-neutral-500">Impact Score:</span> {aiMetadata.impactScore}/10</li>
                    <li><span className="text-neutral-500">Suggested Priority:</span> {aiMetadata.recommendedPriority}</li>
                  </ul>
                </div>
              )}
            </div>

            <div className="pt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                className="px-5 py-2.5 text-sm font-medium text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-lg shadow-blue-900/20 transition-all flex items-center justify-center min-w-[120px]"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Submit
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

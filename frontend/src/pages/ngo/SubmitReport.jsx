import { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Upload, X, CheckCircle2, FileText, DollarSign, Users, Camera } from "lucide-react";

export default function SubmitReport() {
  const [form, setForm] = useState({
    title: "",
    description: "",
    content: "",
    issueSolvedAt: "",
    capitalUtilised: "",
    contributors: "",
    issueSolved: "false",
  });
  
  const [uploadedImages, setUploadedImages] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [stream, setStream] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const handleChange = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const openCamera = async () => {
    try {
      // Request camera access
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      // Request location access
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
          setStream(mediaStream);
          setIsCameraOpen(true);
          
          // Set video stream
          setTimeout(() => {
            if (videoRef.current) {
              videoRef.current.srcObject = mediaStream;
            }
          }, 100);
        },
        (error) => {
          // Stop camera if location denied
          mediaStream.getTracks().forEach(track => track.stop());
          alert("Location access is required to capture images. Please enable location permissions.");
        }
      );
      
    } catch (error) {
      alert("Camera access is required. Please enable camera permissions.");
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current || !currentLocation) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Add location overlay
    const fontSize = Math.max(canvas.width / 40, 16);
    context.font = `bold ${fontSize}px Arial`;
    context.fillStyle = 'rgba(0, 0, 0, 0.7)';
    context.fillRect(10, canvas.height - fontSize - 30, canvas.width - 20, fontSize + 20);
    
    context.fillStyle = '#22c55e';
    context.fillText(
      `📍 ${currentLocation.latitude.toFixed(6)}, ${currentLocation.longitude.toFixed(6)}`,
      20,
      canvas.height - 15
    );

    // Convert canvas to blob and create image object
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const newImage = {
        id: Math.random().toString(36).substr(2, 9),
        name: `capture_${Date.now()}.jpg`,
        url: url,
        file: blob,
        location: { ...currentLocation }
      };
      setUploadedImages(prev => [...prev, newImage]);
    }, 'image/jpeg', 0.95);
  };

  const closeCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    setIsCameraOpen(false);
    setStream(null);
  };

  const removeImage = (id) => {
    setUploadedImages(prev => prev.filter(img => img.id !== id));
  };

  const handleSubmit = async () => {
  try {
    setIsSubmitting(true);

    const payload = {
      ...form,
      capitalUtilised: Number(form.capitalUtilised),
      images: uploadedImages.map(img => ({
        url: img.url,
        location: img.location,
      })),
      contributors: form.contributors
        ? form.contributors.split(",").map(c => c.trim())
        : [],
      issueSolved: form.issueSolved === "true",
    };

    const res = await fetch(
      `${import.meta.env.VITE_API_BASE_URL}/ngo/report`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // IMPORTANT for cookies / auth
        body: JSON.stringify(payload),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.message || "Failed to submit report");
    }

    alert("Report submitted successfully!");

    // OPTIONAL: reset form after success
    setForm({
      title: "",
      description: "",
      content: "",
      issueSolvedAt: "",
      capitalUtilised: "",
      contributors: "",
      issueSolved: "false",
    });
    setUploadedImages([]);

  } catch (error) {
    console.error(error);
    alert(error.message || "Something went wrong");
  } finally {
    setIsSubmitting(false);
  }
};


  return (
    <div className="min-h-screen bg-[#f8fafc] relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-50">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <circle cx="20" cy="20" r="1.5" fill="#39483e" opacity="0.55"/>
            </pattern>
            <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{stopColor: '#dcfce7', stopOpacity: 0.3}} />
              <stop offset="100%" style={{stopColor: '#f0fdf4', stopOpacity: 0.1}} />
            </linearGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#grad1)" />
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Camera Modal */}
      {isCameraOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-3xl w-full space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-[#0f172a]">Capture Photo</h3>
              <button
                onClick={closeCamera}
                className="w-10 h-10 rounded-full bg-[#ef4444] text-white flex items-center justify-center hover:bg-[#dc2626] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="relative bg-black rounded-xl overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-auto"
              />
            </div>

            {currentLocation && (
              <div className="text-sm text-[#64748b] text-center">
                📍 Current Location: {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
              </div>
            )}

            <Button
              onClick={capturePhoto}
              className="w-full h-12 bg-gradient-to-r from-[#22c55e] to-[#16a34a] hover:from-[#16a34a] hover:to-[#15803d] text-white rounded-xl font-semibold"
            >
              <Camera className="w-5 h-5 mr-2" />
              Capture Photo
            </Button>
          </div>
        </div>
      )}

      {/* Hidden canvas for image processing */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      <div className="relative py-8 px-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* HEADER */}
          <div className="text-center space-y-3 pb-4">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-[#22c55e] to-[#16a34a] shadow-lg shadow-[#22c55e]/30 mb-2">
              <CheckCircle2 className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-[#0f172a]">
              Submit Relief Report
            </h1>
            <p className="text-lg text-[#64748b] max-w-2xl mx-auto">
              Document your relief work and share the impact created with funds received
            </p>
          </div>

          <div className="space-y-5">
            {/* BASIC INFO */}
            <Card className="p-6 space-y-5 border-[#22c55e]/20 shadow-md bg-white/80 backdrop-blur-sm">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#dcfce7] flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-[#22c55e]" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-[#0f172a] mb-1">
                    Report Overview
                  </h2>
                  <p className="text-sm text-[#64748b]">
                    Basic information about your relief efforts
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-[#0f172a]">
                  Report Title *
                </Label>
                <Input
                  value={form.title}
                  onChange={e => handleChange("title", e.target.value)}
                  placeholder="e.g., Flood Relief in District ABC"
                  className="h-11 border-[#22c55e]/30 focus:border-[#22c55e] focus:ring-[#22c55e]"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-[#0f172a]">
                  Brief Description *
                </Label>
                <Textarea
                  value={form.description}
                  onChange={e => handleChange("description", e.target.value)}
                  placeholder="Provide a concise summary of the relief work..."
                  rows={3}
                  className="border-[#22c55e]/30 focus:border-[#22c55e] focus:ring-[#22c55e] resize-none"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-[#0f172a]">
                    Date of Resolution *
                  </Label>
                  <Input
                    type="date"
                    value={form.issueSolvedAt}
                    onChange={e => handleChange("issueSolvedAt", e.target.value)}
                    className="h-11 border-[#22c55e]/30 focus:border-[#22c55e] focus:ring-[#22c55e]"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-[#0f172a]">
                    Status *
                  </Label>
                  <Select
                    value={form.issueSolved}
                    onValueChange={val => handleChange("issueSolved", val)}
                  >
                    <SelectTrigger className="h-11 border-[#22c55e]/30 focus:border-[#22c55e] focus:ring-[#22c55e]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="false">🔄 Ongoing</SelectItem>
                      <SelectItem value="true">✅ Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Card>

            {/* DETAILED NARRATIVE */}
            <Card className="p-6 space-y-4 border-[#22c55e]/20 shadow-md bg-white/80 backdrop-blur-sm">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#dcfce7] flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-[#22c55e]" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-[#0f172a] mb-1">
                    Relief Activities
                  </h2>
                  <p className="text-sm text-[#64748b]">
                    Describe the work carried out in detail
                  </p>
                </div>
              </div>

              <Textarea
                rows={8}
                placeholder="Provide a detailed account of relief activities, beneficiaries reached, resources distributed, challenges faced, and outcomes achieved..."
                value={form.content}
                onChange={e => handleChange("content", e.target.value)}
                className="border-[#22c55e]/30 focus:border-[#22c55e] focus:ring-[#22c55e] resize-none"
              />
            </Card>

            {/* FUND UTILIZATION */}
            <Card className="p-6 space-y-4 border-[#22c55e]/40 shadow-md bg-gradient-to-br from-[#dcfce7] via-[#f0fdf4] to-white backdrop-blur-sm">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#22c55e] flex items-center justify-center flex-shrink-0">
                  <DollarSign className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-[#0f172a] mb-1">
                    Fund Utilization
                  </h2>
                  <p className="text-sm text-[#64748b]">
                    Total capital deployed for this relief work
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-[#0f172a]">
                  Amount Utilized (₹) *
                </Label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#22c55e] font-semibold text-lg">
                    ₹
                  </span>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.capitalUtilised}
                    onChange={e => handleChange("capitalUtilised", e.target.value)}
                    placeholder="0.00"
                    className="h-12 pl-9 text-lg border-[#22c55e]/40 focus:border-[#22c55e] focus:ring-[#22c55e] bg-white font-medium"
                  />
                </div>
              </div>
            </Card>

            {/* IMAGE CAPTURE */}
            <Card className="p-6 space-y-4 border-[#22c55e]/20 shadow-md bg-white/80 backdrop-blur-sm">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#dcfce7] flex items-center justify-center flex-shrink-0">
                  <Camera className="w-5 h-5 text-[#22c55e]" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-[#0f172a] mb-1">
                    Visual Documentation
                  </h2>
                  <p className="text-sm text-[#64748b]">
                    Capture photos from your camera with location data
                  </p>
                </div>
              </div>

              <div>
                <div 
                  onClick={openCamera}
                  className="border-2 border-dashed border-[#22c55e]/40 rounded-xl p-8 text-center cursor-pointer hover:border-[#22c55e] hover:bg-[#f0fdf4] transition-all"
                >
                  <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-[#dcfce7] flex items-center justify-center">
                    <Camera className="w-7 h-7 text-[#22c55e]" />
                  </div>
                  <p className="text-sm font-medium text-[#0f172a] mb-1">
                    Open Camera to Capture
                  </p>
                  <p className="text-xs text-[#64748b]">
                    Photos will include location data
                  </p>
                </div>
              </div>

              {uploadedImages.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {uploadedImages.map(img => (
                    <div key={img.id} className="relative group">
                      <img
                        src={img.url}
                        alt={img.name}
                        className="w-full h-28 object-cover rounded-lg border-2 border-[#22c55e]/20"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(img.id)}
                        className="absolute -top-2 -right-2 w-7 h-7 bg-[#ef4444] text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* CONTRIBUTORS */}
            <Card className="p-6 space-y-4 border-[#22c55e]/20 shadow-md bg-white/80 backdrop-blur-sm">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#dcfce7] flex items-center justify-center flex-shrink-0">
                  <Users className="w-5 h-5 text-[#22c55e]" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-[#0f172a] mb-1">
                    Contributors
                  </h2>
                  <p className="text-sm text-[#64748b]">
                    Acknowledge volunteers and partners
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-[#0f172a]">
                  List Contributors (comma separated)
                </Label>
                <Input
                  value={form.contributors}
                  onChange={e => handleChange("contributors", e.target.value)}
                  placeholder="e.g., Local Volunteers, District Administration, Partner NGO"
                  className="h-11 border-[#22c55e]/30 focus:border-[#22c55e] focus:ring-[#22c55e]"
                />
              </div>
            </Card>

            {/* SUBMIT BUTTON */}
            <div className="pt-2">
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full h-14 text-base font-semibold bg-gradient-to-r from-[#22c55e] to-[#16a34a] hover:from-[#16a34a] hover:to-[#15803d] text-white rounded-xl shadow-xl shadow-[#22c55e]/30 transition-all transform hover:scale-[1.02]"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                    Submitting Report...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" />
                    Submit Report
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
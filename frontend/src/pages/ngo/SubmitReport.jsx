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
        video: { 
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        } 
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

    // Add location overlay with better positioning
    const padding = 20;
    const fontSize = Math.max(canvas.width / 50, 14);
    const textHeight = fontSize + 20;
    
    context.font = `bold ${fontSize}px Arial`;
    
    // Measure text width for better background sizing
    const locationText = `📍 Lat: ${currentLocation.latitude.toFixed(6)}, Lon: ${currentLocation.longitude.toFixed(6)}`;
    const textWidth = context.measureText(locationText).width;
    
    // Draw semi-transparent background for text
    context.fillStyle = 'rgba(0, 0, 0, 0.75)';
    context.fillRect(
      padding, 
      canvas.height - textHeight - padding, 
      textWidth + 40, 
      textHeight
    );
    
    // Draw text
    context.fillStyle = '#22c55e';
    context.fillText(
      locationText,
      padding + 20,
      canvas.height - padding - 10
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
          credentials: "include",
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Failed to submit report");
      }

      alert("Report submitted successfully!");

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
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-50">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <circle cx="20" cy="20" r="1.5" fill="currentColor" className="text-muted-foreground" opacity="0.3"/>
            </pattern>
            <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{stopColor: 'var(--accent-green-lighter)', stopOpacity: 0.3}} />
              <stop offset="100%" style={{stopColor: 'var(--accent-green-light)', stopOpacity: 0.1}} />
            </linearGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#grad1)" />
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Camera Modal */}
      {isCameraOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl p-6 max-w-4xl w-full space-y-4 border border-border shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-card-foreground">Capture Photo</h3>
              <button
                onClick={closeCamera}
                className="w-10 h-10 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center hover:opacity-90 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="relative bg-black rounded-xl overflow-hidden aspect-video">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-contain"
              />
            </div>

            {currentLocation && (
              <div className="text-sm text-muted-foreground text-center bg-accent/50 rounded-lg py-2 px-4">
                📍 Current Location: Lat {currentLocation.latitude.toFixed(6)}, Lon {currentLocation.longitude.toFixed(6)}
              </div>
            )}

            <Button
              onClick={capturePhoto}
              className="w-full h-12 bg-primary text-primary-foreground hover:opacity-90 rounded-xl font-semibold transition-all"
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
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-primary shadow-lg shadow-primary/30 mb-2">
              <CheckCircle2 className="w-10 h-10 text-primary-foreground" />
            </div>
            <h1 className="text-4xl font-bold text-foreground">
              Submit Relief Report
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Document your relief work and share the impact created with funds received
            </p>
          </div>

          <div className="space-y-5">
            {/* BASIC INFO */}
            <Card className="p-6 space-y-5 border-border shadow-md bg-card backdrop-blur-sm">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-[var(--accent-green-light)] flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-[var(--accent-green-foreground)]" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-card-foreground mb-1">
                    Report Overview
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Basic information about your relief efforts
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-card-foreground">
                  Report Title *
                </Label>
                <Input
                  value={form.title}
                  onChange={e => handleChange("title", e.target.value)}
                  placeholder="e.g., Flood Relief in District ABC"
                  className="h-11 border-input focus:border-ring focus:ring-ring"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-card-foreground">
                  Brief Description *
                </Label>
                <Textarea
                  value={form.description}
                  onChange={e => handleChange("description", e.target.value)}
                  placeholder="Provide a concise summary of the relief work..."
                  rows={3}
                  className="border-input focus:border-ring focus:ring-ring resize-none"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-card-foreground">
                    Date of Resolution *
                  </Label>
                  <Input
                    type="date"
                    value={form.issueSolvedAt}
                    onChange={e => handleChange("issueSolvedAt", e.target.value)}
                    className="h-11 border-input focus:border-ring focus:ring-ring"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-card-foreground">
                    Status *
                  </Label>
                  <Select
                    value={form.issueSolved}
                    onValueChange={val => handleChange("issueSolved", val)}
                  >
                    <SelectTrigger className="h-11 border-input focus:border-ring focus:ring-ring">
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
            <Card className="p-6 space-y-4 border-border shadow-md bg-card backdrop-blur-sm">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-[var(--accent-green-light)] flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-[var(--accent-green-foreground)]" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-card-foreground mb-1">
                    Relief Activities
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Describe the work carried out in detail
                  </p>
                </div>
              </div>

              <Textarea
                rows={8}
                placeholder="Provide a detailed account of relief activities, beneficiaries reached, resources distributed, challenges faced, and outcomes achieved..."
                value={form.content}
                onChange={e => handleChange("content", e.target.value)}
                className="border-input focus:border-ring focus:ring-ring resize-none"
              />
            </Card>

            {/* FUND UTILIZATION */}
            <Card className="p-6 space-y-4 border-border shadow-md bg-gradient-to-br from-[var(--accent-green-lighter)] via-[var(--accent-green-light)] to-card backdrop-blur-sm">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
                  <DollarSign className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-card-foreground mb-1">
                    Fund Utilization
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Total capital deployed for this relief work
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-card-foreground">
                  Amount Utilized (₹) *
                </Label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-semibold text-lg">
                    ₹
                  </span>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.capitalUtilised}
                    onChange={e => handleChange("capitalUtilised", e.target.value)}
                    placeholder="0.00"
                    className="h-12 pl-9 text-lg border-input focus:border-ring focus:ring-ring bg-card font-medium"
                  />
                </div>
              </div>
            </Card>

            {/* IMAGE CAPTURE */}
            <Card className="p-6 space-y-4 border-border shadow-md bg-card backdrop-blur-sm">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-[var(--accent-green-light)] flex items-center justify-center flex-shrink-0">
                  <Camera className="w-5 h-5 text-[var(--accent-green-foreground)]" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-card-foreground mb-1">
                    Visual Documentation
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Capture photos from your camera with location data
                  </p>
                </div>
              </div>

              <div>
                <div 
                  onClick={openCamera}
                  className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary hover:bg-accent transition-all"
                >
                  <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-[var(--accent-green-light)] flex items-center justify-center">
                    <Camera className="w-7 h-7 text-[var(--accent-green-foreground)]" />
                  </div>
                  <p className="text-sm font-medium text-card-foreground mb-1">
                    Open Camera to Capture
                  </p>
                  <p className="text-xs text-muted-foreground">
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
                        className="w-full h-28 object-cover rounded-lg border-2 border-border"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(img.id)}
                        className="absolute -top-2 -right-2 w-7 h-7 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <div className="absolute bottom-0 left-0 right-0 bg-black/75 text-white text-[10px] px-2 py-1 rounded-b-lg">
                        📍 {img.location.latitude.toFixed(4)}, {img.location.longitude.toFixed(4)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* CONTRIBUTORS */}
            <Card className="p-6 space-y-4 border-border shadow-md bg-card backdrop-blur-sm">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-[var(--accent-green-light)] flex items-center justify-center flex-shrink-0">
                  <Users className="w-5 h-5 text-[var(--accent-green-foreground)]" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-card-foreground mb-1">
                    Contributors
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Acknowledge volunteers and partners
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-card-foreground">
                  List Contributors (comma separated)
                </Label>
                <Input
                  value={form.contributors}
                  onChange={e => handleChange("contributors", e.target.value)}
                  placeholder="e.g., Local Volunteers, District Administration, Partner NGO"
                  className="h-11 border-input focus:border-ring focus:ring-ring"
                />
              </div>
            </Card>

            {/* SUBMIT BUTTON */}
            <div className="pt-2">
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full h-14 text-base font-semibold bg-primary text-primary-foreground hover:opacity-90 rounded-xl shadow-xl shadow-primary/30 transition-all transform hover:scale-[1.02]"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <div className="w-5 h-5 border-3 border-primary-foreground border-t-transparent rounded-full animate-spin" />
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
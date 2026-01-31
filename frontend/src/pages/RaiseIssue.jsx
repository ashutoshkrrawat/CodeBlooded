import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { UploadCloud, X, IndianRupee } from "lucide-react";
import { toast } from "sonner";

export default function RaiseIssue() {
  const [form, setForm] = useState({
    title: "",
    description: "",
    address: "",
    fundsUsed: "",
  });

  const [images, setImages] = useState([]);

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleImages = (files) => {
    const newFiles = Array.from(files).map((file) => ({
      id: crypto.randomUUID(),
      file,
      preview: URL.createObjectURL(file),
    }));
    setImages((prev) => [...prev, ...newFiles]);
  };

  const removeImage = (id) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  };

  const handleSubmit = async () => {
    if (!form.title || !form.description || !form.address) {
      toast.error("Please fill all required fields");
      return;
    }

    toast.success("Issue reported successfully");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6 py-10">
      <style>{`
        @keyframes slideIn {
          from {
            width: 0;
          }
          to {
            width: 100%;
          }
        }

        .label-with-underline {
          position: relative;
          display: inline-block;
          cursor: default;
        }

        .label-with-underline::after {
          content: '';
          position: absolute;
          bottom: -4px;
          left: 0;
          width: 0;
          height: 2px;
          background: linear-gradient(90deg, var(--accent-green), var(--accent-green-foreground));
          transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .label-with-underline:hover::after {
          width: 100%;
        }

        .input-focus-slide {
          position: relative;
        }

        .input-focus-slide::before {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 0;
          height: 2px;
          background: var(--accent-green);
          transition: width 0.3s ease;
          z-index: 1;
        }

        .input-focus-slide:focus-within::before {
          width: 100%;
        }

        .card-hover {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .card-hover:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 24px -10px rgba(34, 197, 94, 0.2);
        }
      `}</style>

      <Card className="w-full max-w-7xl p-10 space-y-10 card card-hover">
        {/* HEADER */}
        <div className="space-y-3">
          <h1 className="text-4xl font-bold text-foreground tracking-tight">
            Raise an Issue
          </h1>
          <p className="text-base text-muted-foreground max-w-2xl leading-relaxed">
            Report disasters or urgent situations happening around you so NGOs
            and authorities can respond quickly.
          </p>
        </div>

        {/* TWO COLUMN */}
        <div className="grid md:grid-cols-2 gap-12 min-h-[520px]">
          {/* LEFT – FULL IMAGE DROP ZONE */}
          <label
            className="
              relative rounded-2xl cursor-pointer overflow-hidden
              border-2 border-dashed
              border-[var(--accent-green)]
              bg-gradient-to-br
              from-[var(--accent-green-lighter)]
              via-[var(--accent-green-light)]
              to-white
              flex flex-col items-center justify-center
              transition-all duration-300
              hover:shadow-xl hover:border-[var(--accent-green-foreground)]
              hover:scale-[1.01]
            "
          >
            <input
              type="file"
              multiple
              accept="image/*"
              hidden
              onChange={(e) => handleImages(e.target.files)}
            />

            {images.length === 0 ? (
              <div className="flex flex-col items-center gap-4 text-center px-6">
                <div className="w-24 h-24 rounded-full bg-[var(--accent-green)]/15 flex items-center justify-center transition-transform duration-300 hover:scale-110">
                  <UploadCloud className="w-12 h-12 text-[var(--accent-green-foreground)]" />
                </div>
                <p className="text-xl font-semibold text-foreground">
                  Drop images here or click to upload
                </p>
                <p className="text-sm text-muted-foreground">
                  PNG & JPG supported
                </p>
              </div>
            ) : (
              <div className="absolute inset-0 p-4 grid grid-cols-2 gap-3 bg-white/60 backdrop-blur-sm">
                {images.map((img) => (
                  <div key={img.id} className="relative group">
                    <img
                      src={img.preview}
                      className="h-full w-full object-cover rounded-xl transition-transform duration-300 group-hover:scale-105"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        removeImage(img.id);
                      }}
                      className="
                        absolute top-2 right-2
                        bg-destructive text-white
                        rounded-full p-1.5
                        opacity-0 group-hover:opacity-100
                        transition-all duration-200
                        hover:scale-110
                      "
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </label>

          {/* RIGHT – FORM */}
          <div className="space-y-7">
            <div className="space-y-3 input-focus-slide">
              <Label className="text-base font-semibold label-with-underline">
                Title *
              </Label>
              <Input
                placeholder="e.g. Flooding near railway station"
                value={form.title}
                onChange={(e) => handleChange("title", e.target.value)}
                className="h-14 text-base px-4 transition-all duration-200 focus:scale-[1.01]"
              />
            </div>

            <div className="space-y-3 input-focus-slide">
              <Label className="text-base font-semibold label-with-underline">
                Description *
              </Label>
              <Textarea
                rows={6}
                placeholder="Describe what is happening on ground..."
                value={form.description}
                onChange={(e) =>
                  handleChange("description", e.target.value)
                }
                className="text-base px-4 py-3 resize-none transition-all duration-200 focus:scale-[1.01]"
              />
            </div>

            <div className="space-y-3 input-focus-slide">
              <Label className="text-base font-semibold label-with-underline">
                Location / Address *
              </Label>
              <Input
                placeholder="Area, city, landmark"
                value={form.address}
                onChange={(e) => handleChange("address", e.target.value)}
                className="h-14 text-base px-4 transition-all duration-200 focus:scale-[1.01]"
              />
            </div>

            <div className="space-y-3 input-focus-slide">
              <Label className="text-base font-semibold label-with-underline">
                Funds Used (₹)
              </Label>
              <div className="relative">
                <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="number"
                  className="h-14 pl-12 text-base transition-all duration-200 focus:scale-[1.01]"
                  placeholder="0"
                  value={form.fundsUsed}
                  onChange={(e) =>
                    handleChange("fundsUsed", e.target.value)
                  }
                />
                {/* SUBMIT */}
              </div>
            </div>
        <Button
          onClick={handleSubmit}
          className="
            w-full h-16 text-lg font-semibold
      bg-primary text-primary-foreground
      rounded-full
      transition-all duration-300
      hover:scale-[1.02]
      hover:shadow-xl
      active:scale-[0.98]
          "
        >
          Submit Issue
        </Button>
          </div>
        </div>

        
      </Card>
    </div>
  );
}
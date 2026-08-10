import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Camera, Video, Upload, X, Trash2, Image, Play } from "lucide-react";
import { toast } from "sonner";

export interface MediaItem {
  id: number;
  mediaUrl?: string;
  photoUrl?: string;
  mediaType?: "photo" | "video";
  photoType?: string;
  caption?: string | null;
  createdAt?: string | Date;
}

interface PendingFile {
  file: File;
  preview: string;
  caption: string;
  mediaType: "photo" | "video";
  photoType?: string;
}

interface MediaUploadProps {
  media: MediaItem[];
  isLoading?: boolean;
  onUpload: (data: { mediaData: string; mediaType: "photo" | "video"; caption?: string; photoType?: string; fileName?: string }) => Promise<void>;
  onDelete?: (id: number) => Promise<void>;
  showPhotoType?: boolean;
  photoTypeOptions?: { value: string; label: string }[];
  title?: string;
  maxFileSize?: number; // in MB, default 50
}

const DEFAULT_PHOTO_TYPES = [
  { value: "before", label: "Before" },
  { value: "after", label: "After" },
  { value: "progress", label: "Progress" },
  { value: "evidence", label: "Evidence" },
  { value: "other", label: "Other" },
];

export function MediaUpload({
  media,
  isLoading,
  onUpload,
  onDelete,
  showPhotoType = false,
  photoTypeOptions = DEFAULT_PHOTO_TYPES,
  title = "Photos & Videos",
  maxFileSize = 50,
}: MediaUploadProps) {
  const [pending, setPending] = useState<PendingFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [lightboxItem, setLightboxItem] = useState<MediaItem | null>(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: "photo" | "video") => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      if (file.size > maxFileSize * 1024 * 1024) {
        toast.error(`File too large. Max ${maxFileSize}MB allowed.`);
        return;
      }
      const preview = URL.createObjectURL(file);
      setPending((prev) => [...prev, { file, preview, caption: "", mediaType: type, photoType: "other" }]);
    });
    setShowUploadDialog(true);
    // Reset input
    e.target.value = "";
  };

  const removePending = (index: number) => {
    setPending((prev) => {
      const item = prev[index];
      URL.revokeObjectURL(item.preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const uploadAll = async () => {
    if (pending.length === 0) return;
    setUploading(true);
    try {
      for (const item of pending) {
        const base64 = await fileToBase64(item.file);
        await onUpload({
          mediaData: base64,
          mediaType: item.mediaType,
          caption: item.caption || undefined,
          photoType: item.photoType,
          fileName: item.file.name,
        });
      }
      // Clean up previews
      pending.forEach((p) => URL.revokeObjectURL(p.preview));
      setPending([]);
      setShowUploadDialog(false);
      toast.success(`${pending.length} file(s) uploaded successfully`);
    } catch (err) {
      toast.error("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix to get raw base64
        const base64 = result.split(",")[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const getMediaUrl = (item: MediaItem) => item.mediaUrl || item.photoUrl || "";
  const isVideo = (item: MediaItem) => item.mediaType === "video" || getMediaUrl(item).match(/\.(mp4|webm|mov|avi)$/i);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Image className="h-5 w-5" />
          {title}
          {media.length > 0 && <span className="text-sm text-muted-foreground font-normal">({media.length})</span>}
        </h3>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="gap-1"
          >
            <Camera className="h-4 w-4" />
            <span className="hidden sm:inline">Photo</span>
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => videoInputRef.current?.click()}
            className="gap-1"
          >
            <Video className="h-4 w-4" />
            <span className="hidden sm:inline">Video</span>
          </Button>
        </div>
      </div>

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        className="hidden"
        onChange={(e) => handleFileSelect(e, "photo")}
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        capture="environment"
        multiple
        className="hidden"
        onChange={(e) => handleFileSelect(e, "video")}
      />

      {/* Media Gallery Grid */}
      {isLoading ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="aspect-square bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : media.length === 0 ? (
        <Card className="p-6 text-center border-dashed">
          <div className="text-muted-foreground space-y-2">
            <Upload className="h-8 w-8 mx-auto opacity-50" />
            <p className="text-sm">No photos or videos yet</p>
            <p className="text-xs">Tap Photo or Video to capture from your camera</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
          {media.map((item) => (
            <div
              key={item.id}
              className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group border border-border hover:border-primary transition-colors"
              onClick={() => setLightboxItem(item)}
            >
              {isVideo(item) ? (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <Play className="h-8 w-8 text-muted-foreground" />
                  <span className="absolute bottom-1 left-1 text-[10px] bg-black/70 text-white px-1 rounded">VIDEO</span>
                </div>
              ) : (
                <img
                  src={getMediaUrl(item)}
                  alt={item.caption || "Media"}
                  className="w-full h-full object-cover"
                />
              )}
              {item.photoType && item.photoType !== "other" && item.photoType !== "evidence" && (
                <span className="absolute top-1 left-1 text-[10px] bg-black/70 text-white px-1.5 py-0.5 rounded capitalize">
                  {item.photoType}
                </span>
              )}
              {onDelete && (
                <button
                  className="absolute top-1 right-1 p-1 bg-red-500/80 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm("Delete this media?")) onDelete(item.id);
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog && pending.length > 0} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Upload Media ({pending.length} file{pending.length > 1 ? "s" : ""})</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {pending.map((item, idx) => (
              <div key={idx} className="flex gap-3 items-start border rounded-lg p-3">
                <div className="w-16 h-16 flex-shrink-0 rounded overflow-hidden bg-muted">
                  {item.mediaType === "video" ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <Play className="h-6 w-6 text-muted-foreground" />
                    </div>
                  ) : (
                    <img src={item.preview} alt="" className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <p className="text-xs text-muted-foreground truncate">{item.file.name}</p>
                  <Input
                    placeholder="Caption (optional)"
                    value={item.caption}
                    onChange={(e) => {
                      setPending((prev) => prev.map((p, i) => i === idx ? { ...p, caption: e.target.value } : p));
                    }}
                    className="h-8 text-sm"
                  />
                  {showPhotoType && (
                    <Select
                      value={item.photoType || "other"}
                      onValueChange={(val) => {
                        setPending((prev) => prev.map((p, i) => i === idx ? { ...p, photoType: val } : p));
                      }}
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {photoTypeOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => removePending(idx)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => { pending.forEach((p) => URL.revokeObjectURL(p.preview)); setPending([]); setShowUploadDialog(false); }}>
                Cancel
              </Button>
              <Button onClick={uploadAll} disabled={uploading}>
                {uploading ? "Uploading..." : `Upload ${pending.length} File${pending.length > 1 ? "s" : ""}`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Lightbox */}
      <Dialog open={!!lightboxItem} onOpenChange={() => setLightboxItem(null)}>
        <DialogContent className="max-w-3xl p-2 sm:p-4">
          {lightboxItem && (
            <div className="space-y-2">
              {isVideo(lightboxItem) ? (
                <video
                  src={getMediaUrl(lightboxItem)}
                  controls
                  className="w-full max-h-[70vh] rounded-lg"
                />
              ) : (
                <img
                  src={getMediaUrl(lightboxItem)}
                  alt={lightboxItem.caption || "Media"}
                  className="w-full max-h-[70vh] object-contain rounded-lg"
                />
              )}
              {lightboxItem.caption && (
                <p className="text-sm text-center text-muted-foreground">{lightboxItem.caption}</p>
              )}
              {lightboxItem.photoType && lightboxItem.photoType !== "other" && (
                <p className="text-xs text-center capitalize text-muted-foreground">Type: {lightboxItem.photoType}</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

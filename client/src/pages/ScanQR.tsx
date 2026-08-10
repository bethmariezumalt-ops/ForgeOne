import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QrCode, Camera, Search } from "lucide-react";
import { useLocation, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function ScanQR() {
  const params = useParams<{ vin?: string }>();
  const [scanning, setScanning] = useState(false);
  const [manualVin, setManualVin] = useState(params.vin || "");
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [, setLocation] = useLocation();
  const trpcUtils = trpc.useUtils();

  // Auto-search if VIN is in URL (from QR code scan)
  useEffect(() => {
    if (params.vin) {
      const doSearch = async () => {
        try {
          const vehicle = await trpcUtils.vehicle.getByVin.fetch({ vin: params.vin! });
          if (vehicle) {
            setLocation(`/vehicles/${vehicle.id}`);
          } else {
            toast.error("Vehicle not found with VIN: " + params.vin);
          }
        } catch {
          toast.error("Vehicle not found");
        }
      };
      doSearch();
    }
  }, [params.vin]);

  const handleManualSearch = async () => {
    if (!manualVin.trim()) { toast.error("Enter a VIN number"); return; }
    try {
      const vehicle = await trpcUtils.vehicle.getByVin.fetch({ vin: manualVin.trim() });
      if (vehicle) {
        setLocation(`/vehicles/${vehicle.id}`);
      } else {
        toast.error("Vehicle not found with that VIN");
      }
    } catch {
      toast.error("Vehicle not found");
    }
  };

  const startScanning = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setScanning(true);
        scanFrame();
      }
    } catch {
      toast.error("Camera access denied. Please allow camera permissions.");
    }
  };

  const stopScanning = () => {
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
    setScanning(false);
  };

  const scanFrame = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx || video.readyState !== video.HAVE_ENOUGH_DATA) {
      requestAnimationFrame(scanFrame);
      return;
    }
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);
    // Use BarcodeDetector API if available
    if ("BarcodeDetector" in window) {
      const detector = new (window as any).BarcodeDetector({ formats: ["qr_code"] });
      detector.detect(canvas).then((barcodes: any[]) => {
        if (barcodes.length > 0) {
          handleQRResult(barcodes[0].rawValue);
          return;
        }
        if (scanning) requestAnimationFrame(scanFrame);
      }).catch(() => {
        if (scanning) requestAnimationFrame(scanFrame);
      });
    } else {
      // Fallback - just keep scanning
      if (scanning) requestAnimationFrame(scanFrame);
    }
  };

  const handleQRResult = (result: string) => {
    stopScanning();
    // QR code contains URL like /scan/VIN_NUMBER or just the VIN
    const vinMatch = result.match(/vin=([A-Z0-9]+)/i) || result.match(/\/vehicles\/(\d+)/);
    if (vinMatch) {
      if (result.includes("/vehicles/")) {
        setLocation(result.substring(result.indexOf("/vehicles/")));
      } else {
        setManualVin(vinMatch[1]);
        handleManualSearch();
      }
    } else {
      // Treat the whole result as a VIN
      setManualVin(result);
      toast.info("Scanned: " + result + ". Tap Search to look up this VIN.");
    }
  };

  useEffect(() => {
    return () => { stopScanning(); };
  }, []);

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight">Scan Vehicle QR Code</h1>
        <p className="text-muted-foreground mt-1">Scan the QR code on the vehicle or enter VIN manually</p>
      </div>

      {/* Camera Scanner */}
      <Card>
        <CardContent className="p-4">
          {scanning ? (
            <div className="space-y-3">
              <div className="relative rounded-lg overflow-hidden bg-black aspect-[4/3]">
                <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-48 h-48 border-2 border-white/50 rounded-lg" />
                </div>
              </div>
              <canvas ref={canvasRef} className="hidden" />
              <Button variant="outline" onClick={stopScanning} className="w-full">Stop Scanning</Button>
            </div>
          ) : (
            <Button onClick={startScanning} className="w-full h-32 flex-col gap-3" variant="outline">
              <Camera className="h-8 w-8 text-primary" />
              <span className="text-lg font-medium">Tap to Scan QR Code</span>
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Manual VIN Entry */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Search className="h-4 w-4" />
            Manual VIN Lookup
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              value={manualVin}
              onChange={e => setManualVin(e.target.value.toUpperCase())}
              placeholder="Enter VIN number"
              className="font-mono"
              onKeyDown={e => e.key === "Enter" && handleManualSearch()}
            />
            <Button onClick={handleManualSearch}>
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

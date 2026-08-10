import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Camera, Upload, FileText, Check, Loader2, Pencil } from "lucide-react";

export default function InvoiceScanner() {
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [extracted, setExtracted] = useState<any>(null);
  const [creating, setCreating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Editable fields from extraction
  const [clientName, setClientName] = useState("");
  const [description, setDescription] = useState("");
  const [subtotal, setSubtotal] = useState("");
  const [tax, setTax] = useState("");
  const [total, setTotal] = useState("");
  const [notes, setNotes] = useState("");

  const scanMutation = trpc.invoiceScanner.scan.useMutation();
  const createMutation = trpc.invoiceScanner.createFromScan.useMutation();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setPhotoPreview(result);
      // Strip the data:image/...;base64, prefix
      const base64 = result.split(",")[1];
      setPhotoBase64(base64);
      setExtracted(null);
    };
    reader.readAsDataURL(file);
  };

  const handleScan = async () => {
    if (!photoBase64) return;
    setScanning(true);
    try {
      const result = await scanMutation.mutateAsync({ photoData: photoBase64 });
      setExtracted(result.extracted);
      // Pre-fill editable fields
      if (result.extracted) {
        setClientName(result.extracted.clientName || "");
        setDescription(result.extracted.description || "");
        setSubtotal(result.extracted.subtotal || "");
        setTax(result.extracted.tax || "0");
        setTotal(result.extracted.total || "");
        setNotes(result.extracted.notes || "");
      }
      toast.success("Invoice scanned successfully! Review the extracted data below.");
    } catch (err: any) {
      toast.error("Failed to scan invoice: " + (err.message || "Unknown error"));
    } finally {
      setScanning(false);
    }
  };

  const handleCreateInvoice = async () => {
    if (!clientName || !total) {
      toast.error("Client name and total are required");
      return;
    }
    setCreating(true);
    try {
      await createMutation.mutateAsync({
        clientName,
        subtotal: subtotal || total,
        tax: tax || "0",
        total,
        notes: notes || description || "Created from scanned handwritten invoice",
      });
      toast.success("Invoice created successfully!");
      // Reset form
      setPhotoPreview(null);
      setPhotoBase64(null);
      setExtracted(null);
      setClientName("");
      setDescription("");
      setSubtotal("");
      setTax("");
      setTotal("");
      setNotes("");
    } catch (err: any) {
      toast.error("Failed to create invoice: " + (err.message || "Unknown error"));
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Scan Handwritten Invoice</h1>
        <p className="text-muted-foreground">
          Take a photo of a handwritten invoice and convert it into a professional Acme Automotive invoice
        </p>
      </div>

      {/* Step 1: Upload Photo */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Camera className="h-5 w-5 text-blue-600" />
            Step 1: Upload Invoice Photo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileSelect}
            className="hidden"
          />
          <div className="flex gap-3">
            <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="flex-1">
              <Camera className="mr-2 h-4 w-4" />
              Take Photo
            </Button>
            <Button onClick={() => {
              const input = document.createElement("input");
              input.type = "file";
              input.accept = "image/*";
              input.onchange = (e: any) => handleFileSelect(e);
              input.click();
            }} variant="outline" className="flex-1">
              <Upload className="mr-2 h-4 w-4" />
              Upload Image
            </Button>
          </div>
          {photoPreview && (
            <div className="mt-4">
              <img src={photoPreview} alt="Invoice preview" className="max-h-64 rounded-lg border mx-auto" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Step 2: Scan with AI */}
      {photoBase64 && !extracted && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-amber-600" />
              Step 2: Extract Invoice Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              AI will read the handwritten invoice and extract all the information automatically.
            </p>
            <Button onClick={handleScan} disabled={scanning} className="w-full">
              {scanning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Scanning... (this may take a moment)
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  Scan Invoice
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Review & Edit Extracted Data */}
      {extracted && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Pencil className="h-5 w-5 text-green-600" />
              Step 3: Review & Edit
            </CardTitle>
            <Badge variant="outline" className="w-fit">AI Extracted — Review for accuracy</Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Client Name *</Label>
                <Input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Company name" />
              </div>
              <div>
                <Label>Date</Label>
                <Input value={extracted.date || ""} disabled className="bg-muted" />
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Work description" />
            </div>

            {/* Line Items */}
            {extracted.items && extracted.items.length > 0 && (
              <div>
                <Label className="mb-2 block">Line Items</Label>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="text-left p-2">Description</th>
                        <th className="text-right p-2">Qty</th>
                        <th className="text-right p-2">Unit Price</th>
                        <th className="text-right p-2">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {extracted.items.map((item: any, i: number) => (
                        <tr key={i} className="border-t">
                          <td className="p-2">{item.description}</td>
                          <td className="p-2 text-right">{item.quantity || "-"}</td>
                          <td className="p-2 text-right">{item.unitPrice ? `$${item.unitPrice}` : "-"}</td>
                          <td className="p-2 text-right">{item.total ? `$${item.total}` : "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Subtotal</Label>
                <Input value={subtotal} onChange={(e) => setSubtotal(e.target.value)} placeholder="0.00" />
              </div>
              <div>
                <Label>Tax</Label>
                <Input value={tax} onChange={(e) => setTax(e.target.value)} placeholder="0.00" />
              </div>
              <div>
                <Label>Total *</Label>
                <Input value={total} onChange={(e) => setTotal(e.target.value)} placeholder="0.00" className="font-bold" />
              </div>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Additional notes" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Create Invoice */}
      {extracted && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Check className="h-5 w-5 text-green-600" />
              Step 4: Create Professional Invoice
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              This will create a professional Acme Automotive invoice that can be printed or emailed.
            </p>
            <Button onClick={handleCreateInvoice} disabled={creating} className="w-full">
              {creating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Invoice...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Create Invoice
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

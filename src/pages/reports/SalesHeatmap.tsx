import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload } from "lucide-react";
import { toast } from "sonner";

interface SalesData {
  product_id: string;
  product_name: string;
  location_x: number;
  location_y: number;
  total_sold: number;
}

export default function SalesHeatmap() {
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [floorPlanUrl, setFloorPlanUrl] = useState<string>("");
  const [organizationId, setOrganizationId] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    loadOrganization();
  }, []);

  useEffect(() => {
    if (organizationId) {
      loadSalesData();
    }
  }, [organizationId]);

  useEffect(() => {
    if (salesData.length > 0 && floorPlanUrl && canvasRef.current) {
      drawHeatmap();
    }
  }, [salesData, floorPlanUrl]);

  const loadOrganization = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (profile?.organization_id) {
      setOrganizationId(profile.organization_id);
    }
  };

  const loadSalesData = async () => {
    const { data: orderLines } = await supabase
      .from("pos_order_lines")
      .select(`
        product_id,
        quantity,
        products (
          name,
          location_x,
          location_y
        )
      `)
      .not("products.location_x", "is", null)
      .not("products.location_y", "is", null);

    if (orderLines) {
      const aggregated = orderLines.reduce((acc: any, line: any) => {
        const productId = line.product_id;
        if (!acc[productId]) {
          acc[productId] = {
            product_id: productId,
            product_name: line.products?.name || "Unknown",
            location_x: line.products?.location_x || 0,
            location_y: line.products?.location_y || 0,
            total_sold: 0,
          };
        }
        acc[productId].total_sold += Number(line.quantity);
        return acc;
      }, {});

      setSalesData(Object.values(aggregated));
    }
  };

  const handleFloorPlanUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileExt = file.name.split('.').pop();
    const fileName = `${organizationId}-floorplan-${Date.now()}.${fileExt}`;

    const { error: uploadError, data } = await supabase.storage
      .from('product-images')
      .upload(fileName, file);

    if (uploadError) {
      toast.error("Failed to upload floor plan");
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(fileName);

    setFloorPlanUrl(publicUrl);
    toast.success("Floor plan uploaded");
  };

  const drawHeatmap = () => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match image
    canvas.width = img.naturalWidth || 800;
    canvas.height = img.naturalHeight || 600;

    // Draw floor plan
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // Find max sales for normalization
    const maxSales = Math.max(...salesData.map(d => d.total_sold), 1);

    // Draw heatmap points
    salesData.forEach(data => {
      const x = (Number(data.location_x) / 100) * canvas.width;
      const y = (Number(data.location_y) / 100) * canvas.height;
      const intensity = data.total_sold / maxSales;

      // Create radial gradient for heat point
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, 50);
      
      // Color based on intensity (blue -> green -> yellow -> red)
      if (intensity < 0.25) {
        gradient.addColorStop(0, `rgba(0, 0, 255, ${intensity * 2})`);
        gradient.addColorStop(1, 'rgba(0, 0, 255, 0)');
      } else if (intensity < 0.5) {
        gradient.addColorStop(0, `rgba(0, 255, 0, ${intensity * 2})`);
        gradient.addColorStop(1, 'rgba(0, 255, 0, 0)');
      } else if (intensity < 0.75) {
        gradient.addColorStop(0, `rgba(255, 255, 0, ${intensity * 2})`);
        gradient.addColorStop(1, 'rgba(255, 255, 0, 0)');
      } else {
        gradient.addColorStop(0, `rgba(255, 0, 0, ${intensity * 2})`);
        gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
      }

      ctx.fillStyle = gradient;
      ctx.fillRect(x - 50, y - 50, 100, 100);
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Sales Heatmap</h1>
        <p className="text-muted-foreground">Visualize product sales locations</p>
      </div>

      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="floorplan">Upload Floor Plan</Label>
            <div className="flex gap-2 mt-2">
              <Input
                id="floorplan"
                type="file"
                accept="image/*"
                onChange={handleFloorPlanUpload}
                className="flex-1"
              />
              <Button variant="outline" size="icon">
                <Upload className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {floorPlanUrl && (
            <div className="relative">
              <img
                ref={imageRef}
                src={floorPlanUrl}
                alt="Floor Plan"
                className="hidden"
                onLoad={drawHeatmap}
              />
              <canvas
                ref={canvasRef}
                className="w-full border rounded-lg"
              />
            </div>
          )}

          {!floorPlanUrl && (
            <div className="border-2 border-dashed rounded-lg p-12 text-center">
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                Upload a floor plan to visualize sales heatmap
              </p>
            </div>
          )}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Sales Data</h2>
        <div className="space-y-2">
          {salesData.length === 0 ? (
            <p className="text-muted-foreground">No sales data with location coordinates</p>
          ) : (
            <div className="grid gap-2">
              {salesData.map(item => (
                <div key={item.product_id} className="flex justify-between items-center p-2 border rounded">
                  <span>{item.product_name}</span>
                  <span className="text-muted-foreground">
                    Sold: {item.total_sold} | Location: ({item.location_x}%, {item.location_y}%)
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      <Card className="p-6 bg-muted/50">
        <h3 className="font-semibold mb-2">How to use:</h3>
        <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
          <li>Upload your store floor plan image</li>
          <li>Set location coordinates (0-100% for X and Y) for each product in the Inventory</li>
          <li>The heatmap shows where products are sold most frequently</li>
          <li>Colors: Blue (low) → Green → Yellow → Red (high sales)</li>
        </ol>
      </Card>
    </div>
  );
}

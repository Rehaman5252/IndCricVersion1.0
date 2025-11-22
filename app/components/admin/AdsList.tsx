"use client";

import { useEffect, useState } from "react";
import { Ad, AdSlot, AD_SLOT_NAMES, VIDEO_AD_SLOTS } from "@/types/ads";
import { getAllAds, deleteAd, updateAd } from "@/lib/ad-service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface AdsListProps {
  filterMode?: "none" | "total" | "active" | "deactivated" | "revenue";
  onUpdate?: () => void;
}

// Convert raw API ads → strongly typed Ad
function sanitizeAds(raw: any[]): Ad[] {
  const validSlots = Object.keys(AD_SLOT_NAMES) as AdSlot[];

  return raw.map((r, index) => {
    const slot = r.adSlot as string;

    const adSlot: AdSlot = validSlots.includes(slot as AdSlot)
      ? (slot as AdSlot)
      : "Mixed";

    return {
      id: String(r.id ?? index),
      companyName: String(r.companyName ?? "Unknown"),
      adSlot,
      adType: r.adType === "video" ? "video" : "image",
      mediaUrl: String(r.mediaUrl ?? ""),
      revenue: Number(r.revenue ?? 0),
      isActive: Boolean(r.isActive),
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    };
  });
}

export default function AdsList({ filterMode = "none", onUpdate }: AdsListProps) {
  const { toast } = useToast();
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRevenue, setEditRevenue] = useState("");

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const rawAds = await getAllAds();
        const cleanAds = sanitizeAds(rawAds);
        setAds(cleanAds);
      } catch (err) {
        console.error(err);
        toast({
          title: "Error",
          description: "Failed to load ads",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filteredAds = (() => {
    switch (filterMode) {
      case "active":
        return ads.filter((a) => a.isActive);
      case "deactivated":
        return ads.filter((a) => !a.isActive);
      case "revenue":
        return [...ads].sort((a, b) => b.revenue - a.revenue);
      default:
        return ads;
    }
  })();

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this ad?")) return;
    try {
      setDeleting(id);
      await deleteAd(id);
      setAds((prev) => prev.filter((a) => a.id !== id));
      onUpdate?.();
      toast({ title: "Deleted", description: "Ad removed." });
    } catch (e) {
      toast({ title: "Error", description: "Could not delete", variant: "destructive" });
    } finally {
      setDeleting(null);
    }
  };

  const handleToggleActive = async (ad: Ad) => {
    try {
      await updateAd(ad.id, { isActive: !ad.isActive });
      setAds((prev) => prev.map((a) => (a.id === ad.id ? { ...a, isActive: !a.isActive } : a)));
      onUpdate?.();
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
    }
  };

  const handleUpdateRevenue = async (id: string) => {
    if (!editRevenue || isNaN(Number(editRevenue))) {
      toast({ title: "Invalid", description: "Enter valid revenue", variant: "destructive" });
      return;
    }

    try {
      await updateAd(id, { revenue: Number(editRevenue) });
      setAds((prev) =>
        prev.map((a) => (a.id === id ? { ...a, revenue: Number(editRevenue) } : a))
      );
      setEditingId(null);
      setEditRevenue("");
      onUpdate?.();
    } catch (err) {
      toast({ title: "Error", description: "Failed to update revenue", variant: "destructive" });
    }
  };

  if (loading) return <div className="text-center py-6">Loading ads…</div>;

  if (filteredAds.length === 0)
    return (
      <Card>
        <CardContent className="text-center py-6">
          No ads found {filterMode !== "none" && `(filter: ${filterMode})`}
        </CardContent>
      </Card>
    );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Displaying {filteredAds.length} Ads</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {filteredAds.map((ad) => (
            <div key={ad.id} className="p-4 bg-gray-900/40 rounded-lg border border-gray-700">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                
                {/* Image / Video */}
                <div>
                  {ad.adType === "image" ? (
                    <img src={ad.mediaUrl} alt="ad" className="rounded w-full h-24 object-cover" />
                  ) : (
                    <div className="w-full h-24 bg-gray-800 rounded flex items-center justify-center">
                      🎬 VIDEO
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="md:col-span-2">
                  <p className="font-bold text-white">{ad.companyName}</p>

                  <p className="text-sm text-gray-300">
                    Slot:{" "}
                    <span className="text-yellow-400 font-semibold">
                      {AD_SLOT_NAMES[ad.adSlot]}
                    </span>
                    {VIDEO_AD_SLOTS.includes(ad.adSlot) && (
                      <span className="ml-2 text-red-400">🎥 Video</span>
                    )}
                  </p>
                </div>

                {/* Revenue */}
                <div>
                  {editingId === ad.id ? (
                    <div className="space-y-2">
                      <input
                        type="number"
                        value={editRevenue}
                        onChange={(e) => setEditRevenue(e.target.value)}
                        className="bg-gray-800 w-full px-2 py-1 rounded text-white"
                      />
                      <Button onClick={() => handleUpdateRevenue(ad.id)}>Save</Button>
                    </div>
                  ) : (
                    <div
                      className="cursor-pointer"
                      onClick={() => {
                        setEditingId(ad.id);
                        setEditRevenue(String(ad.revenue));
                      }}
                    >
                      <p className="text-gray-400 text-sm">Revenue</p>
                      <p className="text-green-400 font-bold">₹{ad.revenue}</p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="space-y-2">
                  <Button onClick={() => handleToggleActive(ad)}>
                    {ad.isActive ? "Active" : "Inactive"}
                  </Button>
                  <Button
                    onClick={() => handleDelete(ad.id)}
                    disabled={deleting === ad.id}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {deleting === ad.id ? "Deleting…" : "Delete"}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

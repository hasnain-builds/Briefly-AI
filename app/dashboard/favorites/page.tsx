"use client";

import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Heart } from "lucide-react";

export default function FavoritesPage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-500 bg-clip-text text-transparent flex items-center gap-3">
          <Heart className="size-8 text-rose-500 fill-rose-500" />
          Favorites
        </h1>
        <p className="text-zinc-400">
          Your bookmarked and saved AI summaries.
        </p>
      </div>

      <Card className="border border-zinc-800 bg-zinc-950/50 backdrop-blur-md shadow-lg p-8 text-center">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-white">No Favorites Yet</CardTitle>
          <CardDescription className="text-zinc-500">
            Star or bookmark your summaries in the dashboard to access them quickly here.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}

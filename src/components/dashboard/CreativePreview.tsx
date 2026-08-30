import { Images, Play, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import type { Creative } from "@/types/ads";

const accentClasses = {
  blue: "from-chart-1/25 to-chart-2/10",
  violet: "from-chart-4/25 to-chart-1/10",
  amber: "from-chart-3/30 to-chart-5/10",
  emerald: "from-chart-5/25 to-chart-2/10",
  rose: "from-chart-4/30 to-chart-3/10",
} as const;

const formatIcon = {
  image: Sparkles,
  video: Play,
  carousel: Images,
} as const;

export function CreativePreview({ creative }: { creative: Creative }) {
  const Icon = formatIcon[creative.format];

  return (
    <Card className="overflow-hidden">
      <div
        className={cn(
          "flex h-40 items-center justify-center bg-gradient-to-br",
          accentClasses[creative.accent],
        )}
      >
        <span className="bg-card/80 text-foreground flex size-12 items-center justify-center rounded-full backdrop-blur">
          <Icon className="size-5" />
        </span>
      </div>
      <CardContent className="space-y-2">
        <div className="flex items-center gap-2">
          <Badge tone="outline" className="capitalize">
            {creative.format}
          </Badge>
          <span className="text-muted-foreground truncate text-xs">
            {creative.name}
          </span>
        </div>
        <p className="text-sm font-semibold leading-snug">{creative.headline}</p>
        <p className="text-muted-foreground text-xs leading-relaxed">
          {creative.body}
        </p>
        <p className="text-primary text-xs font-medium">
          {creative.callToAction}
        </p>
      </CardContent>
    </Card>
  );
}

import { Card, CardContent } from "../components/ui/card";
import { TrendingUp, TrendingDown, Minus, LucideIcon } from "lucide-react";
import { cn } from "../lib/utils";

interface KPICardProps {
  title: string;
  value: string | number;
  change?: number;
  trend?: "up" | "down" | "stable";
  type?: "success" | "warning" | "danger" | "info";
  icon?: LucideIcon;
}

export function KPICard({ title, value, change, trend, type = "info", icon: Icon }: KPICardProps) {
  const getTrendIcon = () => {
    if (trend === "up") return <TrendingUp className="h-4 w-4" />;
    if (trend === "down") return <TrendingDown className="h-4 w-4" />;
    return <Minus className="h-4 w-4" />;
  };

  const getTypeColor = () => {
    switch (type) {
      case "success":
        return "text-success";
      case "warning":
        return "text-warning";
      case "danger":
        return "text-destructive";
      default:
        return "text-info";
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground mb-2">{title}</p>
            <h3 className="text-2xl font-bold text-foreground mb-2">{value}</h3>
            {change !== undefined && (
              <div className={cn("flex items-center gap-1 text-sm", getTypeColor())}>
                {getTrendIcon()}
                <span>{Math.abs(change)}%</span>
              </div>
            )}
          </div>
          {Icon && (
            <div className={cn("p-3 rounded-lg", `bg-${type}/10`)}>
              <Icon className={cn("h-6 w-6", getTypeColor())} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

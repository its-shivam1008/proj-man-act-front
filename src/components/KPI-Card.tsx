import { cn } from '../lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

interface KPICardProps {
  label: string;
  value: string | number;
  change?: number;
  trend?: 'up' | 'down' | 'stable';
  type?: 'success' | 'warning' | 'danger' | 'info';
  icon?: React.ReactNode;
}

export default function KPICard({ 
  label, 
  value, 
  change, 
  trend, 
  type = 'info',
  icon 
}: KPICardProps) {
  const getTrendIcon = () => {
    if (!trend) return null;
    
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4" />;
      case 'down':
        return <TrendingDown className="w-4 h-4" />;
      default:
        return <Minus className="w-4 h-4" />;
    }
  };

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return 'border-l-4 border-l-success';
      case 'warning':
        return 'border-l-4 border-l-warning';
      case 'danger':
        return 'border-l-4 border-l-destructive';
      default:
        return 'border-l-4 border-l-primary';
    }
  };

  return (
    <Card className={cn("bg-gradient-card shadow-lg hover:shadow-xl transition-shadow", getTypeStyles())}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-foreground">{value}</div>
        {change !== undefined && (
          <div className={cn(
            "flex items-center gap-1 mt-2 text-sm",
            trend === 'up' ? "text-success" : trend === 'down' ? "text-destructive" : "text-muted-foreground"
          )}>
            {getTrendIcon()}
            <span>{change > 0 ? '+' : ''}{change}%</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

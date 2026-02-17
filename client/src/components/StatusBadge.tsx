import { cn } from "@/lib/utils";
import { CheckCircle2, AlertOctagon, XCircle, Clock } from "lucide-react";

type Status = "PENDING" | "CLEARED" | "BOUNCED" | "FRAUD";

interface StatusBadgeProps {
  status: string; // Using string to accept raw DB values
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const normalizedStatus = status as Status;

  const styles = {
    PENDING: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    CLEARED: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    BOUNCED: "bg-orange-500/10 text-orange-500 border-orange-500/20",
    FRAUD: "bg-red-500/10 text-red-500 border-red-500/20",
  };

  const icons = {
    PENDING: Clock,
    CLEARED: CheckCircle2,
    BOUNCED: XCircle,
    FRAUD: AlertOctagon,
  };

  const Icon = icons[normalizedStatus] || Clock;
  const style = styles[normalizedStatus] || styles.PENDING;

  return (
    <div className={cn(
      "inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-medium uppercase tracking-wider",
      style,
      className
    )}>
      <Icon className="w-3.5 h-3.5" />
      {status}
    </div>
  );
}

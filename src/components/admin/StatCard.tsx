import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  note?: string;
}

export function StatCard({ label, value, icon, note }: StatCardProps) {
  return (
    <Card className="rounded-3xl border-border/80 shadow-none">
      <CardContent className="flex items-start justify-between p-5">
        <div className="space-y-2">
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            {label}
          </div>
          <div className="text-3xl font-semibold tracking-tight text-foreground">
            {value}
          </div>
          {note && <div className="text-sm text-muted-foreground">{note}</div>}
        </div>
        {icon && (
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            {icon}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

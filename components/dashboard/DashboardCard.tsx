import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type DashboardCardProps = {
  title: string;
  description?: string;
  children?: React.ReactNode;
};

export function DashboardCard({
  title,
  description,
  children,
}: DashboardCardProps) {
  return (
    <Card className="md3-card w-full rounded-xl">
      <CardHeader>
        <CardTitle className="text-base font-semibold text-[var(--md-sys-color-on-surface)]">
          {title}
        </CardTitle>
        {description ? (
          <CardDescription className="text-[var(--md-sys-color-on-surface-variant)]">
            {description}
          </CardDescription>
        ) : null}
      </CardHeader>
      {children ? (
        <CardContent className="flex flex-wrap gap-2">{children}</CardContent>
      ) : null}
    </Card>
  );
}

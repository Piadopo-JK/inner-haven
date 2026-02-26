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
    <Card className="md3-card w-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      {children ? <CardContent className="flex flex-wrap gap-2">{children}</CardContent> : null}
    </Card>
  );
}

import { Card, CardHeader, CardTitle } from "@/components/ui/Card";

export interface DetailField {
  label: string;
  value: string;
}

interface Props {
  title: string;
  fields: DetailField[];
}

/**
 * One labeled group of setup fields, e.g. "Budget & schedule" or "Audience".
 * Detail pages compose several of these instead of one flat fact grid, so
 * the setup reads the way a real ads platform groups it.
 */
export function DetailPanel({ title, fields }: Props) {
  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <dl className="divide-y">
        {fields.map((field) => (
          <div
            key={field.label}
            className="flex items-start justify-between gap-4 px-5 py-3"
          >
            <dt className="text-muted-foreground w-2/5 shrink-0 text-xs">
              {field.label}
            </dt>
            <dd className="min-w-0 flex-1 text-right text-sm break-words">
              {field.value}
            </dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}

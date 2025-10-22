import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function ExportTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Export Transcript</CardTitle>
        <CardDescription>
          Save structured content for use in other tools.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Export options coming soon. Let us know which formats you&apos;d like
          to see first!
        </p>
      </CardContent>
    </Card>
  );
}

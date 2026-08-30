import { LinkButton } from "@/components/ui/LinkButton";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/dashboard/EmptyState";

export default function NotFound() {
  return (
    <Card>
      <EmptyState
        title="That record is not in this account"
        description="The campaign, ad set, or ad you opened does not exist, or it belongs to a different ad account."
        action={
          <LinkButton href="/campaigns" variant="outline" size="sm" className="mt-2">
            Back to campaigns
          </LinkButton>
        }
      />
    </Card>
  );
}

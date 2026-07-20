import { CreateSubscriptionFormContent } from "@/components/pages/subscriptions/create/CreateSubscriptionFormContent";

interface CreateSubscriptionFormProps {
  userId: string;
}

export function CreateSubscriptionForm({
  userId,
}: CreateSubscriptionFormProps) {
  return <CreateSubscriptionFormContent userId={userId} />;
}

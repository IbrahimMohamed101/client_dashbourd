import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Search, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { getApiErrorMessage } from "@/lib/apiErrors";

const searchSchema = z.object({
  phone: z.string().min(8, "الرجاء إدخال رقم هاتف صحيح (8 أرقام على الأقل)"),
});

type SearchFormValues = z.infer<typeof searchSchema>;

interface CustomerSearchProps {
  onSearch: (phone: string) => void;
  isSearching: boolean;
  error: unknown;
}

export const CustomerSearch: React.FC<CustomerSearchProps> = ({
  onSearch,
  isSearching,
  error,
}) => {
  const searchForm = useForm<SearchFormValues>({
    resolver: zodResolver(searchSchema),
    defaultValues: { phone: "" },
  });

  const onSubmit = (values: SearchFormValues) => {
    onSearch(values.phone.trim());
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Search className="h-5 w-5" />
          البحث بالهاتف
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...searchForm}>
          <form
            onSubmit={searchForm.handleSubmit(onSubmit)}
            className="flex items-start gap-3"
          >
            <FormField
              control={searchForm.control}
              name="phone"
              render={({ field }) => (
                <FormItem className="flex-1 space-y-0">
                  <FormControl>
                    <Input
                      type="tel"
                      placeholder="أدخل رقم الهاتف..."
                      {...field}
                      dir="ltr"
                    />
                  </FormControl>
                  <FormMessage className="pt-2" />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isSearching}>
              {isSearching ? "جاري البحث..." : "بحث"}
            </Button>
          </form>
        </Form>

        {!!error && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {getApiErrorMessage(error) ||
                "حدث خطأ أثناء البحث. تأكد من الرقم وأعد المحاولة."}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

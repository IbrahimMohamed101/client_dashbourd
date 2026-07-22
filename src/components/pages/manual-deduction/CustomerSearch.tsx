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

const DEFAULT_PHONE_PREFIX = "+966";

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
    defaultValues: { phone: DEFAULT_PHONE_PREFIX },
  });

  const onSubmit = (values: SearchFormValues) => {
    onSearch(values.phone.trim());
  };

  return (
    <Card className="min-w-0 overflow-hidden">
      <CardHeader className="px-4 sm:px-6">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Search className="h-5 w-5 shrink-0" />
          البحث بالهاتف
        </CardTitle>
      </CardHeader>
      <CardContent className="min-w-0 px-4 sm:px-6">
        <Form {...searchForm}>
          <form
            onSubmit={searchForm.handleSubmit(onSubmit)}
            className="flex min-w-0 flex-col items-stretch gap-3 sm:flex-row sm:items-start"
          >
            <FormField
              control={searchForm.control}
              name="phone"
              render={({ field }) => (
                <FormItem className="min-w-0 flex-1 space-y-0">
                  <FormControl>
                    <Input
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      placeholder="أدخل رقم الهاتف..."
                      {...field}
                      dir="ltr"
                      className="min-w-0 w-full"
                    />
                  </FormControl>
                  <FormMessage className="pt-2" />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              disabled={isSearching}
              className="w-full shrink-0 sm:w-auto"
            >
              {isSearching ? "جاري البحث..." : "بحث"}
            </Button>
          </form>
        </Form>

        {!!error && (
          <Alert variant="destructive" className="mt-4 min-w-0">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <AlertDescription className="break-words">
              {getApiErrorMessage(error) ||
                "حدث خطأ أثناء البحث. تأكد من الرقم وأعد المحاولة."}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};
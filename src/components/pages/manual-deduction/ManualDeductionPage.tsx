import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";
import { searchSubscription, executeManualDeduction } from "@/utils/fetchDashboardOpsData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ManualDeductionPage() {
  const [phone, setPhone] = useState("");
  const [searchedPhone, setSearchedPhone] = useState("");
  const [selectedSub, setSelectedSub] = useState<any>(null);

  const [form, setForm] = useState({
    regularMeals: 0,
    premiumMeals: 0,
    reason: "",
    notes: "",
  });

  const { data: subs = [], isLoading } = useQuery({
    queryKey: ["subscription-search", searchedPhone],
    queryFn: () => searchSubscription(searchedPhone),
    enabled: !!searchedPhone,
  });

  const deductionMutation = useMutation({
    mutationFn: (payload: any) => executeManualDeduction(payload),
    onSuccess: () => {
      toast.success("تم خصم الوجبات بنجاح");
      setForm({ regularMeals: 0, premiumMeals: 0, reason: "", notes: "" });
      setSelectedSub(null);
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || error.message || "حدث خطأ أثناء الخصم";
      toast.error(msg);
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.trim()) {
      setSearchedPhone(phone.trim());
      setSelectedSub(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSub) return;
    deductionMutation.mutate({
      id: selectedSub.id,
      ...form,
    });
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">الخصم اليدوي للوجبات</h1>

      <form onSubmit={handleSearch} className="flex gap-2 mb-8">
        <Input 
          placeholder="رقم هاتف العميل..." 
          value={phone} 
          onChange={(e) => setPhone(e.target.value)} 
          className="flex-1"
        />
        <Button type="submit" disabled={isLoading}>بحث</Button>
      </form>

      {subs.length > 0 && !selectedSub && (
        <div className="space-y-4">
          <h3 className="font-bold text-lg">اختر الاشتراك:</h3>
          {subs.map((sub: any) => (
            <div key={sub.id} className="p-4 border rounded-xl flex justify-between items-center bg-white cursor-pointer hover:bg-gray-50" onClick={() => setSelectedSub(sub)}>
              <div>
                <div className="font-bold">{sub.planName || "اشتراك"}</div>
                <div className="text-sm text-gray-500">{sub.mode === "delivery" ? "توصيل" : "استلام"}</div>
              </div>
              <Button variant="outline">اختيار</Button>
            </div>
          ))}
        </div>
      )}

      {selectedSub && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow space-y-4">
          <div className="flex justify-between items-center mb-4 pb-4 border-b">
            <div>
              <h3 className="font-bold text-lg">الاشتراك المحدد</h3>
              <p className="text-sm text-gray-500">طريقة الاستلام: {selectedSub.mode === "delivery" ? "توصيل" : "استلام من الفرع"}</p>
            </div>
            <Button variant="ghost" type="button" onClick={() => setSelectedSub(null)}>تغيير</Button>
          </div>

          {selectedSub.mode === "delivery" && selectedSub.hasDeliveryDeductionToday && (
            <div className="bg-red-50 text-red-700 p-4 rounded-lg flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 mt-0.5" />
              <div>
                <p className="font-bold">تنبيه!</p>
                <p className="text-sm">تم خصم وجبة توصيل لهذا اليوم. لا يمكن إضافة خصم توصيل آخر في نفس اليوم.</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1">وجبات عادية</label>
              <Input 
                type="number" 
                min="0" 
                value={form.regularMeals} 
                onChange={(e) => setForm({ ...form, regularMeals: parseInt(e.target.value) || 0 })} 
              />
            </div>
            <div>
              <label className="block text-sm mb-1">وجبات بريميوم</label>
              <Input 
                type="number" 
                min="0" 
                value={form.premiumMeals} 
                onChange={(e) => setForm({ ...form, premiumMeals: parseInt(e.target.value) || 0 })} 
              />
            </div>
          </div>

          <div>
            <label className="block text-sm mb-1">سبب الخصم</label>
            <Input 
              required 
              value={form.reason} 
              onChange={(e) => setForm({ ...form, reason: e.target.value })} 
              placeholder="مثال: خصم يدوي لتعويض العميل" 
            />
          </div>

          <div>
            <label className="block text-sm mb-1">ملاحظات إضافية</label>
            <textarea 
              className="w-full border rounded-md p-2 text-sm min-h-[80px]" 
              value={form.notes} 
              onChange={(e) => setForm({ ...form, notes: e.target.value })} 
            />
          </div>

          <div className="pt-4">
            <Button 
              type="submit" 
              className="w-full" 
              disabled={deductionMutation.isPending || (selectedSub.mode === "delivery" && selectedSub.hasDeliveryDeductionToday)}
            >
              تنفيذ الخصم
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

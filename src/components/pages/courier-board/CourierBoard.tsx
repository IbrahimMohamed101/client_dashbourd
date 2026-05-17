import React from "react";
import { Loader } from "@/components/global/loader";
import {
  useCourierQueueQuery,
  useCourierActionMutation,
} from "@/hooks/useCourierBoard";
import { CourierTaskCard } from "./CourierTaskCard";

export const CourierBoard: React.FC = () => {
  const { data: queueData, isLoading } = useCourierQueueQuery();
  const updateStatus = useCourierActionMutation();

  if (isLoading) return <Loader label="جاري تحميل مهام التوصيل..." />;

  const tasks = queueData?.data?.items || [];

  return (
    <div
      className="flex min-h-[calc(100vh-120px)] flex-col gap-6 p-6"
      dir="rtl"
    >
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">
          لوحة مناديب التوصيل
        </h1>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 animate-pulse rounded-full bg-green-500"></div>
            <span className="text-sm font-medium">متصل</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
        {tasks.length === 0 ? (
          <p className="col-span-full py-8 text-center text-muted-foreground">
            لا توجد مهام توصيل حالياً
          </p>
        ) : (
          tasks.map((task) => (
            <CourierTaskCard
              key={task.id}
              task={task}
              updateStatus={(id, action) => updateStatus.mutate({ id, action })}
              isPending={updateStatus.isPending}
            />
          ))
        )}
      </div>
    </div>
  );
};

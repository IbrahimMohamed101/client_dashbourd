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
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">لوحة التوصيل</h1>
      
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

export default CourierBoard;

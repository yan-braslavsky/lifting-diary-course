"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";

export function DateSelector() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get date from URL or default to today
  const dateParam = searchParams.get("date");
  const selectedDate = dateParam ? new Date(dateParam) : new Date();

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;

    // Update URL with new date
    const params = new URLSearchParams(searchParams);
    params.set("date", date.toISOString());
    router.push(`?${params.toString()}`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Select Date</CardTitle>
        <CardDescription>
          Choose a date to view your workouts
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleDateSelect}
          className="rounded-md border"
        />
        <div className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
          Selected: <span className="font-semibold text-zinc-900 dark:text-zinc-50">
            {format(selectedDate, "do MMM yyyy")}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

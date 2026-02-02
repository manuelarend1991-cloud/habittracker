
import * as React from "react";
import { createContext, useCallback, useContext, useEffect } from "react";
import { ExtensionStorage } from "@bacons/apple-targets";
import { DashboardData } from "@/types/habit";

// Initialize storage with your group ID
const storage = new ExtensionStorage(
  "group.com.anonymous.Natively"
);

type WidgetContextType = {
  refreshWidget: () => void;
  updateWidgetData: (dashboardData: DashboardData | null) => void;
};

const WidgetContext = createContext<WidgetContextType | null>(null);

export function WidgetProvider({ children }: { children: React.ReactNode }) {
  const updateWidgetData = useCallback((dashboardData: DashboardData | null) => {
    console.log('[WidgetContext] Updating widget data...');
    
    if (!dashboardData) {
      console.log('[WidgetContext] No dashboard data, clearing widget');
      storage.set("widget_state", null);
      ExtensionStorage.reloadWidget();
      return;
    }

    // Generate last 7 days
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date.toISOString().split('T')[0];
    });

    // Transform dashboard data into widget-friendly format
    const widgetData = {
      habits: dashboardData.habits.map(habit => {
        // Get recent completions for the last 7 days
        const completionDates = habit.recentCompletions.map(c => 
          new Date(c.completedAt).toISOString().split('T')[0]
        );
        
        const missedCompletionDates = habit.recentCompletions
          .filter(c => c.isMissedCompletion)
          .map(c => new Date(c.completedAt).toISOString().split('T')[0]);

        // Check which of the last 7 days have completions
        const last7DaysStatus = last7Days.map(dateStr => ({
          date: dateStr,
          completed: completionDates.includes(dateStr),
          missed: missedCompletionDates.includes(dateStr)
        }));

        return {
          id: habit.id,
          name: habit.name,
          color: habit.color,
          icon: habit.icon,
          currentStreak: habit.currentStreak,
          maxStreak: habit.maxStreak,
          completionsToday: habit.completionsToday,
          goalCount: habit.goalCount,
          nextCompletionPoints: habit.nextCompletionPoints,
          last7Days: last7DaysStatus
        };
      }),
      lastUpdated: new Date().toISOString()
    };

    console.log('[WidgetContext] Setting widget data:', widgetData);
    storage.set("widget_state", JSON.stringify(widgetData));
    ExtensionStorage.reloadWidget();
  }, []);

  const refreshWidget = useCallback(() => {
    console.log('[WidgetContext] Manually refreshing widget');
    ExtensionStorage.reloadWidget();
  }, []);

  return (
    <WidgetContext.Provider value={{ refreshWidget, updateWidgetData }}>
      {children}
    </WidgetContext.Provider>
  );
}

export const useWidget = () => {
  const context = useContext(WidgetContext);
  if (!context) {
    throw new Error("useWidget must be used within a WidgetProvider");
  }
  return context;
};

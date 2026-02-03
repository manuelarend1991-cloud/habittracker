
import React, { createContext, useContext, ReactNode } from 'react';
import { useUser } from 'expo-superwall';

interface SubscriptionContextType {
  isPremium: boolean;
  canAddMoreHabits: (currentHabitCount: number) => boolean;
  maxFreeHabits: number;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

const MAX_FREE_HABITS = 1;

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { subscriptionStatus } = useUser();
  
  // User is premium if subscription status is ACTIVE
  const isPremiumUser = subscriptionStatus?.status === 'ACTIVE';
  
  const canAddMoreHabitsFunc = (currentHabitCount: number): boolean => {
    if (isPremiumUser) {
      return true; // Premium users can add unlimited habits
    }
    return currentHabitCount < MAX_FREE_HABITS;
  };

  return (
    <SubscriptionContext.Provider
      value={{
        isPremium: isPremiumUser,
        canAddMoreHabits: canAddMoreHabitsFunc,
        maxFreeHabits: MAX_FREE_HABITS,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within SubscriptionProvider');
  }
  return context;
}

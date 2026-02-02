# Habit Tracker

A comprehensive habit tracking app with a gamified point system to motivate consistent behavior.

This app was built using [Natively.dev](https://natively.dev) - a platform for creating mobile apps.

## 🎯 Point System

The app features a sophisticated point system designed to reward consistency and long streaks:

### ✨ Earning Points (Regular Completions)

- **Day 1 of a streak**: 1 point
- **Day 2 of a streak**: 2 points  
- **Day 3 of a streak**: 3 points
- **And so on...** (points = current streak day)

The longer your streak, the more valuable each completion becomes!

### 🔄 Streak Interruption

If you miss a day and break your streak:
- Your **point counter resets** to 1
- The next completion will earn only 1 point
- You start building a new point streak from scratch
- Your **streak counter** also resets to 0

### 📅 Adding Missed Completions

You can retroactively add missed completions, but there's a cost:

- **Fixed cost**: 10 points (deducted from your total points)
- **Continues your streak counter** (doesn't break the streak)
- **⚠️ Resets point worthiness**: Your next completion will earn only 1 point, regardless of your current streak length
- **❌ Blocked if insufficient points**: You must have at least 10 points to add a missed completion

**Important**: Adding a missed completion only continues the streak counter, but never continues the worthiness of the points-streak. This prevents gaming the system while still allowing you to maintain your streak.

### 🚫 Point Floor

- **Total points can never go below 0**
- If adding a missed completion would result in negative points, the action is blocked
- You'll see an error message: "Not enough points for this!"

## 🎮 Features

- **Multiple Habits**: Track unlimited habits with custom colors and goals
- **Streak Tracking**: Monitor current and best streaks for each habit
- **Daily Goals**: Set completion targets per time period
- **Calendar View**: Visualize your completion history
- **Achievements**: Unlock badges for milestone streaks (7, 14, 30, 100 days)
- **Points Dashboard**: See your total points across all habits
- **Gamification**: Earn more points for longer streaks

## 🧪 Testing the Point System

### Test Scenario 1: Building a Streak

1. Create a new habit
2. Complete it today → Should earn **1 point** (Day 1)
3. Wait until tomorrow and complete it → Should earn **2 points** (Day 2)
4. Continue for Day 3 → Should earn **3 points** (Day 3)
5. Verify total points = 1 + 2 + 3 = **6 points**

### Test Scenario 2: Breaking a Streak

1. Build a 3-day streak (6 total points)
2. Skip a day (don't complete the habit)
3. Complete it the next day → Should earn **1 point** (streak reset)
4. Verify total points = 6 + 1 = **7 points**

### Test Scenario 3: Adding Missed Completion (Success)

1. Build a streak and earn at least 10 points
2. Open the calendar view for a habit
3. Tap on a past date that's missing a completion
4. Confirm the action
5. Verify:
   - 10 points deducted from total
   - Streak counter continues
   - Warning shown about point worthiness reset
   - Next completion earns only 1 point

### Test Scenario 4: Adding Missed Completion (Insufficient Points)

1. Create a new habit (0 points)
2. Complete it once (1 point)
3. Try to add a missed completion
4. Should see error: "Not enough points for this!"
5. Action should be blocked

### Test Scenario 5: Point Worthiness Reset

1. Build a 5-day streak (1+2+3+4+5 = 15 points)
2. Add a missed completion for yesterday (-10 points, 5 points remaining)
3. Complete the habit today → Should earn **1 point** (not 6!)
4. Complete it tomorrow → Should earn **2 points** (new streak building)
5. Verify the point streak restarted but streak counter continued

## 🔐 Authentication

The app uses Better Auth with support for:
- Email/Password authentication
- Google OAuth
- Apple OAuth (iOS)

### Demo Credentials

For testing purposes, create a new account:
1. Open the app
2. Tap "Don't have an account? Sign Up"
3. Enter your email and password
4. Tap "Sign Up"
5. Switch back to "Sign In" mode
6. Sign in with your credentials

**Recommended test account:**
- Email: demo@habittracker.test
- Password: Demo123!
- Name: Demo User

## 🚀 Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm start
   ```

3. Run on your preferred platform:
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Press `w` for web browser

## 📱 Platform Support

- ✅ iOS
- ✅ Android
- ✅ Web

## 🛠️ Tech Stack

- **Framework**: React Native + Expo 54
- **Navigation**: Expo Router
- **Authentication**: Better Auth
- **Backend**: Fastify + Drizzle ORM
- **Database**: PostgreSQL
- **Styling**: React Native StyleSheet

## 📊 API Integration

The app is fully integrated with the backend API at:
```
https://ncmxmu2vyz9chaqdaspmsugnxfhddrfa.app.specular.dev
```

All API calls use authenticated requests with Bearer tokens stored securely:
- **Web**: localStorage
- **Native**: Expo SecureStore

## 🎨 UI/UX Features

- **Custom Modals**: No `Alert.alert()` - all confirmations use custom modals
- **Points Notifications**: Animated toast showing points earned
- **Info Button**: Tap the ℹ️ icon on the points card to learn about the system
- **Visual Feedback**: Haptic feedback on completions
- **Pull to Refresh**: Swipe down to refresh your habits
- **Loading States**: Proper loading indicators for all async operations

## 🐛 Debugging

All API calls and point calculations are logged to the console with the `[API]` and `[HomeScreen]` prefixes. Check the console for detailed information about:
- Points earned per completion
- Streak calculations
- Point deductions for missed completions
- API request/response data

## ✅ Integration Testing Checklist

### Authentication Flow
- [ ] Sign up with email/password works
- [ ] Sign in with email/password works
- [ ] Sign out works and redirects to auth screen
- [ ] Session persists on app reload
- [ ] Google OAuth works (web)
- [ ] Apple OAuth works (iOS)

### Habit Management
- [ ] Create a new habit
- [ ] Edit habit name, color, and goals
- [ ] Delete a habit
- [ ] View habit list
- [ ] Pull to refresh updates data

### Point System - Regular Completions
- [ ] First completion earns 1 point
- [ ] Second consecutive day earns 2 points
- [ ] Third consecutive day earns 3 points
- [ ] Points notification shows correct amount
- [ ] Points notification shows streak indicator (e.g., "Day 3 streak!")
- [ ] Total points update correctly in dashboard
- [ ] Breaking a streak resets points to 1 for next completion

### Point System - Missed Completions
- [ ] Calendar shows past dates as available
- [ ] Tapping past date shows confirmation modal
- [ ] Confirmation modal shows 10 point cost warning
- [ ] Adding missed completion deducts 10 points
- [ ] Adding missed completion shows success message
- [ ] Next completion after missed earns only 1 point
- [ ] Streak counter continues (doesn't reset)
- [ ] Cannot add missed completion with < 10 points
- [ ] Error message shows when insufficient points
- [ ] Total points never go below 0

### UI/UX Features
- [ ] Points info modal (ℹ️ button) displays correctly
- [ ] Points info modal explains all rules clearly
- [ ] Custom modals work (no Alert.alert crashes)
- [ ] Haptic feedback on completions (mobile)
- [ ] Loading states show during API calls
- [ ] Error messages are user-friendly
- [ ] Calendar view shows completion history
- [ ] Mini calendar in overview shows last 7 days
- [ ] Daily goal reached shows checkmark instead of plus

### Edge Cases
- [ ] Cannot complete same habit twice in same day (shows info alert)
- [ ] Cannot add completion for future dates
- [ ] Cannot add completion for already completed dates
- [ ] Removing today's completion works
- [ ] Removing completion recalculates points correctly
- [ ] Multiple habits track points independently
- [ ] Dashboard shows total points across all habits

### Cross-Platform
- [ ] Works on iOS
- [ ] Works on Android
- [ ] Works on Web
- [ ] Auth works on all platforms
- [ ] Modals work on all platforms
- [ ] Calendar works on all platforms

## 📝 Known Limitations

1. **Time Zones**: All dates are stored in UTC. Completions are tracked by calendar day in UTC.
2. **Offline Mode**: The app requires internet connection for all operations. Offline support is not implemented.
3. **Point Recalculation**: When deleting completions, points are recalculated from scratch based on the remaining completions.

## 🔄 Recent Updates

### Point System Overhaul (Latest)
- ✅ Implemented new point calculation: points = streak day (1, 2, 3, ...)
- ✅ Fixed cost of 10 points for missed completions
- ✅ Point worthiness reset after missed completions
- ✅ Streak counter continues after missed completions
- ✅ Minimum 10 points required to add missed completions
- ✅ Total points floor at 0 (cannot go negative)
- ✅ Enhanced UI with points info modal
- ✅ Improved error messages and user feedback
- ✅ Added streak indicators to points notifications

Made with 💙 for creativity.

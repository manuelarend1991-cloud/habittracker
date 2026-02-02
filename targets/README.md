
# iOS Widget Setup

This app includes an iOS Home Screen widget that displays the "All Habits Overview".

## Setup Instructions

### 1. Install Dependencies

Make sure you have `@bacons/apple-targets` installed:

```bash
npm install @bacons/apple-targets
```

### 2. Configure Your Apple Team ID

In `app.json`, replace `YOUR_TEAM_ID` with your actual Apple Team ID:

```json
"plugins": [
  [
    "@bacons/apple-targets",
    {
      "appleTeamId": "YOUR_TEAM_ID"
    }
  ]
]
```

You can find your Team ID in:
- Apple Developer Portal → Membership
- Xcode → Preferences → Accounts → Your Apple ID → Team ID

### 3. Build the iOS App

```bash
# For development build
npx expo prebuild -p ios

# Then open in Xcode
cd ios
open Natively.xcworkspace
```

### 4. Add Widget to Home Screen

1. Long press on your iOS home screen
2. Tap the "+" button in the top left
3. Search for "Habit Tracker"
4. Select the widget size (Small, Medium, or Large)
5. Tap "Add Widget"

## Widget Sizes

- **Small**: Shows up to 3 habits with their current streak
- **Medium**: Shows up to 3 habits with streaks and 7-day calendar
- **Large**: Shows all habits with full details

## How It Works

The widget automatically updates when:
- You complete a habit
- You add a new habit
- You update or delete a habit
- Every 15 minutes (automatic refresh)

The widget data is shared between the app and the widget extension using App Groups (`group.com.anonymous.Natively`).

## Troubleshooting

### Widget shows "No habits yet"
- Make sure you've created at least one habit in the app
- Try force-closing the app and reopening it
- Remove and re-add the widget

### Widget not updating
- The widget refreshes every 15 minutes automatically
- You can also force refresh by opening the app
- Check that App Groups are properly configured in Xcode

### Build errors
- Make sure your Apple Team ID is correct in `app.json`
- Ensure you have the proper provisioning profiles
- Try cleaning the build folder in Xcode (Cmd+Shift+K)

## Technical Details

- Widget uses SwiftUI and WidgetKit
- Data is stored in shared UserDefaults using App Groups
- Widget context is managed by `contexts/WidgetContext.tsx`
- Widget updates are triggered automatically when dashboard data changes

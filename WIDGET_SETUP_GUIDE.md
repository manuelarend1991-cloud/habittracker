
# 🎯 iOS Home Screen Widget Setup Guide

Your Habit Tracker app now supports iOS Home Screen widgets! You can add the "All Habits Overview" directly to your iPhone home screen.

## ✅ What's Been Implemented

1. **Widget Context** (`contexts/WidgetContext.tsx`)
   - Automatically syncs your habits data to the widget
   - Updates whenever you complete a habit, add/edit/delete habits
   - Uses App Groups for secure data sharing

2. **iOS Widget Extension** (`targets/HabitWidget/`)
   - SwiftUI-based widget with 3 sizes (Small, Medium, Large)
   - Displays habits with streaks, 7-day calendar, and completion status
   - Auto-refreshes every 15 minutes

3. **App Integration**
   - Home screen automatically pushes data to the widget
   - No manual refresh needed - it just works!

## 📱 Widget Sizes

### Small Widget
- Shows up to 3 habits
- Displays habit icon, name, and current streak
- Perfect for a quick glance

### Medium Widget (Recommended)
- Shows up to 3 habits with full details
- Includes 7-day mini calendar for each habit
- Shows current/best streak and completion status
- Matches the "All Habits Overview" from the app

### Large Widget
- Shows ALL your habits
- Full details including 7-day calendar
- Best for tracking multiple habits at once

## 🚀 Setup Instructions

### Step 1: Update Your Apple Team ID

Open `app.json` and replace `YOUR_TEAM_ID` with your actual Apple Team ID:

```json
"plugins": [
  [
    "@bacons/apple-targets",
    {
      "appleTeamId": "YOUR_ACTUAL_TEAM_ID_HERE",
      "targets": [
        {
          "type": "widget",
          "name": "HabitWidget",
          ...
        }
      ]
    }
  ]
]
```

**Where to find your Team ID:**
- Go to [Apple Developer Portal](https://developer.apple.com/account)
- Click "Membership" in the sidebar
- Your Team ID is listed there (10 characters, like "ABC123XYZ9")

### Step 2: Clean and Prebuild the iOS Project

**IMPORTANT:** You must run a clean prebuild to regenerate the Xcode project with the widget extension.

```bash
# Clean any existing iOS build
rm -rf ios

# Prebuild the iOS project with the widget extension
npx expo prebuild -p ios --clean

# Open in Xcode
cd ios
open *.xcworkspace
```

### Step 3: Configure in Xcode

1. In Xcode, you should now see **TWO targets**:
   - `Natively` (main app)
   - `HabitWidget` (widget extension)

2. Select the **main app target** (`Natively`)
   - Go to "Signing & Capabilities"
   - Make sure "App Groups" capability is enabled
   - Verify `group.com.anonymous.Natively` is listed
   - Set your Team and signing certificate

3. Select the **HabitWidget target**
   - Go to "Signing & Capabilities"
   - Make sure "App Groups" capability is enabled
   - Verify `group.com.anonymous.Natively` is listed
   - Set your Team and signing certificate (same as main app)

### Step 4: Build and Run

1. Select your device or simulator (iOS 14.0 or later)
2. Make sure the scheme is set to the main app (not the widget)
3. Click the "Play" button to build and run
4. The app will install on your device **with the widget extension**

### Step 5: Add Widget to Home Screen

1. **Long press** on your iPhone home screen
2. Tap the **"+"** button in the top-left corner
3. Search for **"Habit Tracker"** or scroll to find it
4. You should now see the widget with preview
5. Choose your preferred widget size:
   - Small (2x2)
   - Medium (4x2) ← Recommended
   - Large (4x4)
6. Tap **"Add Widget"**
7. Position the widget where you want it
8. Tap **"Done"**

## 🎨 Widget Features

### Visual Design
- Matches the app's blue theme (`#1e3a8a`)
- Shows habit icons (emojis)
- Color-coded completion circles
- 7-day mini calendar with dates inside circles
- Plaster emoji (🩹) for missed completions

### Data Displayed
- **Habit Name** with icon
- **Current Streak** and **Best Streak**
- **Completion Status** (✓ if goal reached, + if not)
- **7-Day Calendar** showing:
  - Completed days (filled with habit color)
  - Incomplete days (gray)
  - Missed completions with plaster badge

### Auto-Updates
The widget automatically updates when:
- ✅ You complete a habit
- ✅ You add a new habit
- ✅ You edit or delete a habit
- ✅ Every 15 minutes (background refresh)

## 🔧 Troubleshooting

### Widget doesn't appear in the widget gallery

**This is the most common issue!** The widget extension wasn't built properly.

**Solution:**
1. **Delete the `ios` folder completely:**
   ```bash
   rm -rf ios
   ```

2. **Make sure your `app.json` has the correct plugin configuration:**
   - Open `app.json`
   - Find the `@bacons/apple-targets` plugin
   - Make sure it has BOTH `appleTeamId` AND `targets` array
   - The `targets` array should contain the widget configuration

3. **Run a clean prebuild:**
   ```bash
   npx expo prebuild -p ios --clean
   ```

4. **Open Xcode and verify TWO targets exist:**
   ```bash
   cd ios
   open *.xcworkspace
   ```
   - In Xcode, click on the project name in the left sidebar
   - You should see TWO targets: `Natively` and `HabitWidget`
   - If you only see one target, the prebuild didn't work correctly

5. **Build and run the app again**
   - Select your device
   - Click Play
   - After installation, check the widget gallery

### Widget shows "No habits yet"

**Solution:**
1. Open the app and create at least one habit
2. Complete a habit to trigger a data sync
3. Wait a few seconds, then check the widget
4. If still not showing, remove and re-add the widget

### Widget not updating after completing a habit

**Solution:**
1. Make sure the app is running in the background
2. Force-close the app and reopen it
3. The widget should update within a few seconds
4. If not, try removing and re-adding the widget

### Build errors in Xcode

**Common issues:**

1. **"No matching provisioning profiles found"**
   - Make sure your Apple Team ID is correct in `app.json`
   - Go to Xcode → Preferences → Accounts → Download Manual Profiles
   - Select both targets and set the same Team

2. **"App Groups capability not found"**
   - Select the target → Signing & Capabilities
   - Click "+ Capability" → Add "App Groups"
   - Add `group.com.anonymous.Natively`
   - Do this for BOTH the main app and widget targets

3. **"Widget extension not found"**
   - Delete the `ios` folder: `rm -rf ios`
   - Run `npx expo prebuild -p ios --clean` again
   - Make sure `@bacons/apple-targets` is installed: `npm install @bacons/apple-targets`

4. **"Duplicate symbols" or linking errors**
   - Clean build folder: Xcode → Product → Clean Build Folder (Cmd+Shift+K)
   - Delete derived data: Xcode → Preferences → Locations → Derived Data → Delete
   - Rebuild the project

### Widget shows old data

**Solution:**
1. Open the app to trigger a data sync
2. The widget refreshes every 15 minutes automatically
3. You can force refresh by:
   - Opening the app
   - Completing a habit
   - Removing and re-adding the widget

## 📊 Technical Details

### How It Works

1. **Data Storage**
   - App stores widget data in shared UserDefaults
   - Uses App Groups (`group.com.anonymous.Natively`) for secure sharing
   - Data is JSON-encoded for easy parsing in Swift

2. **Data Format**
   ```json
   {
     "habits": [
       {
         "id": "habit-uuid",
         "name": "Exercise",
         "color": "#ff6b6b",
         "icon": "💪",
         "currentStreak": 5,
         "maxStreak": 10,
         "completionsToday": 1,
         "goalCount": 1,
         "nextCompletionPoints": 6,
         "last7Days": [
           { "date": "2024-01-15", "completed": true, "missed": false },
           ...
         ]
       }
     ],
     "lastUpdated": "2024-01-15T10:30:00Z"
   }
   ```

3. **Update Flow**
   - User completes a habit → `useHabits` hook updates dashboard
   - Dashboard changes trigger `useEffect` in `index.tsx`
   - `updateWidgetData()` is called from `WidgetContext`
   - Data is written to shared UserDefaults
   - `ExtensionStorage.reloadWidget()` tells iOS to refresh
   - Widget reads new data and re-renders

### Files Modified/Created

**Modified:**
- `contexts/WidgetContext.tsx` - Added `updateWidgetData` function
- `app/(tabs)/(home)/index.tsx` - Added widget data sync
- `app/(tabs)/(home)/index.ios.tsx` - Added widget data sync
- `app.json` - Added widget plugin and entitlements with proper target configuration

**Created:**
- `targets/HabitWidget/widget.swift` - Widget implementation
- `targets/HabitWidget/Info.plist` - Widget configuration
- `targets/HabitWidget/target.json` - Target configuration
- `targets/README.md` - Widget documentation
- `WIDGET_SETUP_GUIDE.md` - This guide

## 🎉 You're All Set!

Once you've completed the setup, your widget will:
- ✅ Show all your habits with their current status
- ✅ Update automatically when you complete habits
- ✅ Display the 7-day calendar just like in the app
- ✅ Refresh every 15 minutes in the background

Enjoy tracking your habits right from your home screen! 🚀

## 📝 Notes

- Widgets are only available on iOS 14.0 and later
- The widget is read-only (you can't tap to complete habits from the widget)
- To complete habits, open the app
- The widget will show up to 3 habits in Medium size, all habits in Large size
- Widget data is stored securely using App Groups
- No internet connection required for the widget to work

## 🆘 Need Help?

If you encounter any issues:
1. Check the Troubleshooting section above
2. Make sure your Apple Team ID is correct in `app.json`
3. **Delete the `ios` folder and run `npx expo prebuild -p ios --clean`**
4. Verify TWO targets exist in Xcode (main app + widget)
5. Try cleaning and rebuilding in Xcode (Cmd+Shift+K, then Cmd+B)
6. Remove and re-add the widget
7. Check Xcode console for error messages

## 🔑 Key Checklist

Before building, make sure:
- [ ] `app.json` has `@bacons/apple-targets` plugin with `targets` array
- [ ] Your Apple Team ID is set in `app.json`
- [ ] You've deleted the old `ios` folder
- [ ] You've run `npx expo prebuild -p ios --clean`
- [ ] Xcode shows TWO targets (main app + HabitWidget)
- [ ] Both targets have App Groups capability enabled
- [ ] Both targets use the same Team and signing certificate
- [ ] You're building on iOS 14.0 or later

If all checkboxes are checked and you still don't see the widget in the gallery, try:
1. Uninstall the app completely from your device
2. Clean build folder in Xcode
3. Rebuild and reinstall
4. Restart your device

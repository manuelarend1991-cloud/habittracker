
# iOS Widget Extension

This folder contains the iOS Home Screen widget extension for the Habit Tracker app.

## 🚨 WIDGET NOT APPEARING? READ THIS FIRST!

If the widget doesn't show up in the iOS widget gallery on your device, the most common issue is that the widget extension wasn't properly built into the app.

**Quick Fix for Developers:**
```bash
# 1. Delete the iOS folder
rm -rf ios

# 2. Regenerate with widget extension
npx expo prebuild -p ios --clean

# 3. Open in Xcode
cd ios
open *.xcworkspace

# 4. Verify TWO targets exist:
#    - Natively (main app)
#    - HabitWidget (widget extension)
#
# If you only see ONE target, the widget wasn't configured correctly.
# Check that app.json has type: "widget-extension" (NOT "widget")

# 5. Build and run on your device
```

**For TestFlight Users:**
If you're testing via TestFlight and the widget doesn't appear, the developer needs to rebuild and upload a new version with the widget extension properly configured. The widget will NOT appear until a new build is uploaded.

See `WIDGET_SETUP_GUIDE.md` in the root directory for complete instructions.

## 📁 Structure

```
targets/
└── HabitWidget/
    ├── widget.swift       # Widget implementation (SwiftUI)
    ├── Info.plist         # Widget metadata and configuration
    └── target.json        # Target configuration for @bacons/apple-targets
```

## 🔧 How It Works

The widget extension is built using `@bacons/apple-targets`, which allows you to create native iOS extensions (like widgets) in an Expo project.

### Configuration Flow

1. **app.json** defines the widget target in the `@bacons/apple-targets` plugin:
   ```json
   {
     "type": "widget-extension",
     "name": "HabitWidget",
     "bundleIdentifier": "com.anonymous.Natively.HabitWidget",
     "deploymentTarget": "14.0",
     "frameworks": ["WidgetKit", "SwiftUI"],
     "entitlements": {
       "com.apple.security.application-groups": [
         "group.com.anonymous.Natively"
       ]
     }
   }
   ```

2. **target.json** mirrors this configuration for the build system

3. **widget.swift** contains the actual SwiftUI widget code

4. **Info.plist** contains widget metadata (display name, bundle ID, etc.)

### Data Sharing

The widget shares data with the main app using **App Groups**:

- **App Group ID:** `group.com.anonymous.Natively`
- **Storage Key:** `widget_state`
- **Data Format:** JSON string containing habits data

The main app writes data to shared UserDefaults, and the widget reads it.

## 🚀 Building

When you run `npx expo prebuild -p ios`, the `@bacons/apple-targets` plugin:

1. Creates the widget extension target in Xcode
2. Copies `widget.swift` and `Info.plist` to the iOS project
3. Configures App Groups entitlements
4. Links WidgetKit and SwiftUI frameworks
5. Sets up the bundle identifier and deployment target

## 🔍 Troubleshooting

### Widget doesn't appear in Xcode

**Problem:** After running `npx expo prebuild`, you only see one target in Xcode (the main app).

**Solution:**
1. Check that `app.json` has the correct plugin configuration with `targets` array
2. **CRITICAL:** Verify the type is `"widget-extension"` (NOT `"widget"`)
3. Delete the `ios` folder: `rm -rf ios`
4. Run `npx expo prebuild -p ios --clean`
5. Open Xcode and verify TWO targets exist

### Widget not showing in widget gallery

**Problem:** The app installs, but the widget doesn't appear when you try to add it to the home screen.

**Solution:**
1. Make sure you're running iOS 14.0 or later
2. Verify the widget target was built and installed (check Xcode build logs)
3. Uninstall the app completely and reinstall
4. Restart your device

### App Groups not working

**Problem:** Widget shows "No habits yet" even though you have habits in the app.

**Solution:**
1. Verify both targets have the App Groups capability enabled in Xcode
2. Make sure both use the same App Group ID: `group.com.anonymous.Natively`
3. Check that the main app is writing data: look for `[WidgetContext]` logs
4. Check that the widget is reading data: look for Swift console logs

## 📝 Modifying the Widget

To change the widget appearance or behavior:

1. Edit `targets/HabitWidget/widget.swift`
2. Run `npx expo prebuild -p ios --clean` to copy changes to Xcode
3. Build and run in Xcode

**Note:** You can also edit the Swift file directly in Xcode for faster iteration, but remember to copy your changes back to `targets/HabitWidget/widget.swift` so they persist across rebuilds.

## 🎨 Widget Sizes

The widget supports three sizes:

- **Small (2x2):** Shows up to 3 habits with basic info
- **Medium (4x2):** Shows up to 3 habits with full details and 7-day calendar
- **Large (4x4):** Shows all habits with full details

Sizes are defined in the `supportedFamilies` array in `widget.swift`:

```swift
.supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
```

## 🔄 Update Mechanism

The widget updates in two ways:

1. **Manual updates:** When the app calls `ExtensionStorage.reloadWidget()`
   - Triggered when habits are completed, added, edited, or deleted
   - Happens immediately

2. **Automatic updates:** iOS refreshes the widget every 15 minutes
   - Defined in the `getTimeline` function
   - Ensures widget stays up-to-date even if app is closed

## 📚 Resources

- [WidgetKit Documentation](https://developer.apple.com/documentation/widgetkit)
- [@bacons/apple-targets](https://github.com/EvanBacon/apple-targets)
- [Expo Prebuild](https://docs.expo.dev/workflow/prebuild/)
- [App Groups](https://developer.apple.com/documentation/bundleresources/entitlements/com_apple_security_application-groups)

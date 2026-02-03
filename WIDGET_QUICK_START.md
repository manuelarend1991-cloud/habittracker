
# iOS Widget Quick Start Guide

## 🚀 TL;DR - Get the Widget Working in 5 Minutes

### Step 1: Clean Build
```bash
rm -rf ios
npx expo prebuild -p ios --clean
```

### Step 2: Open in Xcode
```bash
cd ios
open *.xcworkspace
```

### Step 3: Verify Configuration
In Xcode, click on the project name. You should see **TWO targets**:
- ✅ `Natively` (main app)
- ✅ `HabitWidget` (widget extension)

**If you only see ONE target, STOP!** The widget wasn't configured correctly.
- Check `app.json` has `"type": "widget-extension"` (NOT `"widget"`)
- Go back to Step 1

### Step 4: Configure Signing
For **BOTH** targets:
1. Select target → Signing & Capabilities
2. Set Team (same for both)
3. Verify "App Groups" capability exists
4. Verify `group.com.anonymous.Natively` is listed

### Step 5: Build and Run
1. Select your device (physical device recommended)
2. Click Play button
3. Wait for installation

### Step 6: Add Widget to Home Screen
1. Long press on iPhone home screen
2. Tap "+" button (top-left)
3. Search "Habit Tracker"
4. Widget should appear with preview
5. Choose size (Small/Medium/Large)
6. Tap "Add Widget"

## ✅ Success Checklist

Before building:
- [ ] Deleted `ios` folder
- [ ] Ran `npx expo prebuild -p ios --clean`
- [ ] Xcode shows TWO targets
- [ ] Both targets have same Team
- [ ] Both targets have App Groups capability
- [ ] `app.json` has `"type": "widget-extension"`

After building:
- [ ] App installed successfully
- [ ] Widget appears in widget gallery
- [ ] Widget shows habits correctly
- [ ] Widget updates when completing habits

## 🐛 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| Only one target in Xcode | Check `app.json` has `"type": "widget-extension"`, delete `ios`, rebuild |
| Widget not in gallery | Uninstall app, clean build (Cmd+Shift+K), rebuild |
| Widget shows "No habits yet" | Open app, create habit, complete it to trigger sync |
| Build errors | Both targets need same Team and App Groups capability |

## 📱 For TestFlight

1. Follow steps 1-4 above
2. Product → Archive in Xcode
3. Verify archive includes BOTH targets
4. Upload to TestFlight
5. Test on device before distributing

## 📚 Need More Help?

- **Detailed Guide:** `WIDGET_SETUP_GUIDE.md`
- **What Was Fixed:** `WIDGET_FIX_SUMMARY.md`
- **Technical Details:** `targets/README.md`

## 🎯 Expected Result

After following these steps, you'll have:
- ✅ Widget in iOS widget gallery
- ✅ Three widget sizes (Small, Medium, Large)
- ✅ Habits displayed with streaks and 7-day calendar
- ✅ Auto-updates every 15 minutes
- ✅ Instant updates when completing habits

---

**Time to complete:** ~5 minutes
**Difficulty:** Easy
**Requirements:** Xcode, iOS 14.0+, Apple Developer account

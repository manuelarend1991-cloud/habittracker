
import WidgetKit
import SwiftUI

struct HabitWidgetEntry: TimelineEntry {
    let date: Date
    let habits: [HabitData]
}

struct HabitData: Codable {
    let id: String
    let name: String
    let color: String
    let icon: String
    let currentStreak: Int
    let maxStreak: Int
    let completionsToday: Int
    let goalCount: Int
    let nextCompletionPoints: Int
    let last7Days: [DayStatus]
}

struct DayStatus: Codable {
    let date: String
    let completed: Bool
    let missed: Bool
}

struct WidgetData: Codable {
    let habits: [HabitData]
    let lastUpdated: String
}

struct Provider: TimelineProvider {
    func placeholder(in context: Context) -> HabitWidgetEntry {
        HabitWidgetEntry(date: Date(), habits: [])
    }

    func getSnapshot(in context: Context, completion: @escaping (HabitWidgetEntry) -> ()) {
        let entry = HabitWidgetEntry(date: Date(), habits: loadHabits())
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> ()) {
        let currentDate = Date()
        let habits = loadHabits()
        let entry = HabitWidgetEntry(date: currentDate, habits: habits)
        
        // Refresh every 15 minutes
        let nextUpdate = Calendar.current.date(byAdding: .minute, value: 15, to: currentDate)!
        let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
        
        completion(timeline)
    }
    
    func loadHabits() -> [HabitData] {
        let sharedDefaults = UserDefaults(suiteName: "group.com.anonymous.Natively")
        
        guard let jsonString = sharedDefaults?.string(forKey: "widget_state"),
              let jsonData = jsonString.data(using: .utf8) else {
            return []
        }
        
        do {
            let widgetData = try JSONDecoder().decode(WidgetData.self, from: jsonData)
            return widgetData.habits
        } catch {
            print("Error decoding widget data: \(error)")
            return []
        }
    }
}

struct HabitWidgetEntryView : View {
    var entry: Provider.Entry
    @Environment(\.widgetFamily) var family

    var body: some View {
        switch family {
        case .systemSmall:
            SmallWidgetView(habits: entry.habits)
        case .systemMedium:
            MediumWidgetView(habits: entry.habits)
        case .systemLarge:
            LargeWidgetView(habits: entry.habits)
        default:
            MediumWidgetView(habits: entry.habits)
        }
    }
}

struct SmallWidgetView: View {
    let habits: [HabitData]
    
    var body: some View {
        ZStack {
            Color(hex: "#1e3a8a")
            
            VStack(alignment: .leading, spacing: 4) {
                Text("Habits")
                    .font(.system(size: 14, weight: .bold))
                    .foregroundColor(.white)
                
                if habits.isEmpty {
                    Text("No habits yet")
                        .font(.system(size: 12))
                        .foregroundColor(.white.opacity(0.7))
                } else {
                    ForEach(habits.prefix(3), id: \.id) { habit in
                        HStack(spacing: 4) {
                            Text(habit.icon)
                                .font(.system(size: 12))
                            Text(habit.name)
                                .font(.system(size: 11, weight: .semibold))
                                .foregroundColor(.white)
                                .lineLimit(1)
                            Spacer()
                            Text("\(habit.currentStreak)")
                                .font(.system(size: 11, weight: .bold))
                                .foregroundColor(.white)
                        }
                    }
                }
            }
            .padding(12)
        }
    }
}

struct MediumWidgetView: View {
    let habits: [HabitData]
    
    var body: some View {
        ZStack {
            Color(hex: "#1e3a8a")
            
            VStack(alignment: .leading, spacing: 6) {
                Text("All Habits Overview")
                    .font(.system(size: 14, weight: .bold))
                    .foregroundColor(.white)
                
                if habits.isEmpty {
                    Text("No habits yet. Open the app to create your first habit!")
                        .font(.system(size: 12))
                        .foregroundColor(.white.opacity(0.7))
                        .multilineTextAlignment(.leading)
                } else {
                    ForEach(habits.prefix(3), id: \.id) { habit in
                        HabitRowView(habit: habit)
                    }
                }
            }
            .padding(12)
        }
    }
}

struct LargeWidgetView: View {
    let habits: [HabitData]
    
    var body: some View {
        ZStack {
            Color(hex: "#1e3a8a")
            
            VStack(alignment: .leading, spacing: 8) {
                Text("All Habits Overview")
                    .font(.system(size: 16, weight: .bold))
                    .foregroundColor(.white)
                
                if habits.isEmpty {
                    Text("No habits yet. Open the app to create your first habit!")
                        .font(.system(size: 14))
                        .foregroundColor(.white.opacity(0.7))
                        .multilineTextAlignment(.leading)
                } else {
                    ForEach(habits, id: \.id) { habit in
                        HabitRowView(habit: habit)
                        if habit.id != habits.last?.id {
                            Divider()
                                .background(Color.white.opacity(0.1))
                        }
                    }
                }
            }
            .padding(12)
        }
    }
}

struct HabitRowView: View {
    let habit: HabitData
    
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            // Top row: Icon, Name, Streaks
            HStack(spacing: 4) {
                Text(habit.icon)
                    .font(.system(size: 14))
                
                Text(habit.name)
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundColor(.white)
                    .lineLimit(1)
                
                Spacer()
                
                Text("Current:")
                    .font(.system(size: 9, weight: .medium))
                    .foregroundColor(.white.opacity(0.6))
                
                Text("\(habit.currentStreak)")
                    .font(.system(size: 11, weight: .bold))
                    .foregroundColor(.white.opacity(0.9))
                
                Text("•")
                    .font(.system(size: 11))
                    .foregroundColor(.white.opacity(0.5))
                
                Text("Best:")
                    .font(.system(size: 9, weight: .medium))
                    .foregroundColor(.white.opacity(0.6))
                
                Text("\(habit.maxStreak)")
                    .font(.system(size: 11, weight: .bold))
                    .foregroundColor(.white.opacity(0.9))
                
                // Completion indicator
                ZStack {
                    Circle()
                        .fill(Color(hex: habit.color))
                        .frame(width: 24, height: 24)
                    
                    if habit.completionsToday >= habit.goalCount {
                        Text("✓")
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundColor(.white)
                    } else {
                        Text("+")
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundColor(.white)
                    }
                }
            }
            
            // Bottom row: 7-day calendar
            HStack(spacing: 3) {
                ForEach(habit.last7Days, id: \.date) { day in
                    let dayNum = getDayNumber(from: day.date)
                    
                    ZStack {
                        Circle()
                            .fill(day.completed ? Color(hex: habit.color) : Color.white.opacity(0.15))
                            .frame(width: 18, height: 18)
                        
                        Text(dayNum)
                            .font(.system(size: 8, weight: .semibold))
                            .foregroundColor(day.completed ? .white : .white.opacity(0.5))
                        
                        if day.missed {
                            Text("🩹")
                                .font(.system(size: 6))
                                .offset(x: 6, y: -6)
                        }
                    }
                }
            }
            .padding(.leading, 18)
        }
    }
    
    func getDayNumber(from dateString: String) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        if let date = formatter.date(from: dateString) {
            let calendar = Calendar.current
            let day = calendar.component(.day, from: date)
            return "\(day)"
        }
        return "?"
    }
}

@main
struct HabitWidget: Widget {
    let kind: String = "HabitWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            HabitWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("Habit Tracker")
        .description("View your habits overview on your home screen")
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
    }
}

struct HabitWidget_Previews: PreviewProvider {
    static var previews: some View {
        HabitWidgetEntryView(entry: HabitWidgetEntry(date: Date(), habits: []))
            .previewContext(WidgetPreviewContext(family: .systemMedium))
    }
}

// Helper extension to parse hex colors
extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3: // RGB (12-bit)
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6: // RGB (24-bit)
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8: // ARGB (32-bit)
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (255, 0, 0, 0)
        }

        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue:  Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}

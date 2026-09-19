// Passive, bounded AX reader. No activation, permission prompt, input or chat-body reads.
import AppKit
import ApplicationServices
import Foundation

struct Worker: Decodable { let number: Int; let id: String; let title: String }
struct Configuration: Decodable { let version: Int; let appBundle: String; let workers: [Worker] }

// AXWindows can successfully return the application itself instead of a window.
// Never interpret that provider failure as an empty sidebar or four idle workers.
func windowIssue(role: String, sameAsApplication: Bool, hasGeometry: Bool) -> String {
    if sameAsApplication { return "accessibility-window-is-application-self-reference" }
    if role != "AXWindow" { return "accessibility-window-role-unavailable" }
    if !hasGeometry { return "accessibility-window-geometry-unavailable" }
    return ""
}
struct RootFixture: Decodable {
    struct Window: Decodable {
        let role: String; let sameAsApplication: Bool; let hasGeometry: Bool; let expectedIssue: String
    }
    let windows: [Window]
}
if CommandLine.arguments.count == 3 && CommandLine.arguments[1] == "--root-fixture" {
    let fixture = try JSONDecoder().decode(RootFixture.self, from: Data(contentsOf: URL(fileURLWithPath: CommandLine.arguments[2])))
    for window in fixture.windows {
        assert(windowIssue(role: window.role, sameAsApplication: window.sameAsApplication,
                           hasGeometry: window.hasGeometry) == window.expectedIssue)
    }
    print("PASS: observed root-provider shape; no accessibility observation performed")
    exit(0)
}

func classify(_ labels: [String], visible: Bool, complete: Bool) -> String {
    guard visible && complete else { return "unknown" }
    if labels.contains("Working") { return labels.allSatisfy { $0 == "Working" } ? "working" : "unknown" }
    if !labels.isEmpty && labels.allSatisfy({ ["systemError", "Error", "Failed"].contains($0) }) { return "systemError" }
    return labels.isEmpty ? "clear" : "unknown"
}
if CommandLine.arguments.contains("--self-test") {
    assert(classify(["Working"], visible: true, complete: true) == "working")
    assert(classify([], visible: true, complete: true) == "clear")
    assert(classify(["systemError"], visible: true, complete: true) == "systemError")
    assert(classify(["Working", "Error"], visible: true, complete: true) == "unknown")
    assert(classify([], visible: false, complete: true) == "unknown")
    assert(classify([], visible: true, complete: false) == "unknown")
    assert(classify(["Unrecognized"], visible: true, complete: true) == "unknown")
    assert(windowIssue(role: "AXWindow", sameAsApplication: false, hasGeometry: true).isEmpty)
    assert(windowIssue(role: "AXWindow", sameAsApplication: false, hasGeometry: false) == "accessibility-window-geometry-unavailable")
    assert(windowIssue(role: "AXApplication", sameAsApplication: false, hasGeometry: true) == "accessibility-window-role-unavailable")
    assert(windowIssue(role: "AXApplication", sameAsApplication: true, hasGeometry: false) == "accessibility-window-is-application-self-reference")
    print("PASS: passive status classification; no accessibility observation performed")
    exit(0)
}
guard CommandLine.arguments.count == 2 else { exit(2) }
let config = try JSONDecoder().decode(Configuration.self, from: Data(contentsOf: URL(fileURLWithPath: CommandLine.arguments[1])))
guard config.version == 1, config.workers.count == 4,
      Set(config.workers.map { $0.number }) == Set([1, 2, 3, 5]),
      Set(config.workers.map { $0.id }).count == 4,
      Set(config.workers.map { $0.title }).count == 4,
      config.appBundle == "com.openai.codex" else { exit(2) }
let allowed = Dictionary(uniqueKeysWithValues: config.workers.map { ($0.title, $0.id) })
let started = Date(), deadline = ProcessInfo.processInfo.systemUptime + 3
var complete = true, nodes = 0, reason = "", rows = [String: [[String: Any]]]()

func get(_ element: AXUIElement, _ key: String, required: Bool = false) -> Any? {
    var value: CFTypeRef?
    let rc = AXUIElementCopyAttributeValue(element, key as CFString, &value)
    if rc != .success {
        if required || ![AXError.noValue, .attributeUnsupported].contains(rc) { complete = false }
        return nil
    }
    return value
}
func rectangle(_ element: AXUIElement) -> CGRect? {
    guard let p = get(element, "AXPosition"), let s = get(element, "AXSize"),
          CFGetTypeID(p as CFTypeRef) == AXValueGetTypeID(),
          CFGetTypeID(s as CFTypeRef) == AXValueGetTypeID() else { return nil }
    var position = CGPoint.zero, size = CGSize.zero
    guard AXValueGetValue(p as! AXValue, .cgPoint, &position),
          AXValueGetValue(s as! AXValue, .cgSize, &size), size.width > 0, size.height > 0 else { return nil }
    return CGRect(origin: position, size: size)
}
func withinBudget(_ depth: Int) -> Bool {
    nodes += 1
    if depth >= 40 || nodes > 6000 || ProcessInfo.processInfo.systemUptime >= deadline {
        complete = false
        reason = "accessibility-budget-exhausted"
        return false
    }
    return true
}
func statuses(_ element: AXUIElement, _ depth: Int) -> [String] {
    guard withinBudget(depth) else { return ["unknown"] }
    let role = get(element, "AXRole") as? String ?? ""
    if ["AXWebArea", "AXTextArea", "AXMenu"].contains(role) { return [] }
    var labels = [String]()
    if get(element, "AXSubrole") as? String == "AXApplicationStatus" {
        labels.append(get(element, "AXDescription") as? String ?? "unknown")
    }
    for child in get(element, "AXChildren") as? [AXUIElement] ?? [] { labels += statuses(child, depth + 1) }
    return labels
}
func walk(_ element: AXUIElement, _ depth: Int, _ window: CGRect) {
    guard withinBudget(depth) else { return }
    let role = get(element, "AXRole") as? String ?? ""
    // Never descend into a conversation, composer, settings menu or hidden region.
    if ["AXWebArea", "AXTextArea", "AXMenu"].contains(role) || get(element, "AXHidden") as? Bool == true { return }
    if role == "AXButton" {
        if let title = get(element, "AXDescription") as? String, let id = allowed[title] {
            let bounds = rectangle(element)
            let visible = bounds.map { window.contains($0) } ?? false
            let status = classify(statuses(element, depth + 1), visible: visible, complete: complete)
            rows[id, default: []].append(["status": status, "visible": visible])
        }
        return // Other buttons (including profiles) are not inspected further.
    }
    for child in get(element, "AXChildren") as? [AXUIElement] ?? [] { walk(child, depth + 1, window) }
}
let trusted = AXIsProcessTrusted() // Never requests permission or displays a prompt.
var appIdentity = ""
var rootShapes = [[String: Any]]()
if !trusted {
    complete = false
    reason = "accessibility-not-trusted"
} else {
    let apps = NSRunningApplication.runningApplications(withBundleIdentifier: config.appBundle)
    if apps.count != 1 || apps[0].isHidden {
        complete = false
        reason = "app-missing-hidden-or-ambiguous"
    } else if let launched = apps[0].launchDate {
        let app = apps[0]
        appIdentity = "\(app.processIdentifier):\(launched.timeIntervalSince1970)"
        let root = AXUIElementCreateApplication(app.processIdentifier)
        AXUIElementSetMessagingTimeout(root, 0.05)
        let windows = get(root, "AXWindows", required: true) as? [AXUIElement] ?? []
        if windows.isEmpty { complete = false; reason = "accessibility-windows-unavailable" }
        for window in windows {
            let role = get(window, "AXRole", required: true) as? String ?? ""
            let same = CFEqual(window, root)
            let rect = same ? nil : rectangle(window)
            let issue = windowIssue(role: role, sameAsApplication: same, hasGeometry: rect != nil)
            rootShapes.append(["role": role, "sameAsApplication": same, "hasGeometry": rect != nil])
            if !issue.isEmpty {
                complete = false
                reason = issue
                continue
            }
            if get(window, "AXMinimized") as? Bool == true { continue }
            if let rect { walk(window, 0, rect) }
        }
    } else {
        complete = false
        reason = "app-incarnation-unavailable"
    }
}
var resultRows = [String: [String: Any]]()
for worker in config.workers {
    let found = rows[worker.id] ?? []
    let usable = complete && found.count == 1 && found[0]["visible"] as? Bool == true
    let status = usable ? found[0]["status"] as? String ?? "unknown" : "unknown"
    resultRows[worker.id] = ["count": found.count, "status": status, "visible": usable]
}
let missing = config.workers.filter { resultRows[$0.id]?["status"] as? String == "unknown" }.map { $0.id }
if !missing.isEmpty && reason.isEmpty { reason = "managed-rows-missing-duplicate-hidden-or-unknown" }
let result: [String: Any] = [
    "version": 1, "sampleId": UUID().uuidString, "at": started.timeIntervalSince1970,
    "elapsedSeconds": Date().timeIntervalSince(started), "trusted": trusted,
    "complete": complete && missing.isEmpty, "appIdentity": appIdentity,
    "rows": resultRows, "unavailable": missing, "reason": reason, "windowRoots": rootShapes,
]
print(String(data: try JSONSerialization.data(withJSONObject: result, options: .sortedKeys), encoding: .utf8)!)

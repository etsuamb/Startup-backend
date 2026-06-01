import 'package:flutter/material.dart';
import '../services/startup_service.dart';
import '../services/auth_service.dart';
import 'login_page.dart';
import 'chat/chat_list_page.dart';
import 'discover/discover_page.dart';
import 'offers/offers_page.dart';
import 'meetings/meetings_page.dart';
import 'startup/startup_profile_page.dart';
import 'settings/settings_page.dart';
import 'startup/projects_page.dart';
import 'startup/startup_mentorship_page.dart';

class StartupDashboardPage extends StatefulWidget {
  const StartupDashboardPage({super.key});

  @override
  State<StartupDashboardPage> createState() => _StartupDashboardPageState();
}

class _StartupDashboardPageState extends State<StartupDashboardPage> {
  Map<String, dynamic>? info;
  Map<String, dynamic>? status;
  Map<String, dynamic>? progress;
  Map<String, dynamic>? funding;
  Map<String, dynamic>? documents;
  Map<String, dynamic>? feedback;
  Map<String, dynamic>? events;
  Map<String, dynamic>? activity;
  bool loading = true;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => loading = true);
    final results = await Future.wait([
      StartupService.getDashboardInfo(),
      StartupService.getDashboardStatus(),
      StartupService.getDashboardProgress(),
      StartupService.getFundingSummary(),
      StartupService.getDocumentsStatus(),
      StartupService.getFeedback(),
      StartupService.getEvents(),
      StartupService.getActivity(),
    ]);
    setState(() {
      info = results[0];
      status = results[1];
      progress = results[2];
      funding = results[3];
      documents = results[4];
      feedback = results[5];
      events = results[6];
      activity = results[7];
      loading = false;
    });
  }

  String _getVal(Map<String, dynamic>? data, String key, String fallback) {
    return data?[key]?.toString() ?? fallback;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xffF5F7F9),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        title: Text(info?['startup_name'] ?? 'Startup Dashboard', style: const TextStyle(color: Color(0xff0D1C2E), fontWeight: FontWeight.bold, fontSize: 18)),
        actions: [
          IconButton(onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ChatListPage())), icon: const Icon(Icons.chat_outlined, color: Color(0xff667085))),
          IconButton(onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const SettingsPage())), icon: const Icon(Icons.settings_outlined, color: Color(0xff667085))),
          IconButton(
            onPressed: () async {
              await AuthService.logout();
              Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const LoginPage()));
            },
            icon: const Icon(Icons.logout, color: Color(0xff667085)),
          ),
        ],
      ),
      body: loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _loadData,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(16),
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text('Welcome back, ${info?['startup_name'] ?? 'Startup'}', style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Color(0xff0D1C2E))),
                  const SizedBox(height: 4),
                  Text(_getVal(status, 'message', 'Your venture is performing well.'), style: const TextStyle(color: Color(0xff667085))),
                  const SizedBox(height: 20),
                  _buildStatusRow(),
                  const SizedBox(height: 16),
                  _buildProjectProgress(),
                  const SizedBox(height: 16),
                  _buildFundingSummary(),
                  const SizedBox(height: 16),
                  _buildDocumentsStatus(),
                  const SizedBox(height: 16),
                  _buildFeedback(),
                  if (events != null && events!['events'] != null) ...[
                    const SizedBox(height: 16),
                    _buildEvents(),
                  ],
                  const SizedBox(height: 16),
                  _buildRecentActivity(),
                  const SizedBox(height: 16),
                  _buildQuickActions(),
                  const SizedBox(height: 32),
                  _buildNavGrid(),
                  const SizedBox(height: 40),
                ]),
              ),
            ),
    );
  }

  Widget _buildStatusRow() {
    final statuses = ['Pending', 'Active', 'Funded', 'Mentored', 'Closed'];
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(20)),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const Text("Startup Status", style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
        const SizedBox(height: 16),
        Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: statuses.map((s) {
          final active = status?['status']?.toString().toLowerCase() == s.toLowerCase();
          return Column(children: [
            Container(
              width: 50, height: 50,
              decoration: BoxDecoration(color: active ? const Color(0xffECFDF3) : Colors.grey.shade100, borderRadius: BorderRadius.circular(14), border: active ? Border.all(color: const Color(0xff0D5C46)) : null),
              child: Icon(Icons.circle, color: active ? const Color(0xff0D5C46) : Colors.grey, size: 20),
            ),
            const SizedBox(height: 6),
            Text(s, style: TextStyle(fontSize: 10, color: active ? const Color(0xff0D5C46) : Colors.grey, fontWeight: active ? FontWeight.bold : FontWeight.normal)),
          ]);
        }).toList()),
      ]),
    );
  }

  Widget _buildProjectProgress() {
    final pct = (progress?['progress'] ?? 0).toDouble();
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(20)),
      child: Column(children: [
        const Text("PROJECT PROGRESS", style: TextStyle(letterSpacing: 2, fontWeight: FontWeight.bold, color: Color(0xff98A2B3))),
        const SizedBox(height: 20),
        SizedBox(width: 120, height: 120, child: Stack(alignment: Alignment.center, children: [
          CircularProgressIndicator(value: pct / 100, strokeWidth: 10, backgroundColor: Colors.grey.shade200, color: const Color(0xff0D5C46)),
          Text('${pct.toInt()}%', style: const TextStyle(fontSize: 28, fontWeight: FontWeight.bold)),
        ])),
        const SizedBox(height: 12),
        Text(progress?['phase'] ?? 'MVP Phase', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
      ]),
    );
  }

  Widget _buildFundingSummary() {
    final required = funding?['required'] ?? 0;
    final applied = funding?['applied'] ?? 0;
    final received = funding?['received'] ?? 0;
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(20)),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const Text("Funding Summary", style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
        const SizedBox(height: 16),
        Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
          const Text("REQUIRED FUNDING", style: TextStyle(color: Color(0xff98A2B3), fontWeight: FontWeight.bold, fontSize: 11)),
          Text('\$$required', style: const TextStyle(fontSize: 32, fontWeight: FontWeight.bold, color: Color(0xff0D1C2E))),
        ]),
        const SizedBox(height: 12),
        ClipRRect(
          borderRadius: BorderRadius.circular(10),
          child: LinearProgressIndicator(value: required > 0 ? applied / required : 0, backgroundColor: Colors.grey.shade200, color: const Color(0xff0D5C46), minHeight: 8),
        ),
        const SizedBox(height: 16),
        Row(children: [
          Column(crossAxisAlignment: CrossAxisAlignment.start, children: [const Text("• APPLIED", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 11)), Text('\$$applied', style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold))]),
          const SizedBox(width: 32),
          Column(crossAxisAlignment: CrossAxisAlignment.start, children: [const Text("• RECEIVED", style: TextStyle(fontWeight: FontWeight.bold, color: Color(0xff0D5C46), fontSize: 11)), Text('\$$received', style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Color(0xff0D5C46)))]),
        ]),
      ]),
    );
  }

  Widget _buildDocumentsStatus() {
    final uploaded = documents?['uploaded'] ?? 0;
    final missing = documents?['missing'] ?? 0;
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(20)),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const Text("Documents Status", style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
        const SizedBox(height: 12),
        _docTile("$uploaded Uploaded", "VERIFIED DOCUMENTS", const Color(0xffECFDF3), Icons.description_outlined, const Color(0xff0D5C46), null),
        const SizedBox(height: 8),
        _docTile("$missing Missing", "ACTION REQUIRED", const Color(0xffFEF3F2), Icons.warning_amber_rounded, Colors.red, ElevatedButton(onPressed: (){}, style: ElevatedButton.styleFrom(backgroundColor: Colors.red), child: const Text("Fix now"))),
      ]),
    );
  }

  Widget _docTile(String title, String subtitle, Color bg, IconData icon, Color color, Widget? action) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(16)),
      child: Row(children: [
        Icon(icon, color: color),
        const SizedBox(width: 12),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text(title, style: TextStyle(fontWeight: FontWeight.bold, color: color)), Text(subtitle, style: TextStyle(fontSize: 11, color: color))])),
        if (action != null) action,
      ]),
    );
  }

  Widget _buildFeedback() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(20)),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const Text("LATEST FEEDBACK", style: TextStyle(color: Color(0xff98A2B3), fontWeight: FontWeight.bold, letterSpacing: 2)),
        const SizedBox(height: 12),
        Text('"${feedback?['feedback'] ?? feedback?['latest_feedback'] ?? 'No feedback yet'}"', style: const TextStyle(fontSize: 18, fontStyle: FontStyle.italic)),
        if (feedback?['mentor_name'] != null) ...[
          const SizedBox(height: 16),
          Text("- ${feedback!['mentor_name']}", style: const TextStyle(fontWeight: FontWeight.bold)),
        ],
      ]),
    );
  }

  Widget _buildEvents() {
    final eventList = events!['events'] as List<dynamic>;
    if (eventList.isEmpty) return const SizedBox.shrink();
    final e = eventList.first;
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(gradient: const LinearGradient(colors: [Color(0xff063D33), Color(0xff0D5C46)]), borderRadius: BorderRadius.circular(20)),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
          Container(width: 40, height: 40, decoration: BoxDecoration(color: Colors.white.withOpacity(0.1), borderRadius: BorderRadius.circular(10)), child: const Icon(Icons.calendar_today, color: Colors.white)),
          Container(padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6), decoration: BoxDecoration(color: Colors.white.withOpacity(0.12), borderRadius: BorderRadius.circular(20)), child: const Text("UPCOMING", style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 10))),
        ]),
        const SizedBox(height: 20),
        Text(e['title'] ?? '', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 20)),
        const SizedBox(height: 6),
        Text(e['description'] ?? '', style: TextStyle(color: Colors.white.withOpacity(0.7))),
        const SizedBox(height: 16),
        Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
          Row(children: [const Icon(Icons.access_time, color: Colors.white, size: 16), const SizedBox(width: 6), Text(e['time'] ?? '', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold))]),
          ElevatedButton(onPressed: (){}, style: ElevatedButton.styleFrom(backgroundColor: Colors.white, foregroundColor: const Color(0xff063D33)), child: const Text("Join")),
        ]),
      ]),
    );
  }

  Widget _buildRecentActivity() {
    final list = activity?['activity'] as List<dynamic>?;
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(20)),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const Text("Recent Activity", style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
        const SizedBox(height: 16),
        if (list == null || list.isEmpty)
          const Text("No recent activity", style: TextStyle(color: Colors.grey))
        else
          ...list.take(5).map((a) => _activityItem(a['title'] ?? a['action'] ?? '', a['description'] ?? '', a['created_at'] ?? a['time'] ?? '')),
      ]),
    );
  }

  Widget _activityItem(String title, String desc, String time) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Container(width: 8, height: 8, margin: const EdgeInsets.only(top: 6), decoration: const BoxDecoration(shape: BoxShape.circle, color: Color(0xff0D5C46))),
        const SizedBox(width: 12),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text(title, style: const TextStyle(fontWeight: FontWeight.bold)), Text('$time • $desc', style: const TextStyle(color: Colors.grey, fontSize: 12))])),
      ]),
    );
  }

  Widget _buildQuickActions() {
    return Column(children: [
      const Center(child: Text("QUICK ACTIONS", style: TextStyle(color: Color(0xff98A2B3), fontWeight: FontWeight.bold, letterSpacing: 2))),
      const SizedBox(height: 16),
      Row(mainAxisAlignment: MainAxisAlignment.spaceEvenly, children: [
        _quickAction(Icons.add, "Create Project", () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ProjectsPage()))),
        _quickAction(Icons.upload_outlined, "Upload Docs", (){}),
        _quickAction(Icons.attach_money, "Find Investors", () => Navigator.push(context, MaterialPageRoute(builder: (_) => const DiscoverPage()))),
        _quickAction(Icons.people_outline, "Request Mentor", () => Navigator.push(context, MaterialPageRoute(builder: (_) => const StartupMentorshipPage()))),
        _quickAction(Icons.show_chart, "Update Progress", (){}),
      ]),
    ]);
  }

  Widget _quickAction(IconData icon, String title, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Column(children: [
        Container(width: 56, height: 56, decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16)), child: Icon(icon, color: const Color(0xff0D1C2E))),
        const SizedBox(height: 6),
        SizedBox(width: 72, child: Text(title, textAlign: TextAlign.center, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600))),
      ]),
    );
  }

  Widget _buildNavGrid() {
    final items = [
      ('Chat', Icons.chat, const ChatListPage()),
      ('Discover', Icons.explore, const DiscoverPage()),
      ('Offers', Icons.local_offer, const OffersPage()),
      ('Meetings', Icons.event, const MeetingsPage()),
      ('Projects', Icons.folder, const ProjectsPage()),
      ('Mentorship', Icons.school, const StartupMentorshipPage()),
      ('Profile', Icons.person, const StartupProfilePage()),
      ('Settings', Icons.settings, const SettingsPage()),
    ];
    return Wrap(
      spacing: 12, runSpacing: 12,
      children: items.map((item) {
        return SizedBox(
          width: (MediaQuery.of(context).size.width - 44) / 4,
          child: GestureDetector(
            onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => item.$3 as Widget)),
            child: Column(children: [
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16)),
                child: Icon(item.$2, color: const Color(0xff0D5C46), size: 28),
              ),
              const SizedBox(height: 6),
              Text(item.$1, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600), textAlign: TextAlign.center),
            ]),
          ),
        );
      }).toList(),
    );
  }
}

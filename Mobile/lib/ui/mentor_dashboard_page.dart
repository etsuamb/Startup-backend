import 'package:flutter/material.dart';
import '../services/mentor_service.dart';
import '../services/auth_service.dart';
import 'login_page.dart';
import 'chat/chat_list_page.dart';
import 'settings/settings_page.dart';
import 'mentor/mentor_profile_page.dart';
import 'mentor/mentor_sessions_page.dart';

class MentorDashboardPage extends StatefulWidget {
  const MentorDashboardPage({super.key});

  @override
  State<MentorDashboardPage> createState() => _MentorDashboardPageState();
}

class _MentorDashboardPageState extends State<MentorDashboardPage> {
  Map<String, dynamic>? dashboard;
  Map<String, dynamic>? requests;
  Map<String, dynamic>? assigned;
  bool loading = true;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => loading = true);
    final results = await Future.wait([
      MentorService.getDashboard(),
      MentorService.getMentorshipRequests(),
      MentorService.getAssignedStartups(),
    ]);
    setState(() {
      dashboard = results[0];
      requests = results[1];
      assigned = results[2];
      loading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xffF5F7F9),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        title: const Text('Mentor Dashboard', style: TextStyle(color: Color(0xff0D1C2E), fontWeight: FontWeight.bold)),
        actions: [
          IconButton(onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const SettingsPage())), icon: const Icon(Icons.settings_outlined)),
          IconButton(onPressed: () async { await AuthService.logout(); Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const LoginPage())); }, icon: const Icon(Icons.logout)),
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
                  Text('Welcome, ${dashboard?['name'] ?? 'Mentor'}', style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 4),
                  Text(dashboard?['title'] ?? '', style: const TextStyle(color: Colors.grey)),
                  const SizedBox(height: 20),
                  _buildStatRow(),
                  const SizedBox(height: 20),
                  if (requests?['requests'] != null && (requests!['requests'] as List).isNotEmpty) ...[
                    const Text("Pending Requests", style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 12),
                    ...(requests!['requests'] as List).take(3).map((r) => _requestCard(r)),
                  ],
                  const SizedBox(height: 24),
                  const Text("Quick Actions", style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 12),
                  Row(mainAxisAlignment: MainAxisAlignment.spaceEvenly, children: [
                    _actionItem(Icons.people, 'Startups', (){}),
                    _actionItem(Icons.event, 'Sessions', () => Navigator.push(context, MaterialPageRoute(builder: (_) => const MentorSessionsPage()))),
                    _actionItem(Icons.chat, 'Messages', () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ChatListPage()))),
                    _actionItem(Icons.person, 'Profile', () => Navigator.push(context, MaterialPageRoute(builder: (_) => const MentorProfilePage()))),
                  ]),
                  const SizedBox(height: 24),
                  if (assigned?['startups'] != null) ...[
                    const Text("My Startups", style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 12),
                    ...(assigned!['startups'] as List).take(5).map((s) => Container(
                      margin: const EdgeInsets.only(bottom: 8),
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16)),
                      child: Row(children: [
                        Container(width: 40, height: 40, decoration: const BoxDecoration(color: Color(0xffECFDF3), shape: BoxShape.circle), child: const Center(child: Text("S", style: TextStyle(color: Color(0xff0D5C46), fontWeight: FontWeight.bold)))),
                        const SizedBox(width: 12),
                        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                          Text(s['name'] ?? '', style: const TextStyle(fontWeight: FontWeight.bold)),
                          Text(s['industry'] ?? '', style: const TextStyle(color: Colors.grey, fontSize: 12)),
                        ])),
                        Text(s['stage'] ?? '', style: const TextStyle(color: Color(0xff0D5C46), fontWeight: FontWeight.bold)),
                      ]),
                    )),
                  ],
                ]),
              ),
            ),
    );
  }

  Widget _buildStatRow() {
    return Row(children: [
      Expanded(child: _statCard('Requests', '${requests?['requests']?.length ?? 0}', Icons.person_add)),
      const SizedBox(width: 12),
      Expanded(child: _statCard('Startups', '${assigned?['startups']?.length ?? 0}', Icons.business)),
      const SizedBox(width: 12),
      Expanded(child: _statCard('Sessions', '${dashboard?['sessions'] ?? 0}', Icons.event)),
    ]);
  }

  Widget _statCard(String title, String value, IconData icon) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16)),
      child: Column(children: [
        Icon(icon, color: const Color(0xff063D33)),
        const SizedBox(height: 8),
        Text(value, style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
        Text(title, style: const TextStyle(color: Colors.grey, fontSize: 12)),
      ]),
    );
  }

  Widget _requestCard(Map<String, dynamic> r) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16)),
      child: Row(children: [
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(r['startup_name'] ?? 'Unknown', style: const TextStyle(fontWeight: FontWeight.bold)),
          Text(r['message'] ?? '', style: const TextStyle(color: Colors.grey, fontSize: 12)),
        ])),
        Row(mainAxisSize: MainAxisSize.min, children: [
          IconButton(icon: const Icon(Icons.check_circle, color: Colors.green), onPressed: () async {
            await MentorService.acceptRequest(r['id']);
            _loadData();
          }),
          IconButton(icon: const Icon(Icons.cancel, color: Colors.red), onPressed: () async {
            await MentorService.rejectRequest(r['id']);
            _loadData();
          }),
        ]),
      ]),
    );
  }

  Widget _actionItem(IconData icon, String label, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Column(children: [
        Container(width: 56, height: 56, decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16)), child: Icon(icon, color: const Color(0xff063D33))),
        const SizedBox(height: 6),
        Text(label, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
      ]),
    );
  }
}

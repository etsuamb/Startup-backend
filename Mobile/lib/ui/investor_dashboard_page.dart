import 'package:flutter/material.dart';
import '../services/investor_service.dart';
import '../services/auth_service.dart';
import 'login_page.dart';
import 'chat/chat_list_page.dart';
import 'offers/investor_offers_page.dart';
import 'meetings/meetings_page.dart';
import 'discover/discover_page.dart';
import 'settings/settings_page.dart';

class InvestorDashboardPage extends StatefulWidget {
  const InvestorDashboardPage({super.key});

  @override
  State<InvestorDashboardPage> createState() => _InvestorDashboardPageState();
}

class _InvestorDashboardPageState extends State<InvestorDashboardPage> {
  Map<String, dynamic>? profile;
  Map<String, dynamic>? portfolio;
  Map<String, dynamic>? recommendations;
  bool loading = true;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => loading = true);
    final results = await Future.wait([
      InvestorService.getProfile(),
      InvestorService.getPortfolio(),
      InvestorService.getRecommendations(),
    ]);
    setState(() {
      profile = results[0];
      portfolio = results[1];
      recommendations = results[2];
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
        title: Text(profile?['organization_name'] ?? 'Investor Dashboard', style: const TextStyle(color: Color(0xff0D1C2E), fontWeight: FontWeight.bold)),
        actions: [
          IconButton(onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ChatListPage())), icon: const Icon(Icons.chat_outlined)),
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
                  Text('Welcome, ${profile?['organization_name'] ?? 'Investor'}', style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 20),
                  _buildStatCard('Portfolio', '${portfolio?['startups']?.length ?? 0} Startups', Icons.business),
                  const SizedBox(height: 12),
                  _buildStatCard('Investments', '\$${portfolio?['total_invested'] ?? '0'}', Icons.monetization_on),
                  const SizedBox(height: 12),
                  _buildStatCard('Meetings', '${portfolio?['meetings'] ?? 0} Scheduled', Icons.event),
                  const SizedBox(height: 24),
                  const Text("Quick Actions", style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 12),
                  Row(mainAxisAlignment: MainAxisAlignment.spaceEvenly, children: [
                    _actionItem(Icons.search, 'Discover', () => Navigator.push(context, MaterialPageRoute(builder: (_) => const DiscoverPage()))),
                    _actionItem(Icons.local_offer, 'Offers', () => Navigator.push(context, MaterialPageRoute(builder: (_) => const InvestorOffersPage()))),
                    _actionItem(Icons.event, 'Meetings', () => Navigator.push(context, MaterialPageRoute(builder: (_) => const MeetingsPage()))),
                    _actionItem(Icons.message, 'Messages', () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ChatListPage()))),
                  ]),
                  const SizedBox(height: 24),
                  if (recommendations?['recommendations'] != null) ...[
                    const Text("Recommended Startups", style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 12),
                    SizedBox(
                      height: 200,
                      child: ListView.builder(
                        scrollDirection: Axis.horizontal,
                        itemCount: (recommendations!['recommendations'] as List).length,
                        itemBuilder: (ctx, i) {
                          final s = recommendations!['recommendations'][i];
                          return Container(
                            width: 200, margin: const EdgeInsets.only(right: 12),
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16)),
                            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                              Text(s['name'] ?? '', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                              const SizedBox(height: 4),
                              Text(s['industry'] ?? '', style: const TextStyle(color: Colors.grey)),
                              const Spacer(),
                              Text('\$${s['funding_needed'] ?? 'N/A'}', style: const TextStyle(color: Color(0xff0D5C46), fontWeight: FontWeight.bold)),
                            ]),
                          );
                        },
                      ),
                    ),
                  ],
                ]),
              ),
            ),
    );
  }

  Widget _buildStatCard(String title, String value, IconData icon) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(20)),
      child: Row(children: [
        Container(width: 50, height: 50, decoration: BoxDecoration(color: const Color(0xffECFDF3), borderRadius: BorderRadius.circular(14)), child: Icon(icon, color: const Color(0xff0D5C46))),
        const SizedBox(width: 16),
        Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(title, style: const TextStyle(color: Colors.grey, fontWeight: FontWeight.w600)),
          Text(value, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
        ]),
      ]),
    );
  }

  Widget _actionItem(IconData icon, String label, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Column(children: [
        Container(width: 56, height: 56, decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16)), child: Icon(icon, color: const Color(0xff0D5C46))),
        const SizedBox(height: 6),
        Text(label, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
      ]),
    );
  }
}

import 'package:flutter/material.dart';
import '../../services/startup_service.dart';

class StartupProfilePage extends StatefulWidget {
  const StartupProfilePage({super.key});

  @override
  State<StartupProfilePage> createState() => _StartupProfilePageState();
}

class _StartupProfilePageState extends State<StartupProfilePage> {
  Map<String, dynamic>? profile;
  bool loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final r = await StartupService.getProfile();
    setState(() { profile = r['startup'] ?? r; loading = false; });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xffF5F7F9),
      appBar: AppBar(title: const Text("Startup Profile", style: TextStyle(fontWeight: FontWeight.bold)), backgroundColor: Colors.transparent, elevation: 0),
      body: loading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Container(
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(24)),
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Center(
                      child: Column(children: [
                        Container(width: 80, height: 80, decoration: BoxDecoration(color: const Color(0xffECFDF3), borderRadius: BorderRadius.circular(20)), child: const Icon(Icons.business, size: 40, color: Color(0xff0D5C46))),
                        const SizedBox(height: 12),
                        Text(profile?['name'] ?? '', style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
                        Text(profile?['industry'] ?? '', style: const TextStyle(color: Colors.grey)),
                      ]),
                    ),
                    const Divider(height: 32),
                    _item("Stage", profile?['stage'] ?? 'N/A'),
                    _item("Team Size", '${profile?['team_size'] ?? 'N/A'}'),
                    _item("City", profile?['city'] ?? 'N/A'),
                    _item("Founded", profile?['year_founded'] ?? 'N/A'),
                    _item("Tagline", profile?['tagline'] ?? 'N/A'),
                    if (profile?['website'] != null) _item("Website", profile!['website']),
                  ]),
                ),
              ]),
            ),
    );
  }

  Widget _item(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
        SizedBox(width: 120, child: Text(label, style: const TextStyle(color: Colors.grey, fontWeight: FontWeight.w600))),
        Expanded(child: Text(value, style: const TextStyle(fontWeight: FontWeight.bold))),
      ]),
    );
  }
}

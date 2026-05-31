import 'package:flutter/material.dart';
import '../../services/mentor_service.dart';

class MentorSessionsPage extends StatefulWidget {
  const MentorSessionsPage({super.key});

  @override
  State<MentorSessionsPage> createState() => _MentorSessionsPageState();
}

class _MentorSessionsPageState extends State<MentorSessionsPage> {
  List<dynamic>? sessions;
  bool loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final r = await MentorService.getSessions();
    setState(() { sessions = r['sessions']; loading = false; });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xffF5F7F9),
      appBar: AppBar(title: const Text("My Sessions", style: TextStyle(fontWeight: FontWeight.bold)), backgroundColor: Colors.transparent, elevation: 0),
      body: loading
          ? const Center(child: CircularProgressIndicator())
          : sessions == null || sessions!.isEmpty
              ? const Center(child: Text("No sessions", style: TextStyle(color: Colors.grey)))
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: sessions!.length,
                  itemBuilder: (ctx, i) {
                    final s = sessions![i];
                    return Container(
                      margin: const EdgeInsets.only(bottom: 12),
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(20)),
                      child: Row(children: [
                        Container(padding: const EdgeInsets.all(12), decoration: BoxDecoration(color: const Color(0xffDDF5E8), borderRadius: BorderRadius.circular(14)), child: const Icon(Icons.event, color: Color(0xff063D33))),
                        const SizedBox(width: 16),
                        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                          Text('Startup: ${s['startup_name'] ?? 'N/A'}', style: const TextStyle(fontWeight: FontWeight.bold)),
                          Text(s['start_time'] ?? s['date'] ?? ''),
                          Text(s['status'] ?? '', style: const TextStyle(fontSize: 12, color: Colors.grey)),
                        ])),
                      ]),
                    );
                  },
                ),
    );
  }
}

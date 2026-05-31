import 'package:flutter/material.dart';
import '../../services/startup_service.dart';

class MeetingsPage extends StatefulWidget {
  const MeetingsPage({super.key});

  @override
  State<MeetingsPage> createState() => _MeetingsPageState();
}

class _MeetingsPageState extends State<MeetingsPage> {
  List<dynamic>? sessions;
  bool loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final r = await StartupService.getSessions();
    setState(() { sessions = r['sessions'] ?? r['meetings']; loading = false; });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xffF5F7F9),
      appBar: AppBar(title: const Text("Meetings", style: TextStyle(fontWeight: FontWeight.bold)), backgroundColor: Colors.transparent, elevation: 0),
      floatingActionButton: FloatingActionButton(
        backgroundColor: const Color(0xff0D5C46),
        child: const Icon(Icons.add, color: Colors.white),
        onPressed: () => _createMeeting(context),
      ),
      body: loading
          ? const Center(child: CircularProgressIndicator())
          : sessions == null || sessions!.isEmpty
              ? const Center(child: Text("No meetings scheduled", style: TextStyle(color: Colors.grey)))
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
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(color: const Color(0xffECFDF3), borderRadius: BorderRadius.circular(14)),
                          child: const Icon(Icons.event, color: Color(0xff0D5C46)),
                        ),
                        const SizedBox(width: 16),
                        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                          Text(s['title'] ?? 'Meeting', style: const TextStyle(fontWeight: FontWeight.bold)),
                          Text(s['start_time'] ?? s['date'] ?? '', style: const TextStyle(color: Colors.grey, fontSize: 12)),
                          if (s['status'] != null) Text(s['status'], style: TextStyle(color: s['status'] == 'active' ? Colors.green : Colors.grey, fontSize: 12)),
                        ])),
                        const Icon(Icons.arrow_forward_ios, size: 16, color: Colors.grey),
                      ]),
                    );
                  },
                ),
    );
  }

  void _createMeeting(BuildContext context) {
    final titleCtrl = TextEditingController();
    final dateCtrl = TextEditingController();
    showDialog(context: context, builder: (ctx) => AlertDialog(
      title: const Text("Schedule Meeting"),
      content: Column(mainAxisSize: MainAxisSize.min, children: [
        TextField(controller: titleCtrl, decoration: const InputDecoration(labelText: "Title")),
        TextField(controller: dateCtrl, decoration: const InputDecoration(labelText: "Date/Time")),
      ]),
      actions: [
        TextButton(onPressed: () => Navigator.pop(ctx), child: const Text("Cancel")),
        ElevatedButton(onPressed: () async {
          await StartupService.createSession({'title': titleCtrl.text, 'start_time': dateCtrl.text});
          Navigator.pop(ctx);
          _load();
        }, child: const Text("Create")),
      ],
    ));
  }
}

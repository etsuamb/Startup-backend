import 'package:flutter/material.dart';
import '../../services/mentor_service.dart';

class MentorProfilePage extends StatefulWidget {
  const MentorProfilePage({super.key});

  @override
  State<MentorProfilePage> createState() => _MentorProfilePageState();
}

class _MentorProfilePageState extends State<MentorProfilePage> {
  Map<String, dynamic>? profile;
  bool loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final r = await MentorService.getProfile();
    setState(() { profile = r['mentor'] ?? r; loading = false; });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xffF5F7F9),
      appBar: AppBar(title: const Text("Mentor Profile", style: TextStyle(fontWeight: FontWeight.bold)), backgroundColor: Colors.transparent, elevation: 0),
      body: loading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(24)),
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Center(child: Column(children: [
                    CircleAvatar(radius: 40, backgroundColor: const Color(0xffDDF5E8), child: const Icon(Icons.school, size: 40, color: Color(0xff063D33))),
                    const SizedBox(height: 12),
                    Text(profile?['name'] ?? 'Mentor', style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
                    Text(profile?['professional_title'] ?? '', style: const TextStyle(color: Colors.grey)),
                  ])),
                  const Divider(height: 32),
                  if (profile?['bio'] != null) ...[
                    const Text("Bio", style: TextStyle(color: Colors.grey, fontWeight: FontWeight.w600)),
                    Text(profile!['bio']),
                    const SizedBox(height: 16),
                  ],
                  if (profile?['expertise_areas'] != null) ...[
                    const Text("Expertise", style: TextStyle(color: Colors.grey, fontWeight: FontWeight.w600)),
                    const SizedBox(height: 8),
                    Wrap(spacing: 8, runSpacing: 8, children: (profile!['expertise_areas'] as List).map((e) =>
                      Container(padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6), decoration: BoxDecoration(color: const Color(0xffDDF5E8), borderRadius: BorderRadius.circular(20)), child: Text(e, style: const TextStyle(color: Color(0xff063D33))))
                    ).toList()),
                    const SizedBox(height: 16),
                  ],
                  _item("Experience", profile?['years_of_experience'] ?? 'N/A'),
                  _item("Availability", profile?['availability'] ?? 'N/A'),
                  _item("Location", profile?['city'] ?? 'N/A'),
                ]),
              ),
            ),
    );
  }

  Widget _item(String label, String value) {
    return Padding(padding: const EdgeInsets.only(bottom: 8), child: Row(children: [
      SizedBox(width: 120, child: Text(label, style: const TextStyle(color: Colors.grey, fontWeight: FontWeight.w600))),
      Expanded(child: Text(value, style: const TextStyle(fontWeight: FontWeight.bold))),
    ]));
  }
}

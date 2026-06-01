import 'package:flutter/material.dart';
import '../../services/startup_service.dart';

class DiscoverDetailPage extends StatelessWidget {
  final Map<String, dynamic> item;
  final String type;
  const DiscoverDetailPage({super.key, required this.item, required this.type});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xffF5F7F9),
      appBar: AppBar(title: Text(item['name'] ?? 'Details', style: const TextStyle(fontWeight: FontWeight.bold)), backgroundColor: Colors.transparent, elevation: 0),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(children: [
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(24)),
            child: Column(children: [
              CircleAvatar(radius: 40, backgroundColor: const Color(0xffECFDF3), child: Icon(type == 'investor' ? Icons.account_balance : Icons.school, size: 40, color: const Color(0xff0D5C46))),
              const SizedBox(height: 16),
              Text(item['name'] ?? item['organization_name'] ?? '', style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
              const SizedBox(height: 4),
              Text(item['industry'] ?? item['investor_type'] ?? '', style: const TextStyle(color: Colors.grey)),
              if (item['bio'] != null) ...[const SizedBox(height: 12), Text(item['bio'], textAlign: TextAlign.center)],
              if (item['investment_range'] != null) ...[
                const Divider(height: 32),
                _label("Investment Range"),
                Text(item['investment_range'], style: const TextStyle(fontWeight: FontWeight.bold)),
              ],
              if (item['preferred_stage'] != null) ...[
                const SizedBox(height: 12),
                _label("Preferred Stage"),
                Text(item['preferred_stage'], style: const TextStyle(fontWeight: FontWeight.bold)),
              ],
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(backgroundColor: const Color(0xff0D5C46), padding: const EdgeInsets.symmetric(vertical: 16)),
                  onPressed: () async {
                    final msgController = TextEditingController();
                    showDialog(context: context, builder: (ctx) => AlertDialog(
                      title: Text(type == 'investor' ? 'Apply to Investor' : 'Request Mentor'),
                      content: TextField(controller: msgController, maxLines: 3, decoration: const InputDecoration(hintText: "Tell them why you're interested...")),
                      actions: [
                        TextButton(onPressed: () => Navigator.pop(ctx), child: const Text("Cancel")),
                        ElevatedButton(onPressed: () async {
                          Navigator.pop(ctx);
                          final r = type == 'investor'
                              ? await StartupService.applyToInvestor(item['id'], msgController.text)
                              : await StartupService.requestMentor(item['id'], msgController.text);
                          if (r['error'] == null) {
                            ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Request sent successfully!")));
                          } else {
                            ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(r['error'])));
                          }
                        }, child: const Text("Send")),
                      ],
                    ));
                  },
                  child: Text(type == 'investor' ? "Apply to Investor" : "Request Mentorship", style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                ),
              ),
            ]),
          ),
        ]),
      ),
    );
  }

  Widget _label(String text) {
    return Text(text, style: const TextStyle(color: Colors.grey, fontWeight: FontWeight.w600, fontSize: 12));
  }
}

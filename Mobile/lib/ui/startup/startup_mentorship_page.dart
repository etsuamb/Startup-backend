import 'package:flutter/material.dart';

class StartupMentorshipPage extends StatefulWidget {
  const StartupMentorshipPage({super.key});

  @override
  State<StartupMentorshipPage> createState() => _StartupMentorshipPageState();
}

class _StartupMentorshipPageState extends State<StartupMentorshipPage> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xffF5F7F9),
      appBar: AppBar(title: const Text("Mentorship", style: TextStyle(fontWeight: FontWeight.bold)), backgroundColor: Colors.transparent, elevation: 0),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(20)),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              const Text("Mentorship Program", style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              const Text("Get guidance from experienced mentors to help scale your startup.", style: TextStyle(color: Colors.grey)),
              const SizedBox(height: 20),
              SizedBox(width: double.infinity, child: ElevatedButton(
                style: ElevatedButton.styleFrom(backgroundColor: const Color(0xff0D5C46), padding: const EdgeInsets.symmetric(vertical: 16)),
                onPressed: () {},
                child: const Text("Find a Mentor", style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
              )),
            ]),
          ),
          const SizedBox(height: 16),
          const Text("Active Mentorships", style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.all(40),
            decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(20)),
            child: const Center(child: Text("No active mentorships", style: TextStyle(color: Colors.grey))),
          ),
        ],
      ),
    );
  }
}

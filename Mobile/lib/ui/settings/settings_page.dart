import 'package:flutter/material.dart';
import '../../services/auth_service.dart';
import '../login_page.dart';

class SettingsPage extends StatefulWidget {
  const SettingsPage({super.key});

  @override
  State<SettingsPage> createState() => _SettingsPageState();
}

class _SettingsPageState extends State<SettingsPage> {
  Map<String, dynamic>? user;
  bool loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final r = await AuthService.getMe();
    setState(() { user = r['user'] ?? r; loading = false; });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xffF5F7F9),
      appBar: AppBar(title: const Text("Settings", style: TextStyle(fontWeight: FontWeight.bold)), backgroundColor: Colors.transparent, elevation: 0),
      body: loading
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(20)),
                  child: Column(children: [
                    CircleAvatar(radius: 40, backgroundColor: const Color(0xffECFDF3), child: const Icon(Icons.person, size: 40, color: Color(0xff0D5C46))),
                    const SizedBox(height: 12),
                    Text('${user?['first_name'] ?? ''} ${user?['last_name'] ?? ''}', style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                    Text(user?['email'] ?? '', style: const TextStyle(color: Colors.grey)),
                    Text('Role: ${user?['role'] ?? ''}', style: const TextStyle(color: Color(0xff0D5C46), fontWeight: FontWeight.bold)),
                  ]),
                ),
                const SizedBox(height: 16),
                Container(
                  decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(20)),
                  child: Column(children: [
                    ListTile(leading: const Icon(Icons.person_outline), title: const Text("Edit Profile"), trailing: const Icon(Icons.arrow_forward_ios, size: 16), onTap: () {}),
                    const Divider(height: 1, indent: 56),
                    ListTile(leading: const Icon(Icons.notifications_outlined), title: const Text("Notifications"), trailing: const Icon(Icons.arrow_forward_ios, size: 16), onTap: () {}),
                    const Divider(height: 1, indent: 56),
                    ListTile(leading: const Icon(Icons.lock_outline), title: const Text("Change Password"), trailing: const Icon(Icons.arrow_forward_ios, size: 16), onTap: () {}),
                  ]),
                ),
                const SizedBox(height: 16),
                Container(
                  decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(20)),
                  child: ListTile(
                    leading: const Icon(Icons.logout, color: Colors.red),
                    title: const Text("Logout", style: TextStyle(color: Colors.red)),
                    onTap: () async {
                      await AuthService.logout();
                      Navigator.pushAndRemoveUntil(context, MaterialPageRoute(builder: (_) => const LoginPage()), (route) => false);
                    },
                  ),
                ),
              ],
            ),
    );
  }
}

import 'package:flutter/material.dart';
import 'startup_registration_page.dart';
import 'login_page.dart';
import 'investor_registration_page.dart';
import 'mentor_registration_page.dart';

class RoleSelectionPage extends StatefulWidget {
  final String? firstName;
  final String? lastName;
  final String? email;
  final String? password;
  final String? phoneNumber;

  const RoleSelectionPage({super.key, this.firstName, this.lastName, this.email, this.password, this.phoneNumber});

  @override
  State<RoleSelectionPage> createState() => _RoleSelectionPageState();
}

class _RoleSelectionPageState extends State<RoleSelectionPage> {
  String? selectedRole;

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    final bool isMobile = size.width < 700;

    return Scaffold(
      backgroundColor: const Color(0xffF7F8FA),
      body: SafeArea(
        child: SingleChildScrollView(
          child: Padding(
            padding: EdgeInsets.symmetric(horizontal: isMobile ? 20 : 40, vertical: 20),
            child: Column(children: [
              LayoutBuilder(builder: (context, constraints) {
                final bool isMobile = constraints.maxWidth < 700;
                return Row(crossAxisAlignment: CrossAxisAlignment.center, children: [
                  Expanded(child: FittedBox(
                    fit: BoxFit.scaleDown, alignment: Alignment.centerLeft,
                    child: Row(mainAxisSize: MainAxisSize.min, children: [
                      Image.asset("images/logo.png", width: isMobile ? 34 : 42, height: isMobile ? 34 : 42, fit: BoxFit.contain),
                      const SizedBox(width: 8),
                      Text("StartupConnect", overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: isMobile ? 16 : 18, fontWeight: FontWeight.bold, color: const Color(0xff0D3B36))),
                    ]),
                  )),
                  Flexible(child: FittedBox(
                    fit: BoxFit.scaleDown,
                    child: Row(mainAxisSize: MainAxisSize.min, children: [
                      Container(padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8), decoration: BoxDecoration(color: const Color(0xffE9F7F0), borderRadius: BorderRadius.circular(10), border: Border.all(color: const Color(0xffB8E7D2))), child: Row(mainAxisSize: MainAxisSize.min, children: [
                        const Icon(Icons.lock_outline, size: 16, color: Color(0xff0E6245)),
                        const SizedBox(width: 6),
                        Text("SECURE", style: TextStyle(color: const Color(0xff0E6245), fontWeight: FontWeight.bold, fontSize: isMobile ? 9 : 11, letterSpacing: 1)),
                      ])),
                    ]),
                  )),
                ]);
              }),
              SizedBox(height: isMobile ? 40 : 64),
              FittedBox(
                fit: BoxFit.scaleDown,
                child: Text("Choose your role", textAlign: TextAlign.center, style: TextStyle(fontSize: isMobile ? 28 : 44, fontWeight: FontWeight.bold, color: const Color(0xff0D1833))),
              ),
              const SizedBox(height: 10),
              Text("Select how you want to participate in the startup ecosystem", textAlign: TextAlign.center, style: TextStyle(fontSize: isMobile ? 14 : 18, color: const Color(0xff7B8494))),
              SizedBox(height: isMobile ? 30 : 50),
              Center(child: Wrap(
                spacing: 20, runSpacing: 20,
                alignment: WrapAlignment.center,
                children: [
                  _RoleCard(
                    icon: Icons.rocket_launch,
                    title: "Startup Founder",
                    description: "Register your startup, connect with investors and mentors",
                    features: ["Create startup profile", "Find investors & mentors", "Manage funding"],
                    isSelected: selectedRole == "startup",
                    onTap: () => setState(() => selectedRole = "startup"),
                    isMobile: isMobile,
                  ),
                  _RoleCard(
                    icon: Icons.account_balance,
                    title: "Investor",
                    description: "Discover and invest in promising Ethiopian startups",
                    features: ["Browse startups", "Make funding offers", "Track portfolio"],
                    isSelected: selectedRole == "investor",
                    onTap: () => setState(() => selectedRole = "investor"),
                    isMobile: isMobile,
                  ),
                  _RoleCard(
                    icon: Icons.school,
                    title: "Mentor",
                    description: "Guide and support the next generation of entrepreneurs",
                    features: ["Share expertise", "Review startups", "Schedule sessions"],
                    isSelected: selectedRole == "mentor",
                    onTap: () => setState(() => selectedRole = "mentor"),
                    isMobile: isMobile,
                  ),
                ],
              )),
              SizedBox(height: isMobile ? 30 : 50),
              SizedBox(
                width: 320, height: 56,
                child: ElevatedButton(
                  onPressed: selectedRole == null ? null : () {
                    Widget page;
                    final fullName = '${widget.firstName ?? ''} ${widget.lastName ?? ''}'.trim();
                    final accountData = {
                      'first_name': widget.firstName ?? '',
                      'last_name': widget.lastName ?? '',
                      'full_name': fullName,
                      'email': widget.email ?? '',
                      'password': widget.password ?? '',
                      'phone_number': widget.phoneNumber ?? '',
                    };
                    switch (selectedRole) {
                      case 'investor':
                        page = InvestorRegistrationPage(accountData: accountData);
                        break;
                      case 'mentor':
                        page = MentorRegistrationPage(accountData: accountData);
                        break;
                      default:
                        page = StartupRegistrationPage(accountData: accountData);
                    }
                    Navigator.push(context, MaterialPageRoute(builder: (_) => page));
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xff065F46), foregroundColor: Colors.white, elevation: 0,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                  child: const Text("Continue", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
                ),
              ),
              const SizedBox(height: 30),
              Wrap(alignment: WrapAlignment.center, children: [
                const Text("Already have an account? ", style: TextStyle(color: Color(0xff7B8494), fontSize: 15)),
                InkWell(onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const LoginPage())), child: const Text("Log in", style: TextStyle(color: Color(0xff0D3B36), fontSize: 15, fontWeight: FontWeight.bold))),
              ]),
              const SizedBox(height: 40),
              Wrap(alignment: WrapAlignment.center, spacing: 20, runSpacing: 10, children: [
                footerButton("StartupConnect Ethiopia"),
                footerButton("PRIVACY POLICY"),
                footerButton("TERMS OF SERVICE"),
                footerButton("CONTACT SUPPORT"),
              ]),
              const SizedBox(height: 14),
              const Text("© 2026 STARTUPCONNECT ETHIOPIA. ALL RIGHTS RESERVED.", textAlign: TextAlign.center, style: TextStyle(color: Color(0xff9AA3B2), fontSize: 12, letterSpacing: 0.6)),
              const SizedBox(height: 24),
            ]),
          ),
        ),
      ),
    );
  }

  Widget footerButton(String text) {
    return InkWell(onTap: (){}, child: Text(text, style: const TextStyle(color: Color(0xff8A94A6), fontSize: 13, fontWeight: FontWeight.w600, letterSpacing: 0.5)));
  }
}

class _RoleCard extends StatelessWidget {
  final IconData icon;
  final String title, description;
  final List<String> features;
  final bool isSelected;
  final VoidCallback onTap;
  final bool isMobile;

  const _RoleCard({required this.icon, required this.title, required this.description, required this.features, required this.isSelected, required this.onTap, required this.isMobile});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        width: isMobile ? 300 : 320,
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xffF0FDF6) : Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: isSelected ? const Color(0xff0B7A5B) : const Color(0xffE0E3E8), width: isSelected ? 2 : 1),
          boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 12, offset: const Offset(0, 4))],
        ),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Container(padding: const EdgeInsets.all(12), decoration: BoxDecoration(color: isSelected ? const Color(0xffD1FAE5) : const Color(0xffF2F4F7), borderRadius: BorderRadius.circular(14)), child: Icon(icon, color: isSelected ? const Color(0xff065F46) : const Color(0xff475467), size: 28)),
          const SizedBox(height: 16),
          Text(title, style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: isSelected ? const Color(0xff065F46) : const Color(0xff111827))),
          const SizedBox(height: 8),
          Text(description, style: const TextStyle(color: Color(0xff667085), fontSize: 14, height: 1.5)),
          const SizedBox(height: 16),
          ...features.map((f) => Padding(padding: const EdgeInsets.only(bottom: 6), child: Row(children: [
            Icon(Icons.check_circle, size: 16, color: isSelected ? const Color(0xff0B7A5B) : const Color(0xff98A2B3)),
            const SizedBox(width: 8),
            Text(f, style: TextStyle(color: isSelected ? const Color(0xff344054) : const Color(0xff667085), fontSize: 13)),
          ]))),
        ]),
      ),
    );
  }
}

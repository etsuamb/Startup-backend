// lib/ui/home_page.dart

import 'package:flutter/material.dart';
import 'register_page.dart';
import 'login_page.dart';
import '../services/startup_service.dart';

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  List<Map<String, dynamic>> startups = [];
  bool loadingStartups = true;

  @override
  void initState() {
    super.initState();
    _loadStartups();
  }

  Future<void> _loadStartups() async {
    final r = await StartupService.getFeatured(limit: 5);
    final list = r['startups'] as List<dynamic>? ?? [];
    setState(() {
      startups = list.map((e) => {
        "image": "images/home_page_image.png",
        "category": e['industry'] ?? e['category'] ?? 'General',
        "stage": e['stage'] ?? 'N/A',
        "title": e['name'] ?? 'Unknown',
        "description": e['description'] ?? e['tagline'] ?? '',
      }).toList();
      loadingStartups = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;

    // RESPONSIVE VALUES
    final bool isSmall = size.width < 380;

    return Scaffold(
      backgroundColor: const Color(0xffF5F7FA),

      // =========================================================
      // FIXED APP BAR
      // =========================================================
      appBar: PreferredSize(
        preferredSize: const Size.fromHeight(75),
        child: Container(
          color: Colors.white,
          child: SafeArea(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12),
              child: Row(
                children: [
                  // =================================================
                  // LOGO SECTION
                  // =================================================
                  Flexible(
                    child: Row(
                      children: [
                        Image.asset(
                          "images/logo.png",
                          width: isSmall ? 34 : 40,
                          height: isSmall ? 34 : 40,
                          fit: BoxFit.contain,
                        ),

                        const SizedBox(width: 8),

                        Flexible(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            crossAxisAlignment:
                                CrossAxisAlignment.start,
                            children: [
                              Text(
                                "StartupConnect",
                                overflow: TextOverflow.ellipsis,
                                style: TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: isSmall ? 15 : 17,
                                  color: const Color(0xff111827),
                                ),
                              ),

                              Text(
                                "Ethiopia",
                                style: TextStyle(
                                  fontSize: isSmall ? 12 : 13,
                                  color: const Color(0xff1E8E73),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(width: 8),

                  // =================================================
                  // BUTTONS
                  // =================================================
                  Row(
                    children: [
                  OutlinedButton(
                    onPressed: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => const LoginPage(),
                        ),
                      );
                    },
                    style: OutlinedButton.styleFrom(
                      minimumSize: Size(
                        isSmall ? 70 : 80,
                        42,
                      ),
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                      ),
                      shape: RoundedRectangleBorder(
                        borderRadius:
                            BorderRadius.circular(10),
                      ),
                      side: const BorderSide(
                        color: Color(0xff1E8E73),
                      ),
                    ),
                    child: Text(
                      "Login",
                      style: TextStyle(
                        fontSize: isSmall ? 13 : 14,
                        color: const Color(0xff1E8E73),
                      ),
                    ),
                  ),

                      const SizedBox(width: 8),

                      ElevatedButton(
                        onPressed: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (context) => const RegisterPage(),
                            ),
                          );
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor:
                              const Color(0xff1E8E73),
                          foregroundColor: Colors.white,
                          elevation: 0,
                          minimumSize: Size(
                            isSmall ? 78 : 90,
                            42,
                          ),
                          padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                          ),
                          shape: RoundedRectangleBorder(
                            borderRadius:
                                BorderRadius.circular(10),
                          ),
                        ),
                        child: Text(
                          "Register",
                          style: TextStyle(
                            fontSize: isSmall ? 13 : 14,
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      ),

      // =========================================================
      // BODY
      // =========================================================
      body: SingleChildScrollView(
        child: Column(
          children: [
            // =====================================================
            // HERO SECTION
            // =====================================================
            Stack(
              children: [
                SizedBox(
                  height: size.height * 0.65,
                  width: double.infinity,
                  child: Image.asset(
                    "images/home_page_image.png",
                    fit: BoxFit.cover,
                  ),
                ),

                Container(
                  height: size.height * 0.65,
                  color: Colors.black.withOpacity(0.55),
                ),

                SizedBox(
                  height: size.height * 0.65,
                  width: double.infinity,
                  child: Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 22,
                    ),
                    child: Column(
                      mainAxisAlignment:
                          MainAxisAlignment.center,
                      children: [
                        Text(
                          "Connecting Ethiopian Startups with Investors and Mentors",
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: isSmall ? 30 : 38,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                            height: 1.2,
                          ),
                        ),

                        const SizedBox(height: 20),

                        Text(
                          "A digital platform that helps startups gain visibility, secure funding, and receive structured mentorship.",
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: isSmall ? 15 : 18,
                            color: Colors.white70,
                            height: 1.6,
                          ),
                        ),

                        const SizedBox(height: 30),

                        SizedBox(
                          width: double.infinity,
                          child: ElevatedButton(
                            onPressed: () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (context) => const RegisterPage(),
                                ),
                              );
                            },
                            style: ElevatedButton.styleFrom(
                              backgroundColor:
                                  const Color(0xff1E8E73),
                              foregroundColor: Colors.white,
                              padding:
                                  const EdgeInsets.symmetric(
                                vertical: 16,
                              ),
                              shape: RoundedRectangleBorder(
                                borderRadius:
                                    BorderRadius.circular(12),
                              ),
                            ),
                            child: const Text(
                              "Join Us",
                              style: TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),

            // =====================================================
            // HOW IT WORKS
            // =====================================================
            sectionTitle(
              "How It Works",
              isSmall,
            ),

            Padding(
              padding:
                  const EdgeInsets.symmetric(horizontal: 18),
              child: Column(
                children: [
                  howItWorksCard(
                    number: "1",
                    title: "Create your profile",
                    description:
                        "Set up your startup, investor, or mentor profile in minutes.",
                    isSmall: isSmall,
                  ),

                  howItWorksCard(
                    number: "2",
                    title: "Connect with partners",
                    description:
                        "Find the right investors and mentors using smart matching algorithms.",
                    isSmall: isSmall,
                  ),

                  howItWorksCard(
                    number: "3",
                    title: "Grow your startup",
                    description:
                        "Secure funding, get expert advice, and scale your business.",
                    isSmall: isSmall,
                  ),
                ],
              ),
            ),

            // =====================================================
            // BENEFITS
            // =====================================================
            sectionTitle(
              "Benefits by Role",
              isSmall,
            ),

            Padding(
              padding:
                  const EdgeInsets.symmetric(horizontal: 22),
              child: Column(
                crossAxisAlignment:
                    CrossAxisAlignment.start,
                children: [
                  benefitsSection(
                    title: "For Startups",
                    items: [
                      "Showcase your startup to active local investors",
                      "Find mentors based on your operational stage",
                      "Gain visibility through startup profiles",
                      "Form relationships with top experts",
                    ],
                    isSmall: isSmall,
                  ),

                  const SizedBox(height: 30),

                  benefitsSection(
                    title: "For Investors",
                    items: [
                      "Discover verified Ethiopian startups",
                      "Filter by industry, funding needed and size",
                      "Manage your deal flow completely",
                      "Co-invest with other investors",
                    ],
                    isSmall: isSmall,
                  ),

                  const SizedBox(height: 30),

                  benefitsSection(
                    title: "For Mentors",
                    items: [
                      "Give back to the ecosystem",
                      "Share your expertise and experience",
                      "Track startup progress",
                      "Build your mentorship portfolio",
                    ],
                    isSmall: isSmall,
                  ),
                ],
              ),
            ),

            // =====================================================
            // FEATURED STARTUPS
            // =====================================================
            sectionTitle(
              "Featured Startups",
              isSmall,
            ),

            loadingStartups
                ? Padding(
                    padding: const EdgeInsets.all(22),
                    child: Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(30),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: const Center(
                        child: CircularProgressIndicator(),
                      ),
                    ),
                  )
                : startups.isEmpty
                ? Padding(
                    padding: const EdgeInsets.all(22),
                    child: Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(30),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius:
                            BorderRadius.circular(20),
                      ),
                      child: Center(
                        child: Text(
                          "No startups registered",
                          style: TextStyle(
                            fontSize:
                                isSmall ? 16 : 18,
                            color: Colors.black54,
                          ),
                        ),
                      ),
                    ),
                  )
                : ListView.builder(
                    itemCount: startups.length,
                    shrinkWrap: true,
                    physics:
                        const NeverScrollableScrollPhysics(),
                    padding:
                        const EdgeInsets.symmetric(
                      horizontal: 18,
                    ),
                    itemBuilder: (context, index) {
                      final startup = startups[index];

                      return startupCard(
                        startup,
                        isSmall,
                      );
                    },
                  ),

            // =====================================================
            // CTA
            // =====================================================
            Container(
              width: double.infinity,
              margin: const EdgeInsets.only(top: 40),
              padding:
                  const EdgeInsets.symmetric(
                horizontal: 22,
                vertical: 55,
              ),
              color: const Color(0xff1E8E73),
              child: Column(
                children: [
                  Text(
                    "Be part of Ethiopia's growing startup ecosystem",
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: Colors.white,
                      fontSize:
                          isSmall ? 28 : 36,
                      fontWeight: FontWeight.bold,
                      height: 1.3,
                    ),
                  ),

                  const SizedBox(height: 22),

                  Text(
                    "Join thousands of startups, investors, and mentors building the future.",
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: Colors.white70,
                      fontSize:
                          isSmall ? 15 : 18,
                      height: 1.6,
                    ),
                  ),

                  const SizedBox(height: 30),

                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (context) => const RegisterPage(),
                          ),
                        );
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.white,
                        foregroundColor:
                            const Color(0xff1E8E73),
                        padding:
                            const EdgeInsets.symmetric(
                          vertical: 16,
                        ),
                        shape: RoundedRectangleBorder(
                          borderRadius:
                              BorderRadius.circular(12),
                        ),
                      ),
                      child: const Text(
                        "Create your account",
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 18,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),

            // =====================================================
            // FOOTER
            // =====================================================
            footerSection(isSmall),
          ],
        ),
      ),
    );
  }

  // =========================================================
  // SECTION TITLE
  // =========================================================

  Widget sectionTitle(
    String title,
    bool isSmall,
  ) {
    return Padding(
      padding: const EdgeInsets.only(
        top: 50,
        bottom: 30,
      ),
      child: Text(
        title,
        textAlign: TextAlign.center,
        style: TextStyle(
          fontSize: isSmall ? 30 : 38,
          fontWeight: FontWeight.bold,
          color: const Color(0xff111827),
        ),
      ),
    );
  }

  // =========================================================
  // HOW IT WORKS CARD
  // =========================================================

  Widget howItWorksCard({
    required String number,
    required String title,
    required String description,
    required bool isSmall,
  }) {
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(bottom: 20),
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(22),
      ),
      child: Column(
        children: [
          CircleAvatar(
            radius: isSmall ? 30 : 35,
            backgroundColor: const Color(0xffE8F7F0),
            child: Text(
              number,
              style: TextStyle(
                fontSize: isSmall ? 22 : 28,
                fontWeight: FontWeight.bold,
                color: const Color(0xff1E8E73),
              ),
            ),
          ),

          const SizedBox(height: 24),

          Text(
            title,
            textAlign: TextAlign.center,
            style: TextStyle(
              fontWeight: FontWeight.bold,
              fontSize: isSmall ? 24 : 28,
            ),
          ),

          const SizedBox(height: 14),

          Text(
            description,
            textAlign: TextAlign.center,
            style: TextStyle(
              color: Colors.black54,
              fontSize: isSmall ? 15 : 18,
              height: 1.6,
            ),
          ),
        ],
      ),
    );
  }

  // =========================================================
  // BENEFITS
  // =========================================================

  Widget benefitsSection({
    required String title,
    required List<String> items,
    required bool isSmall,
  }) {
    return Column(
      crossAxisAlignment:
          CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: TextStyle(
            color: const Color(0xff1E8E73),
            fontWeight: FontWeight.bold,
            fontSize: isSmall ? 28 : 32,
          ),
        ),

        const SizedBox(height: 22),

        ...items.map(
          (item) => Padding(
            padding:
                const EdgeInsets.only(bottom: 16),
            child: Row(
              crossAxisAlignment:
                  CrossAxisAlignment.start,
              children: [
                const Padding(
                  padding: EdgeInsets.only(top: 4),
                  child: Icon(
                    Icons.check,
                    color: Color(0xff1E8E73),
                  ),
                ),

                const SizedBox(width: 12),

                Expanded(
                  child: Text(
                    item,
                    style: TextStyle(
                      fontSize:
                          isSmall ? 15 : 18,
                      color: Colors.black87,
                      height: 1.6,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  // =========================================================
  // STARTUP CARD
  // =========================================================

  Widget startupCard(
    Map<String, dynamic> startup,
    bool isSmall,
  ) {
    return Container(
      margin: const EdgeInsets.only(bottom: 24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(22),
      ),
      child: Column(
        crossAxisAlignment:
            CrossAxisAlignment.start,
        children: [
          ClipRRect(
            borderRadius:
                const BorderRadius.vertical(
              top: Radius.circular(22),
            ),
            child: Image.asset(
              startup["image"],
              height: 220,
              width: double.infinity,
              fit: BoxFit.cover,
            ),
          ),

          Padding(
            padding: const EdgeInsets.all(22),
            child: Column(
              crossAxisAlignment:
                  CrossAxisAlignment.start,
              children: [
                Wrap(
                  spacing: 10,
                  runSpacing: 10,
                  children: [
                    startupTag(startup["category"]),
                    startupTag(startup["stage"]),
                  ],
                ),

                const SizedBox(height: 18),

                Text(
                  startup["title"],
                  style: TextStyle(
                    fontSize: isSmall ? 26 : 30,
                    fontWeight: FontWeight.bold,
                  ),
                ),

                const SizedBox(height: 14),

                Text(
                  startup["description"],
                  style: TextStyle(
                    color: Colors.black54,
                    fontSize: isSmall ? 15 : 18,
                    height: 1.6,
                  ),
                ),

                const SizedBox(height: 24),

                OutlinedButton(
                  onPressed: () {
                    // LATER:
                    // Navigate to startup details page
                  },
                  style: OutlinedButton.styleFrom(
                    padding:
                        const EdgeInsets.symmetric(
                      horizontal: 22,
                      vertical: 16,
                    ),
                    shape: RoundedRectangleBorder(
                      borderRadius:
                          BorderRadius.circular(12),
                    ),
                    side: const BorderSide(
                      color: Color(0xff1E8E73),
                    ),
                  ),
                  child: const Text(
                    "View details",
                    style: TextStyle(
                      color: Color(0xff1E8E73),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget startupTag(String text) {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: 14,
        vertical: 8,
      ),
      decoration: BoxDecoration(
        color: const Color(0xffE8F7F0),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        text,
        style: const TextStyle(
          color: Color(0xff1E8E73),
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }

  // =========================================================
  // FOOTER
  // =========================================================

  Widget footerSection(bool isSmall) {
    return Container(
      width: double.infinity,
      color: const Color(0xff0D2238),
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment:
            CrossAxisAlignment.start,
        children: [
          Text(
            "StartupConnect Ethiopia",
            style: TextStyle(
              color: Colors.white,
              fontSize: isSmall ? 28 : 34,
              fontWeight: FontWeight.bold,
            ),
          ),

          const SizedBox(height: 16),

          Text(
            "Connecting innovators with investors and mentors across Ethiopia.",
            style: TextStyle(
              color: Colors.white70,
              fontSize: isSmall ? 15 : 18,
              height: 1.6,
            ),
          ),

          const SizedBox(height: 26),

          // =====================================================
          // SOCIAL BUTTONS
          // =====================================================
          Row(
            children: [
              socialButton("FB"),
              const SizedBox(width: 12),
              socialButton("TW"),
              const SizedBox(width: 12),
              socialButton("IN"),
            ],
          ),

          const SizedBox(height: 40),

          footerGroup(
            title: "Quick Links",
            links: [
              "Home",
              "About",
              "Browse Startups",
              "Contact",
              "Login",
            ],
            isSmall: isSmall,
          ),

          const SizedBox(height: 40),

          footerGroup(
            title: "For Users",
            links: [
              "Join as Startup",
              "Join as Investor",
              "Join as Mentor",
              "Success Stories",
            ],
            isSmall: isSmall,
          ),

          const SizedBox(height: 40),

          footerGroup(
            title: "Resources",
            links: [
              "Blog",
              "Events",
              "FAQ",
              "Privacy Policy",
              "Terms of Service",
            ],
            isSmall: isSmall,
          ),

          const SizedBox(height: 40),

          const Divider(
            color: Colors.white24,
          ),

          const SizedBox(height: 22),

          Text(
            "© 2026 StartupConnect Ethiopia. All rights reserved.",
            style: TextStyle(
              color: Colors.white54,
              fontSize: isSmall ? 14 : 16,
            ),
          ),
        ],
      ),
    );
  }

  Widget socialButton(String text) {
    return InkWell(
      onTap: () {
        // CLICKABLE FOR LATER
      },
      borderRadius: BorderRadius.circular(50),
      child: Container(
        width: 50,
        height: 50,
        decoration: BoxDecoration(
          color: Colors.white10,
          borderRadius:
              BorderRadius.circular(50),
        ),
        child: Center(
          child: Text(
            text,
            style: const TextStyle(
              color: Colors.white70,
              fontWeight: FontWeight.w500,
            ),
          ),
        ),
      ),
    );
  }

  Widget footerGroup({
    required String title,
    required List<String> links,
    required bool isSmall,
  }) {
    return Column(
      crossAxisAlignment:
          CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.bold,
            fontSize: isSmall ? 24 : 28,
          ),
        ),

        const SizedBox(height: 18),

        ...links.map(
          (link) => Padding(
            padding:
                const EdgeInsets.only(bottom: 14),
            child: InkWell(
              onTap: () {
                // CLICKABLE FOR LATER
              },
              child: Text(
                link,
                style: TextStyle(
                  color: Colors.white70,
                  fontSize:
                      isSmall ? 15 : 18,
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }
}
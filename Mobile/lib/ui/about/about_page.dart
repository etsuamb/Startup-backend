import 'package:flutter/material.dart';
import 'package:startup_connect/ui/browse/browse_startups_page.dart';
import 'package:startup_connect/widgets/app_menu_drawer.dart';
import 'package:startup_connect/widgets/primary_button.dart';
import 'package:startup_connect/widgets/secondary_button.dart';


import 'widgets/about_card.dart';
import 'widgets/framework_card.dart';
import 'widgets/audience_card.dart';
import 'widgets/section_title.dart';

class AboutPage extends StatelessWidget {
  const AboutPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      endDrawer: const AppMenuDrawer(),
      backgroundColor: const Color(0xFFF5F5F5),

      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(
            horizontal: 22,
            vertical: 16,
          ),

          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [

              // APP BAR
              Row(
                children: [

                  const Text(
                    'StartupConnect',
                    style: TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.w700,
                      color: Color(0xFF00695C),
                    ),
                  ),

                  const Spacer(),

                  Builder(
                    builder: (context) {
                      return IconButton(
                        onPressed: () {
                          Scaffold.of(context).openEndDrawer();
                        },
                        icon: const Icon(Icons.menu),
                      );
                    },
                  ),
                ],
              ),

              const SizedBox(height: 30),

              // ABOUT TAG
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 14,
                  vertical: 6,
                ),

                decoration: BoxDecoration(
                  color: const Color(0xFFF4D9B1),
                  borderRadius: BorderRadius.circular(20),
                ),

                child: const Text(
                  'ABOUT US',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 1,
                    color: Color(0xFF8D5B00),
                  ),
                ),
              ),

              const SizedBox(height: 22),

              // TITLE
              const Text(
                'What is\nStartupConnect\nEthiopia?',
                style: TextStyle(
                  fontSize: 40,
                  height: 1.05,
                  fontWeight: FontWeight.w800,
                ),
              ),

              const SizedBox(height: 18),

              Text(
                'A platform connecting startups, investors, and mentors to grow innovation in Ethiopia.',
                style: TextStyle(
                  fontSize: 16,
                  color: Colors.grey.shade700,
                  height: 1.5,
                ),
              ),

              const SizedBox(height: 32),

              // MISSION
              const AboutCard(
                icon: Icons.track_changes,
                iconColor: Color(0xFF00695C),
                backgroundColor: Color(0xFFE5F3F1),
                title: 'Our Mission',
                description:
                    'To empower startups by connecting them with investors and mentors who can help them grow.',
              ),

              const SizedBox(height: 20),

              // VISION
              const AboutCard(
                icon: Icons.remove_red_eye_outlined,
                iconColor: Color(0xFF9A6A00),
                backgroundColor: Color(0xFFF6E7C9),
                title: 'Our Vision',
                description:
                    'To become Ethiopia’s leading ecosystem for innovation and startup growth.',
              ),

              const SizedBox(height: 34),

              // FRAMEWORK TITLE
              const SectionTitle(
                title: 'THE FRAMEWORK',
              ),

              const SizedBox(height: 20),

              // CHALLENGE
              const FrameworkCard(
                title: 'THE CHALLENGE',
                titleColor: Color(0xFFE53935),
                backgroundColor: Colors.white,
                description:
                    'Startups struggle to find funding and mentorship. Investors lack access to verified startups.',
              ),

              const SizedBox(height: 18),

              // SOLUTION
              const FrameworkCard(
                title: 'OUR SOLUTION',
                titleColor: Colors.white,
                backgroundColor: Color(0xFF00796B),
                description:
                    'Centralized platform for matching startups, investors, and mentors. Verified ecosystem with admin approval system.',
                isDark: true,
              ),

              const SizedBox(height: 40),

              // WHO WE SERVE
              const Text(
                'Who We Serve',
                style: TextStyle(
                  fontSize: 30,
                  fontWeight: FontWeight.w800,
                ),
              ),

              const SizedBox(height: 24),

              const AudienceCard(
                icon: Icons.rocket_launch_outlined,
                title: 'Startups',
                description:
                    'Early-stage innovators seeking scale.',
                iconColor: Color(0xFF00695C),
                backgroundColor: Color(0xFFE5F3F1),
              ),

              const SizedBox(height: 16),

              const AudienceCard(
                icon: Icons.account_balance_wallet_outlined,
                title: 'Investors',
                description:
                    'Venture capital and angel networks.',
                iconColor: Color(0xFF9A6A00),
                backgroundColor: Color(0xFFF6E7C9),
              ),

              const SizedBox(height: 16),

              const AudienceCard(
                icon: Icons.support_agent_outlined,
                title: 'Mentors',
                description:
                    'Industry experts guiding founders.',
                iconColor: Color(0xFF8E4B3E),
                backgroundColor: Color(0xFFFBE4DD),
              ),

              const SizedBox(height: 40),

              // CTA
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(28),

                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(34),

                  gradient: const LinearGradient(
                    colors: [
                      Color(0xFF062B2B),
                      Color(0xFF111111),
                    ],
                  ),
                ),

                child: Column(
                  children: [

                    const Text(
                      'Ready to join the\necosystem?',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 34,
                        height: 1.1,
                        color: Colors.white,
                        fontWeight: FontWeight.w800,
                      ),
                    ),

                    const SizedBox(height: 24),

                    PrimaryButton(
                      label: 'Get Started',
                      onPressed: () {},
                    ),

                    const SizedBox(height: 14),

                    SecondaryButton(
                      label: 'Browse Startups ->',
                      onPressed: () {Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => const BrowseStartupsPage(),
                        ),
                      );},
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 42),

              // FOOTER
              Column(
                children: [

                  const Center(
                    child: Text(
                      'StartupConnect',
                      style: TextStyle(
                        fontSize: 26,
                        fontWeight: FontWeight.w700,
                        color: Color(0xFF8BB8B0),
                      ),
                    ),
                  ),

                  const SizedBox(height: 18),

                  Text(
                    '© 2024 StartupConnect Ethiopia. All rights reserved. Built for the next generation of Abyssinian founders.',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 13,
                      color: Colors.grey.shade600,
                      height: 1.6,
                    ),
                  ),

                  const SizedBox(height: 20),

                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [

                      GestureDetector(
                        onTap: () {},
                        child: const Text(
                          'PRIVACY',
                          style: TextStyle(
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),

                      const SizedBox(width: 30),

                      GestureDetector(
                        onTap: () {},
                        child: const Text(
                          'TERMS',
                          style: TextStyle(
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),

              const SizedBox(height: 40),
            ],
          ),
        ),
      ),
    );
  }
}
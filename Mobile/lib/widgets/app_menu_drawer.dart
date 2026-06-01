import 'package:flutter/material.dart';
import 'package:startup_connect/ui/about/about_page.dart';
import 'package:startup_connect/ui/browse/browse_startups_page.dart';
import 'package:startup_connect/ui/contact/contact_page.dart';
import 'package:startup_connect/ui/home_page.dart';
import 'package:startup_connect/ui/startup_dashboard_page.dart';
import 'package:startup_connect/ui/login_page.dart';

class AppMenuDrawer extends StatelessWidget {
  const AppMenuDrawer({super.key});

  @override
  Widget build(BuildContext context) {

    final screenWidth =
        MediaQuery.of(context).size.width;

    return Drawer(

      /// RESPONSIVE WIDTH
      width: screenWidth * 0.82,

      backgroundColor: Colors.transparent,
      elevation: 0,

      child: Container(

        margin: const EdgeInsets.only(
          top: 24,
          bottom: 24,
          left: 12,
        ),

        decoration: BoxDecoration(
          color: const Color(0xFFF8F8F8),

          /// RIGHT SIDE DRAWER ROUNDING
          borderRadius: const BorderRadius.only(
            topLeft: Radius.circular(42),
            bottomLeft: Radius.circular(42),
          ),

          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.15),
              blurRadius: 30,
              offset: const Offset(-8, 0),
            ),
          ],
        ),

        child: SafeArea(
          child: LayoutBuilder(
            builder: (context, constraints) {

              return SingleChildScrollView(

                child: ConstrainedBox(
                  constraints: BoxConstraints(
                    minHeight: constraints.maxHeight,
                  ),

                  child: IntrinsicHeight(

                    child: Column(
                      children: [

                        const SizedBox(height: 24),

                        /// LOGO SECTION
                        Padding(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 32,
                          ),

                          child: Row(
                            children: [

                              Container(
                                width: 70,
                                height: 70,

                                decoration: BoxDecoration(
                                  color: const Color(0xFFF1F5F4),
                                  borderRadius:
                                      BorderRadius.circular(24),
                                ),

                                child: const Icon(
                                  Icons.rocket_launch,
                                  color: Color(0xFF00695C),
                                  size: 38,
                                ),
                              ),

                              const SizedBox(width: 18),

                              const Expanded(
                                child: Text(
                                  'StartupConnect\nEthiopia',
                                  style: TextStyle(
                                    fontSize: 28,
                                    height: 1.15,
                                    fontWeight: FontWeight.w800,
                                    color: Color(0xFF00695C),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),

                        const SizedBox(height: 60),

                        /// MENU ITEMS
                        Padding(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 24,
                          ),

                          child: Column(
                            children: [

                              _MenuItem(
                                icon: Icons.home,
                                label: 'Home',
                                selected: true,

                                onTap: () {
                                  Navigator.pushReplacement(
                                    context,
                                    MaterialPageRoute(
                                      builder: (_) =>
                                          const HomePage(),
                                    ),
                                  );
                                },
                              ),

                              const SizedBox(height: 18),

                        _MenuItem(
                          icon: Icons.info_outline,
                          label: 'About Us',
                          onTap: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (_) =>
                                    const AboutPage(),
                              ),
                            );
                          },
                        ),

                        const SizedBox(height: 18),

                        _MenuItem(
                          icon: Icons.rocket_launch_outlined,
                          label: 'Startups',
                          onTap: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (_) =>
                                    const BrowseStartupsPage(),
                              ),
                            );
                          },
                        ),

                        const SizedBox(height: 18),

                        _MenuItem(
                          icon: Icons.mail_outline,
                          label: 'Contact',
                          onTap: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (_) =>
                                    const ContactPage(),
                              ),
                            );
                          },
                        ),

                        const SizedBox(height: 18),

                        _MenuItem(
                          icon: Icons.dashboard_outlined,
                          label: 'Dashboard',
                          onTap: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (_) =>
                                    const StartupDashboardPage(),
                              ),
                            );
                          },
                        ),
                            ],
                          ),
                        ),

                        /// REPLACED SPACER
                        const SizedBox(height: 40),

                        /// SCALE IDEA CARD
                        Container(
                          margin: const EdgeInsets.symmetric(
                            horizontal: 28,
                          ),

                          padding: const EdgeInsets.all(26),

                          decoration: BoxDecoration(
                            color: const Color(0xFFFFF7EE),

                            borderRadius:
                                BorderRadius.circular(28),

                            border: Border.all(
                              color: const Color(0xFFFFD9AE),
                            ),
                          ),

                          child: Column(
                            crossAxisAlignment:
                                CrossAxisAlignment.start,

                            children: [

                              const Text(
                                'SCALE YOUR IDEA',
                                style: TextStyle(
                                  fontSize: 15,
                                  letterSpacing: 1.2,
                                  fontWeight: FontWeight.w800,
                                  color: Color(0xFF7A4A00),
                                ),
                              ),

                              const SizedBox(height: 14),

                              const Text(
                                'Join 200+ founders raising capital this month.',
                                style: TextStyle(
                                  fontSize: 20,
                                  height: 1.4,
                                  color: Color(0xFF3A2A15),
                                ),
                              ),
                            ],
                          ),
                        ),

                        const SizedBox(height: 28),

                        /// LOGIN BUTTON
                        Padding(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 28,
                          ),

                          child: SizedBox(
                            width: double.infinity,
                            height: 74,

                            child:                             ElevatedButton(
                              onPressed: () {
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (_) =>
                                        const LoginPage(),
                                  ),
                                );
                              },

                              style: ElevatedButton.styleFrom(
                                backgroundColor:
                                    const Color(0xFF00695C),

                                elevation: 10,

                                shape: RoundedRectangleBorder(
                                  borderRadius:
                                      BorderRadius.circular(26),
                                ),
                              ),

                              child: const Row(
                                mainAxisAlignment:
                                    MainAxisAlignment.center,

                                children: [

                                  Text(
                                    'Login / Sign Up',
                                    style: TextStyle(
                                      fontSize: 22,
                                      fontWeight:
                                          FontWeight.w700,
                                      color: Colors.white,
                                    ),
                                  ),

                                  SizedBox(width: 12),

                                  Icon(
                                    Icons.arrow_forward,
                                    color: Colors.white,
                                    size: 28,
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),

                        const SizedBox(height: 40),

                        /// FOOTER
                        Column(
                          children: [

                            Row(
                              mainAxisAlignment:
                                  MainAxisAlignment.center,

                              children: [

                                _FooterTextButton(
                                  text: 'PRIVACY POLICY',
                                  onTap: () {},
                                ),

                                const SizedBox(width: 24),

                                _FooterTextButton(
                                  text: 'TERMS OF SERVICE',
                                  onTap: () {},
                                ),
                              ],
                            ),

                            const SizedBox(height: 18),

                            Text(
                              '© 2024 StartupConnect Ethiopia',
                              style: TextStyle(
                                color: Colors.grey.shade500,
                                fontSize: 14,
                              ),
                            ),
                          ],
                        ),

                        const SizedBox(height: 28),
                      ],
                    ),
                  ),
                ),
              );
            },
          ),
        ),
      ),
    );
  }
}

/// MENU ITEM
class _MenuItem extends StatelessWidget {

  final IconData icon;
  final String label;
  final bool selected;
  final VoidCallback onTap;

  const _MenuItem({
    required this.icon,
    required this.label,
    required this.onTap,
    this.selected = false,
  });

  @override
  Widget build(BuildContext context) {

    return GestureDetector(
      onTap: onTap,

      child: Container(
        width: double.infinity,

        padding: const EdgeInsets.symmetric(
          horizontal: 24,
          vertical: 24,
        ),

        decoration: BoxDecoration(
          color: selected
              ? const Color(0xFFF1F7F5)
              : Colors.transparent,

          borderRadius:
              BorderRadius.circular(26),
        ),

        child: Row(
          children: [

            Icon(
              icon,
              size: 38,

              color: selected
                  ? const Color(0xFF00695C)
                  : Colors.grey.shade700,
            ),

            const SizedBox(width: 22),

            Text(
              label,
              style: TextStyle(
                fontSize: 26,
                fontWeight: FontWeight.w500,

                color: selected
                    ? const Color(0xFF00695C)
                    : Colors.grey.shade700,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// FOOTER BUTTON
class _FooterTextButton extends StatelessWidget {

  final String text;
  final VoidCallback onTap;

  const _FooterTextButton({
    required this.text,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {

    return GestureDetector(
      onTap: onTap,

      child: Text(
        text,
        style: TextStyle(
          color: Colors.grey.shade600,
          fontSize: 14,
          letterSpacing: 1,
        ),
      ),
    );
  }
}
import 'package:flutter/material.dart';
import 'package:startup_connect/widgets/app_menu_drawer.dart';

import 'widgets/contact_bottom_banner.dart';
import 'widgets/contact_info_card.dart';
import 'widgets/faq_item.dart';

class ContactPage extends StatelessWidget {
  const ContactPage({super.key});

  @override
  Widget build(BuildContext context) {

    return Scaffold(
      endDrawer: const AppMenuDrawer(),
      backgroundColor: const Color(0xFFF5F5F5),

      body: SafeArea(
        child: SingleChildScrollView(

          padding: const EdgeInsets.all(24),

          child: Column(
            crossAxisAlignment:
                CrossAxisAlignment.start,

            children: [

              /// HEADER
              Row(
                mainAxisAlignment:
                    MainAxisAlignment.spaceBetween,

                children: [

                  const Text(
                    'Contact & Support',
                    style: TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.w700,
                      color: Color(0xFF00695C),
                    ),
                  ),

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

              const SizedBox(height: 40),

              /// TITLE
              const Text(
                "We're here to help",
                style: TextStyle(
                  fontSize: 42,
                  height: 1.2,
                  fontWeight: FontWeight.w800,
                ),
              ),

              const SizedBox(height: 18),

              Text(
                "Have questions? Send us a message and we'll respond as soon as possible.",
                style: TextStyle(
                  fontSize: 18,
                  height: 1.7,
                  color: Colors.grey.shade700,
                ),
              ),

              const SizedBox(height: 40),

              /// CONTACT FORM
              Container(
                padding: const EdgeInsets.all(28),

                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius:
                      BorderRadius.circular(32),
                ),

                child: Column(
                  crossAxisAlignment:
                      CrossAxisAlignment.start,

                  children: [

                    const Text(
                      'Contact Us',
                      style: TextStyle(
                        fontSize: 34,
                        fontWeight: FontWeight.w700,
                      ),
                    ),

                    const SizedBox(height: 32),

                    _buildLabel('FULL NAME'),
                    const SizedBox(height: 10),

                    _buildInput(
                      hint: 'Abebe Bikila',
                    ),

                    const SizedBox(height: 24),

                    _buildLabel('EMAIL ADDRESS'),
                    const SizedBox(height: 10),

                    _buildInput(
                      hint: 'abebe@example.et',
                    ),

                    const SizedBox(height: 24),

                    _buildLabel('SUBJECT'),
                    const SizedBox(height: 10),

                    _buildDropdown(),

                    const SizedBox(height: 24),

                    _buildLabel('MESSAGE'),
                    const SizedBox(height: 10),

                    _buildMessageInput(),

                    const SizedBox(height: 32),

                    SizedBox(
                      width: double.infinity,
                      height: 60,

                      child: ElevatedButton(
                        onPressed: () {},

                        style:
                            ElevatedButton.styleFrom(
                          backgroundColor:
                              const Color(
                                  0xFF00796B),

                          shape:
                              RoundedRectangleBorder(
                            borderRadius:
                                BorderRadius.circular(
                                    22),
                          ),
                        ),

                        child: const Text(
                          'Send Message',
                          style: TextStyle(
                            fontSize: 20,
                            fontWeight:
                                FontWeight.w700,
                            color: Colors.white,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 32),

              /// INFO CARD
              const ContactInfoCard(),

              const SizedBox(height: 44),

              /// FAQ TITLE
              const Text(
                'FAQs',
                style: TextStyle(
                  fontSize: 42,
                  fontWeight: FontWeight.w800,
                ),
              ),

              const SizedBox(height: 28),

              /// FAQ ITEMS
              const FaqItem(
                question:
                    'What is StartupConnect Ethiopia?',
                answer:
                    'StartupConnect Ethiopia is a platform connecting startups, investors, and mentors to foster innovation and growth.',
              ),

              const FaqItem(
                question: 'How do I sign up?',
                initiallyExpanded: true,
                answer:
                    'Registration is simple! Click the Start Journey button on the homepage, select your role as a Founder or Investor, and follow the identity verification steps.',
              ),

              const FaqItem(
                question:
                    'How does verification work?',
                answer:
                    'Our team reviews submitted profiles and verifies identity and startup information for trust and security.',
              ),

              const FaqItem(
                question:
                    'How do I contact startups?',
                answer:
                    'Once registered and approved, you can directly connect with startups through the platform.',
              ),

              const SizedBox(height: 40),

              /// IMAGE BANNER
              const ContactBottomBanner(),

              const SizedBox(height: 40),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildLabel(String text) {

    return Text(
      text,
      style: const TextStyle(
        fontWeight: FontWeight.w700,
        letterSpacing: 1,
        fontSize: 14,
      ),
    );
  }

  Widget _buildInput({
    required String hint,
  }) {

    return TextField(
      decoration: InputDecoration(
        hintText: hint,

        filled: true,
        fillColor: const Color(0xFFF3F4F6),

        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide.none,
        ),

        contentPadding:
            const EdgeInsets.symmetric(
          horizontal: 20,
          vertical: 18,
        ),
      ),
    );
  }

  Widget _buildDropdown() {

    return Container(
      padding:
          const EdgeInsets.symmetric(horizontal: 18),

      decoration: BoxDecoration(
        color: const Color(0xFFF3F4F6),
        borderRadius: BorderRadius.circular(16),
      ),

      child: DropdownButtonHideUnderline(
        child: DropdownButton<String>(
          value: 'General Inquiry',

          isExpanded: true,

          items: const [
            DropdownMenuItem(
              value: 'General Inquiry',
              child: Text('General Inquiry'),
            ),

            DropdownMenuItem(
              value: 'Technical Support',
              child: Text('Technical Support'),
            ),

            DropdownMenuItem(
              value: 'Partnership',
              child: Text('Partnership'),
            ),
          ],

          onChanged: (value) {},
        ),
      ),
    );
  }

  Widget _buildMessageInput() {

    return TextField(
      maxLines: 6,

      decoration: InputDecoration(
        hintText:
            'How can we assist you today?',

        filled: true,
        fillColor: const Color(0xFFF3F4F6),

        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide.none,
        ),

        contentPadding:
            const EdgeInsets.all(20),
      ),
    );
  }
}
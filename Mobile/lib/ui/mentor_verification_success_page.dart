import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';

import 'login_page.dart';
import 'mentor_registration_page.dart';

class MentorVerificationSuccessPage
    extends StatelessWidget {

  const MentorVerificationSuccessPage({
    super.key,
  });

  @override
  Widget build(BuildContext context) {

    return Scaffold(
      backgroundColor: const Color(0xffF5F7F9),

      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(
            horizontal: 20,
            vertical: 30,
          ),

          child: Center(
            child: ConstrainedBox(
              constraints:
                  const BoxConstraints(
                maxWidth: 900,
              ),

              child: Column(
                children: [

                  // =========================================
                  // MAIN CARD
                  // =========================================

                  Container(
                    width: double.infinity,
                    padding:
                        const EdgeInsets.symmetric(
                      horizontal: 24,
                      vertical: 50,
                    ),

                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius:
                          BorderRadius.circular(34),
                    ),

                    child: Column(
                      children: [

                        // =====================================
                        // SUCCESS ICON
                        // =====================================

                        Container(
                          width: 110,
                          height: 110,

                          decoration:
                              const BoxDecoration(
                            color:
                                Color(0xffB7EAC8),
                            shape: BoxShape.circle,
                          ),

                          child: Center(
                            child: Container(
                              width: 50,
                              height: 50,

                              decoration:
                                  const BoxDecoration(
                                color: Color(
                                    0xff063D33),
                                shape:
                                    BoxShape.circle,
                              ),

                              child: const Icon(
                                Icons.check,
                                color: Colors.white,
                                size: 28,
                              ),
                            ),
                          ),
                        ),

                        const SizedBox(height: 40),

                        // =====================================
                        // TITLE
                        // =====================================

                        const Text(
                          "Application Submitted Successfully",
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: 42,
                            fontWeight:
                                FontWeight.bold,
                            color:
                                Color(0xff101828),
                            height: 1.1,
                          ),
                        ),

                        const SizedBox(height: 20),

                        const Text(
                          "Your profile has been submitted and is currently under\nreview by our institutional team.",
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            color:
                                Color(0xff667085),
                            fontSize: 20,
                            height: 1.6,
                          ),
                        ),

                        const SizedBox(height: 50),

                        // =====================================
                        // STATUS STEPS
                        // =====================================

                        LayoutBuilder(
                          builder:
                              (context, constraints) {

                            bool mobile =
                                constraints.maxWidth <
                                    700;

                            if (mobile) {

                              return Column(
                                children: [

                                  statusItem(
                                    "Submitted",
                                    true,
                                    true,
                                  ),

                                  const SizedBox(
                                      height: 24),

                                  statusItem(
                                    "Under Review",
                                    true,
                                    false,
                                  ),

                                  const SizedBox(
                                      height: 24),

                                  statusItem(
                                    "Approved",
                                    false,
                                    false,
                                  ),
                                ],
                              );
                            }

                            return Row(
                              mainAxisAlignment:
                                  MainAxisAlignment
                                      .spaceEvenly,

                              children: [

                                statusItem(
                                  "Submitted",
                                  true,
                                  true,
                                ),

                                statusItem(
                                  "Under Review",
                                  true,
                                  false,
                                ),

                                statusItem(
                                  "Approved",
                                  false,
                                  false,
                                ),
                              ],
                            );
                          },
                        ),

                        const SizedBox(height: 50),

                        // =====================================
                        // INFO CARD
                        // =====================================

                        Container(
                          width: double.infinity,
                          padding:
                              const EdgeInsets.all(
                            30,
                          ),

                          decoration: BoxDecoration(
                            color: const Color(
                                0xffF9FAFB),

                            borderRadius:
                                BorderRadius
                                    .circular(24),
                          ),

                          child: LayoutBuilder(
                            builder:
                                (context,
                                    constraints) {

                              bool mobile =
                                  constraints
                                          .maxWidth <
                                      700;

                              return Wrap(
                                spacing: 40,
                                runSpacing: 30,
                                children: [

                                  infoItem(
                                    "NAME",
                                    "Dawit Mekonnen",
                                    mobile
                                        ? constraints
                                            .maxWidth
                                        : (constraints.maxWidth -
                                                40) /
                                            2,
                                  ),

                                  infoItem(
                                    "EMAIL",
                                    "dawit.m@startupconnect.et",
                                    mobile
                                        ? constraints
                                            .maxWidth
                                        : (constraints.maxWidth -
                                                40) /
                                            2,
                                  ),

                                  SizedBox(
                                    width: mobile
                                        ? constraints
                                            .maxWidth
                                        : (constraints.maxWidth -
                                                40) /
                                            2,

                                    child: Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment
                                              .start,

                                      children: [

                                        sectionTitle(
                                          "EXPERTISE",
                                        ),

                                        const SizedBox(
                                            height:
                                                14),

                                        Wrap(
                                          spacing:
                                              10,
                                          runSpacing:
                                              10,
                                          children: [

                                            expertiseChip(
                                                "Scaling Ops"),

                                            expertiseChip(
                                                "Venture Capital"),

                                            expertiseChip(
                                                "Fintech"),
                                          ],
                                        ),
                                      ],
                                    ),
                                  ),

                                  infoItem(
                                    "SUBMISSION DATE",
                                    "October 24, 2024",
                                    mobile
                                        ? constraints
                                            .maxWidth
                                        : (constraints.maxWidth -
                                                40) /
                                            2,
                                  ),
                                ],
                              );
                            },
                          ),
                        ),

                        const SizedBox(height: 34),

                        Divider(
                          color:
                              Colors.grey.shade300,
                        ),

                        const SizedBox(height: 30),

                        // =====================================
                        // NOTICE
                        // =====================================

                        Row(
                          crossAxisAlignment:
                              CrossAxisAlignment
                                  .start,

                          children: [

                            Container(
                              width: 32,
                              height: 32,

                              decoration:
                                  const BoxDecoration(
                                color: Color(
                                    0xff063D33),
                                shape:
                                    BoxShape.circle,
                              ),

                              child: const Icon(
                                Icons.info,
                                color: Colors.white,
                                size: 18,
                              ),
                            ),

                            const SizedBox(
                                width: 16),

                            const Expanded(
                              child: Text(
                                "Our team manually reviews every mentor profile to ensure the highest quality of mentorship. This process typically takes 48-72 hours.",
                                style: TextStyle(
                                  color: Color(
                                      0xff667085),
                                  fontSize: 17,
                                  height: 1.7,
                                ),
                              ),
                            ),
                          ],
                        ),

                        const SizedBox(height: 50),

                        // =====================================
                        // GO TO SIGN IN BUTTON
                        // =====================================

                        SizedBox(
                          width: double.infinity,

                          child: ElevatedButton(
                            onPressed: () {

                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder:
                                      (context) =>
                                          const LoginPage(),
                                ),
                              );
                            },

                            style:
                                ElevatedButton.styleFrom(
                              backgroundColor:
                                  const Color(
                                      0xff063D33),

                              padding:
                                  const EdgeInsets.symmetric(
                                vertical: 24,
                              ),

                              shape:
                                  RoundedRectangleBorder(
                                borderRadius:
                                    BorderRadius
                                        .circular(
                                            18),
                              ),
                            ),

                            child: const Text(
                              "Go to Sign In",
                              style: TextStyle(
                                color:
                                    Colors.white,
                                fontWeight:
                                    FontWeight.bold,
                                fontSize: 18,
                              ),
                            ),
                          ),
                        ),

                        const SizedBox(height: 18),

                        // =====================================
                        // VIEW SUBMISSION
                        // =====================================

                        GestureDetector(
                          onTap: () {},

                          child: Container(
                            width: double.infinity,
                            padding:
                                const EdgeInsets.symmetric(
                              vertical: 24,
                            ),

                            decoration: BoxDecoration(
                              borderRadius:
                                  BorderRadius
                                      .circular(
                                          18),

                              border: Border.all(
                                color:
                                    const Color(
                                        0xffD0D5DD),
                              ),
                            ),

                            child: const Center(
                              child: Text(
                                "View Submission",
                                style: TextStyle(
                                  fontWeight:
                                      FontWeight
                                          .bold,
                                  fontSize: 18,
                                  color: Color(
                                      0xff101828),
                                ),
                              ),
                            ),
                          ),
                        ),

                        const SizedBox(height: 30),

                        // =====================================
                        // EDIT SUBMISSION
                        // =====================================

                        GestureDetector(
                          onTap: () {

                            // Navigator.push(
                            //   context,
                            //   MaterialPageRoute(
                            //     builder:
                            //         (context) =>
                            //             const MentorRegistrationPage(),
                            //   ),
                            // );
                          },

                          child: const Text(
                            "Edit Submission",
                            style: TextStyle(
                              color:
                                  Color(0xff063D33),
                              fontWeight:
                                  FontWeight.bold,
                              fontSize: 18,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 40),

                  // =========================================
                  // FOOTER
                  // =========================================

                  LayoutBuilder(
                    builder:
                        (context, constraints) {

                      bool mobile =
                          constraints.maxWidth <
                              700;

                      return Wrap(
                        alignment:
                            WrapAlignment
                                .spaceBetween,

                        spacing: 20,
                        runSpacing: 20,

                        children: [

                          Wrap(
                            spacing: 20,
                            runSpacing: 14,

                            children: [

                              clickableFooter(
                                "MENTOR PORTAL",
                              ),

                              Text(
                                "© 2024 StartupConnect Ethiopia",
                                style: TextStyle(
                                  color: Colors
                                      .grey.shade500,
                                  fontSize: 15,
                                ),
                              ),
                            ],
                          ),

                          Wrap(
                            spacing: 24,
                            runSpacing: 14,

                            children: [

                              clickableFooter(
                                "Privacy Policy",
                              ),

                              clickableFooter(
                                "Terms of Service",
                              ),

                              clickableFooter(
                                "Support",
                              ),
                            ],
                          ),
                        ],
                      );
                    },
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  // =========================================
  // WIDGETS
  // =========================================

  Widget statusItem(
    String title,
    bool active,
    bool checked,
  ) {
    return Column(
      children: [

        Container(
          width: 52,
          height: 52,

          decoration: BoxDecoration(
            color: active
                ? const Color(0xff063D33)
                : Colors.grey.shade300,

            shape: BoxShape.circle,
          ),

          child: checked
              ? const Icon(
                  Icons.check,
                  color: Colors.white,
                )
              : active
                  ? Center(
                      child: Container(
                        width: 18,
                        height: 18,

                        decoration:
                            const BoxDecoration(
                          color: Colors.white,
                          shape:
                              BoxShape.circle,
                        ),
                      ),
                    )
                  : null,
        ),

        const SizedBox(height: 12),

        Text(
          title,
          style: TextStyle(
            color: active
                ? const Color(0xff101828)
                : Colors.grey.shade400,
            fontWeight: FontWeight.bold,
          ),
        ),
      ],
    );
  }

  Widget sectionTitle(String text) {
    return Text(
      text,
      style: const TextStyle(
        color: Color(0xff667085),
        fontWeight: FontWeight.bold,
        letterSpacing: 2,
        fontSize: 12,
      ),
    );
  }

  Widget infoItem(
    String title,
    String value,
    double width,
  ) {
    return SizedBox(
      width: width,

      child: Column(
        crossAxisAlignment:
            CrossAxisAlignment.start,

        children: [

          sectionTitle(title),

          const SizedBox(height: 10),

          Text(
            value,
            style: const TextStyle(
              fontWeight:
                  FontWeight.bold,
              fontSize: 22,
              color: Color(0xff101828),
            ),
          ),
        ],
      ),
    );
  }

  Widget expertiseChip(String text) {
    return Container(
      padding:
          const EdgeInsets.symmetric(
        horizontal: 16,
        vertical: 10,
      ),

      decoration: BoxDecoration(
        color: const Color(0xffDDF5E8),
        borderRadius:
            BorderRadius.circular(30),
      ),

      child: Text(
        text,
        style: const TextStyle(
          color: Color(0xff063D33),
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }

  Widget clickableFooter(String text) {
    return GestureDetector(
      onTap: () {},

      child: Text(
        text,
        style: const TextStyle(
          color: Color(0xff667085),
          fontSize: 15,
        ),
      ),
    );
  }
}
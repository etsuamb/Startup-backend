import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:startup_connect/ui/mentor_registration_page.dart';
import 'package:startup_connect/ui/mentor_review_page.dart';

class MentorProfessionalPage extends StatefulWidget {
  const MentorProfessionalPage({super.key});

  @override
  State<MentorProfessionalPage> createState() =>
      _MentorProfessionalPageState();
}

class _MentorProfessionalPageState
    extends State<MentorProfessionalPage> {

  String primaryIndustry = "Select Industry";
  String secondaryIndustry = "Select Industry";

  String cityLocation = "Addis Ababa";

  String sessionFrequency =
      "Biweekly (Recommended)";

  String mentorPlatform = "Remote";

  List<String> selectedDays = ["T", "T"];

  List<String> mentorshipCategories = [
    "Business Model",
    "Fundraising",
    "Operations",
  ];

  List<String> selectedStages = [
    "Idea",
    "MVP",
  ];

  PlatformFile? introVideo;

  final List<String> allCategories = [
    "Product Strategy",
    "Business Model",
    "Fundraising",
    "Market Entry",
    "Operations",
    "Leadership",
    "Technology",
    "Other",
  ];

  final List<String> allStages = [
    "Idea",
    "MVP",
    "Early Revenue",
    "Growth",
    "Scale Up",
  ];

  final List<String> weekDays = [
    "M",
    "T",
    "W",
    "T",
    "F",
    "S",
    "S",
  ];

  Future<void> pickVideo() async {

    FilePickerResult? result =
        await FilePicker.pickFiles(
      type: FileType.video,
    );

    if (result != null) {

      setState(() {
        introVideo = result.files.first;
      });
    }
  }

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
                  const BoxConstraints(maxWidth: 1100),

              child: Column(
                crossAxisAlignment:
                    CrossAxisAlignment.start,

                children: [
                  // ======================================================
                  // TOP PROGRESS BAR (RESPONSIVE)
                  // ======================================================

                  SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: ConstrainedBox(
                      constraints: BoxConstraints(
                        minWidth: MediaQuery.of(context).size.width - 40,
                      ),
                      child: Row(
                        children: [

                          // STEP 1
                          stepCircle("✓", true),

                          const SizedBox(width: 10),

                          const Text(
                            "ACCOUNT INFO",
                            style: TextStyle(
                              color: Color(0xff063D33),
                              fontWeight: FontWeight.bold,
                              letterSpacing: 1.5,
                              fontSize: 12,
                            ),
                          ),

                          Container(
                            margin: const EdgeInsets.symmetric(
                              horizontal: 16,
                            ),
                            width: 60,
                            height: 1,
                            color: Colors.grey.shade300,
                          ),

                          // STEP 2
                          stepCircle("2", true),

                          const SizedBox(width: 10),

                          const Text(
                            "PROFESSIONAL",
                            style: TextStyle(
                              color: Color(0xff063D33),
                              fontWeight: FontWeight.bold,
                              letterSpacing: 1.5,
                              fontSize: 12,
                            ),
                          ),

                          Container(
                            margin: const EdgeInsets.symmetric(
                              horizontal: 16,
                            ),
                            width: 60,
                            height: 1,
                            color: Colors.grey.shade300,
                          ),

                          // STEP 3
                          stepCircle("3", false),

                          const SizedBox(width: 10),

                          Text(
                            "REVIEW",
                            style: TextStyle(
                              color: Colors.grey.shade400,
                              fontWeight: FontWeight.bold,
                              letterSpacing: 1.5,
                              fontSize: 12,
                            ),
                          ),

                          Container(
                            margin: const EdgeInsets.symmetric(
                              horizontal: 16,
                            ),
                            width: 60,
                            height: 1,
                            color: Colors.grey.shade300,
                          ),

                          // STEP 4
                          stepCircle("4", false),

                          const SizedBox(width: 10),

                          Text(
                            "VERIFICATION",
                            style: TextStyle(
                              color: Colors.grey.shade400,
                              fontWeight: FontWeight.bold,
                              letterSpacing: 1.5,
                              fontSize: 12,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),                    

                  const SizedBox(height: 30),

                  // =========================================
                  // MAIN CARD
                  // =========================================

                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(40),

                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius:
                          BorderRadius.circular(30),
                    ),

                    child: Column(
                      crossAxisAlignment:
                          CrossAxisAlignment.start,

                      children: [

                        const Text(
                          "Professional Mentor Details",
                          style: TextStyle(
                            fontSize: 48,
                            fontWeight: FontWeight.bold,
                            color: Color(0xff063D33),
                            height: 1,
                          ),
                        ),

                        const SizedBox(height: 16),

                        const Text(
                          "Help startups understand your expertise, mentoring style, and the value you bring to the table.",
                          style: TextStyle(
                            color: Color(0xff667085),
                            fontSize: 20,
                          ),
                        ),

                        const SizedBox(height: 40),

                        // ===================================
                        // ORGANIZATION + TITLE
                        // ===================================

                        LayoutBuilder(
                          builder:
                              (context, constraints) {

                            bool mobile =
                                constraints.maxWidth <
                                    700;

                            return Wrap(
                              spacing: 20,
                              runSpacing: 20,
                              children: [

                                SizedBox(
                                  width: mobile
                                      ? double.infinity
                                      : (constraints.maxWidth -
                                              20) /
                                          2,

                                  child: customField(
                                    "CURRENT ORGANIZATION",
                                    "e.g. Safaricom Inc",
                                  ),
                                ),

                                SizedBox(
                                  width: mobile
                                      ? double.infinity
                                      : (constraints.maxWidth -
                                              20) /
                                          2,

                                  child: customField(
                                    "CURRENT TITLE",
                                    "e.g. Chief Product Officer",
                                  ),
                                ),
                              ],
                            );
                          },
                        ),

                        const SizedBox(height: 30),

                        // ===================================
                        // INDUSTRIES
                        // ===================================

                        LayoutBuilder(
                          builder:
                              (context, constraints) {

                            bool mobile =
                                constraints.maxWidth <
                                    700;

                            return Wrap(
                              spacing: 20,
                              runSpacing: 20,
                              children: [

                                SizedBox(
                                  width: mobile
                                      ? double.infinity
                                      : (constraints.maxWidth -
                                              20) /
                                          2,

                                  child: dropdownField(
                                    title:
                                        "PRIMARY INDUSTRY",
                                    value:
                                        primaryIndustry,
                                    items: const [
                                      "Select Industry",
                                      "Fintech",
                                      "Telecommunications",
                                    ],
                                    onChanged: (value) {
                                      setState(() {
                                        primaryIndustry =
                                            value!;
                                      });
                                    },
                                  ),
                                ),

                                SizedBox(
                                  width: mobile
                                      ? double.infinity
                                      : (constraints.maxWidth -
                                              20) /
                                          2,

                                  child: dropdownField(
                                    title:
                                        "SECONDARY INDUSTRY",
                                    value:
                                        secondaryIndustry,
                                    items: const [
                                      "Select Industry",
                                      "E-commerce",
                                      "Agritech",
                                    ],
                                    onChanged: (value) {
                                      setState(() {
                                        secondaryIndustry =
                                            value!;
                                      });
                                    },
                                  ),
                                ),
                              ],
                            );
                          },
                        ),

                        const SizedBox(height: 40),

                        // ===================================
                        // MENTORSHIP CATEGORIES
                        // ===================================

                        sectionTitle(
                          "MENTORSHIP CATEGORIES",
                        ),

                        const SizedBox(height: 16),

                        Wrap(
                          spacing: 12,
                          runSpacing: 12,

                          children:
                              allCategories.map((category) {

                            bool selected =
                                mentorshipCategories
                                    .contains(category);

                            return GestureDetector(
                              onTap: () {

                                setState(() {

                                  if (selected) {
                                    mentorshipCategories
                                        .remove(category);
                                  } else {
                                    mentorshipCategories
                                        .add(category);
                                  }
                                });
                              },

                              child: Container(
                                padding:
                                    const EdgeInsets.symmetric(
                                  horizontal: 22,
                                  vertical: 14,
                                ),

                                decoration: BoxDecoration(
                                  color: selected
                                      ? const Color(
                                          0xffDDF5E8)
                                      : Colors.white,

                                  borderRadius:
                                      BorderRadius.circular(
                                          30),

                                  border: Border.all(
                                    color: selected
                                        ? const Color(
                                            0xff72C48F)
                                        : const Color(
                                            0xffD0D5DD),
                                  ),
                                ),

                                child: Text(
                                  category,
                                  style: TextStyle(
                                    color: selected
                                        ? const Color(
                                            0xff063D33)
                                        : const Color(
                                            0xff475467),
                                    fontWeight:
                                        FontWeight.w600,
                                  ),
                                ),
                              ),
                            );
                          }).toList(),
                        ),

                        const SizedBox(height: 40),

                        // ===================================
                        // STARTUP STAGES
                        // ===================================

                        sectionTitle(
                          "PREFERRED STARTUP STAGE",
                        ),

                        const SizedBox(height: 16),

                        Wrap(
                          spacing: 20,
                          runSpacing: 20,

                          children:
                              allStages.map((stage) {

                            bool selected =
                                selectedStages
                                    .contains(stage);

                            return GestureDetector(
                              onTap: () {

                                setState(() {

                                  if (selected) {
                                    selectedStages
                                        .remove(stage);
                                  } else {
                                    selectedStages
                                        .add(stage);
                                  }
                                });
                              },

                              child: Container(
                                width: 240,
                                padding:
                                    const EdgeInsets.symmetric(
                                  horizontal: 18,
                                  vertical: 18,
                                ),

                                decoration: BoxDecoration(
                                  color: selected
                                      ? const Color(
                                          0xffECFDF3)
                                      : Colors.white,

                                  borderRadius:
                                      BorderRadius.circular(
                                          12),

                                  border: Border.all(
                                    color: selected
                                        ? const Color(
                                            0xff98D4AA)
                                        : const Color(
                                            0xffD0D5DD),
                                  ),
                                ),

                                child: Row(
                                  children: [

                                    Checkbox(
                                      value: selected,
                                      onChanged: (value) {

                                        setState(() {

                                          if (selected) {
                                            selectedStages
                                                .remove(
                                                    stage);
                                          } else {
                                            selectedStages
                                                .add(stage);
                                          }
                                        });
                                      },
                                    ),

                                    Text(
                                      stage,
                                      style:
                                          const TextStyle(
                                        fontWeight:
                                            FontWeight.w600,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            );
                          }).toList(),
                        ),

                        const SizedBox(height: 40),

                        // ===================================
                        // CITY + PLATFORM
                        // ===================================

                        LayoutBuilder(
                          builder:
                              (context, constraints) {

                            bool mobile =
                                constraints.maxWidth <
                                    700;

                            return Wrap(
                              spacing: 20,
                              runSpacing: 20,
                              children: [

                                SizedBox(
                                  width: mobile
                                      ? double.infinity
                                      : (constraints.maxWidth -
                                              20) /
                                          2,

                                  child: dropdownField(
                                    title:
                                        "CITY / LOCATION",
                                    value:
                                        cityLocation,
                                    items: const [
                                      "Addis Ababa",
                                      "Remote(Global)",
                                    ],
                                    onChanged: (value) {
                                      setState(() {
                                        cityLocation =
                                            value!;
                                      });
                                    },
                                  ),
                                ),

                                SizedBox(
                                  width: mobile
                                      ? double.infinity
                                      : (constraints.maxWidth -
                                              20) /
                                          2,

                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment
                                            .start,

                                    children: [

                                      sectionTitle(
                                        "MENTOR PLATFORM",
                                      ),

                                      const SizedBox(
                                          height: 16),

                                      Wrap(
                                        spacing: 30,
                                        runSpacing: 10,
                                        children: [

                                          radioOption(
                                            "Remote",
                                          ),

                                          radioOption(
                                            "In-person",
                                          ),
                                        ],
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            );
                          },
                        ),

                        const SizedBox(height: 40),

                        // ===================================
                        // AVAILABILITY DAYS
                        // ===================================

                        sectionTitle(
                          "AVAILABILITY DAYS",
                        ),

                        const SizedBox(height: 16),

                        Wrap(
                          spacing: 10,
                          runSpacing: 10,

                          children:
                              weekDays.map((day) {

                            bool selected =
                                selectedDays
                                    .contains(day);

                            return GestureDetector(
                              onTap: () {

                                setState(() {

                                  if (selected) {
                                    selectedDays
                                        .remove(day);
                                  } else {
                                    selectedDays
                                        .add(day);
                                  }
                                });
                              },

                              child: Container(
                                width: 48,
                                height: 48,

                                decoration: BoxDecoration(
                                  color: selected
                                      ? const Color(
                                          0xff063D33)
                                      : Colors.white,

                                  borderRadius:
                                      BorderRadius.circular(
                                          14),

                                  border: Border.all(
                                    color: const Color(
                                        0xffD0D5DD),
                                  ),
                                ),

                                child: Center(
                                  child: Text(
                                    day,
                                    style: TextStyle(
                                      color: selected
                                          ? Colors.white
                                          : const Color(
                                              0xff667085),

                                      fontWeight:
                                          FontWeight.w600,
                                    ),
                                  ),
                                ),
                              ),
                            );
                          }).toList(),
                        ),

                        const SizedBox(height: 40),

                        // ===================================
                        // SESSION + TIME
                        // ===================================

                        LayoutBuilder(
                          builder:
                              (context, constraints) {

                            bool mobile =
                                constraints.maxWidth <
                                    700;

                            return Wrap(
                              spacing: 20,
                              runSpacing: 20,
                              children: [

                                SizedBox(
                                  width: mobile
                                      ? double.infinity
                                      : (constraints.maxWidth -
                                              20) /
                                          2,

                                  child: dropdownField(
                                    title:
                                        "SESSION FREQUENCY",
                                    value:
                                        sessionFrequency,
                                    items: const [
                                      "Biweekly (Recommended)",
                                      "Weekly",
                                      "Monthly",
                                    ],
                                    onChanged: (value) {
                                      setState(() {
                                        sessionFrequency =
                                            value!;
                                      });
                                    },
                                  ),
                                ),

                                SizedBox(
                                  width: mobile
                                      ? double.infinity
                                      : (constraints.maxWidth -
                                              20) /
                                          2,

                                  child: customField(
                                    "PREFERRED TIME SLOTS",
                                    "e.g. 5:00 PM - 7:00 PM EAT",
                                  ),
                                ),
                              ],
                            );
                          },
                        ),

                        const SizedBox(height: 40),

                        largeField(
                          "MENTORING STYLE / APPROACH",
                          "Briefly describe your history with mentoring individuals or teams...",
                        ),

                        const SizedBox(height: 30),

                        largeField(
                          "NOTABLE STARTUPS / PROJECTS MENTORED",
                          "List companies or major projects you have advised...",
                        ),

                        const SizedBox(height: 30),

                        largeField(
                          "KEY ACHIEVEMENTS",
                          "What are the key achievements in your professional career?",
                        ),

                        const SizedBox(height: 30),

                        largeField(
                          "MEDIA / PRESS LINKS (OPTIONAL)",
                          "Blogs, published articles (e.g. Tech Crunch link with major exclusive launch)",
                        ),

                        const SizedBox(height: 30),

                        // ===================================
                        // VIDEO UPLOAD
                        // ===================================

                        sectionTitle(
                          "INTRODUCTION VIDEO (OPTIONAL)",
                        ),

                        const SizedBox(height: 16),

                        GestureDetector(
                          onTap: pickVideo,

                          child: Container(
                            width: double.infinity,
                            padding:
                                const EdgeInsets.symmetric(
                              vertical: 60,
                            ),

                            decoration: BoxDecoration(
                              color: const Color(
                                  0xffF1FBF5),

                              borderRadius:
                                  BorderRadius.circular(
                                      20),

                              border: Border.all(
                                color: const Color(
                                    0xff98D4AA),
                                style:
                                    BorderStyle.solid,
                              ),
                            ),

                            child: Column(
                              children: [

                                Container(
                                  width: 50,
                                  height: 50,

                                  decoration:
                                      const BoxDecoration(
                                    color: Color(
                                        0xffDDF5E8),
                                    shape:
                                        BoxShape.circle,
                                  ),

                                  child: const Icon(
                                    Icons.videocam,
                                    color: Color(
                                        0xff22C55E),
                                  ),
                                ),

                                const SizedBox(
                                    height: 20),

                                Text(
                                  introVideo == null
                                      ? "Upload a short video"
                                      : introVideo!
                                          .name,

                                  style:
                                      const TextStyle(
                                    fontWeight:
                                        FontWeight.bold,
                                  ),
                                ),

                                const SizedBox(
                                    height: 8),

                                const Text(
                                  "Let the founders know your mentoring philosophy and what you look...",
                                  style: TextStyle(
                                    color:
                                        Color(0xff667085),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),

                        const SizedBox(height: 40),

                        Divider(
                          color: Colors.grey.shade300,
                        ),

                        const SizedBox(height: 30),

                        // ===================================
                        // BUTTONS
                        // ===================================

                        Row(
                          mainAxisAlignment:
                              MainAxisAlignment
                                  .spaceBetween,

                          children: [

                            TextButton.icon(
                              onPressed: () {
                                Navigator.pop(
                                    context);
                              },

                              icon: const Icon(
                                Icons.arrow_back,
                              ),

                              label: const Text(
                                "Back",
                              ),
                            ),

                            ElevatedButton(
                              onPressed: () {
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (context) =>
                                        const MentorReviewPage(),
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
                                  horizontal: 32,
                                  vertical: 20,
                                ),

                                shape:
                                    RoundedRectangleBorder(
                                  borderRadius:
                                      BorderRadius
                                          .circular(
                                              14),
                                ),
                              ),

                              child: const Row(
                                mainAxisSize:
                                    MainAxisSize.min,
                                children: [

                                  Text(
                                    "Continue to Review",
                                    style: TextStyle(
                                      color:
                                          Colors.white,
                                      fontWeight:
                                          FontWeight
                                              .bold,
                                    ),
                                  ),

                                  SizedBox(width: 10),

                                  Icon(
                                    Icons.arrow_forward,
                                    color:
                                        Colors.white,
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
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

  Widget stepCircle(
    String text,
    bool active,
  ) {
    return Container(
      width: 42,
      height: 42,

      decoration: BoxDecoration(
        color: active
            ? const Color(0xff063D33)
            : Colors.grey.shade200,

        shape: BoxShape.circle,
      ),

      child: Center(
        child: Text(
          text,
          style: TextStyle(
            color:
                active ? Colors.white : Colors.grey,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
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

  Widget customField(
    String title,
    String hint,
  ) {
    return Column(
      crossAxisAlignment:
          CrossAxisAlignment.start,

      children: [

        sectionTitle(title),

        const SizedBox(height: 12),

        TextField(
          decoration: InputDecoration(
            hintText: hint,
            filled: true,
            fillColor: const Color(0xffF5F7F9),

            border: OutlineInputBorder(
              borderRadius:
                  BorderRadius.circular(14),
              borderSide: BorderSide.none,
            ),

            contentPadding:
                const EdgeInsets.symmetric(
              horizontal: 18,
              vertical: 20,
            ),
          ),
        ),
      ],
    );
  }

  Widget largeField(
    String title,
    String hint,
  ) {
    return Column(
      crossAxisAlignment:
          CrossAxisAlignment.start,

      children: [

        sectionTitle(title),

        const SizedBox(height: 12),

        TextField(
          maxLines: 4,

          decoration: InputDecoration(
            hintText: hint,
            filled: true,
            fillColor: const Color(0xffF5F7F9),

            border: OutlineInputBorder(
              borderRadius:
                  BorderRadius.circular(14),
              borderSide: BorderSide.none,
            ),

            contentPadding:
                const EdgeInsets.all(18),
          ),
        ),
      ],
    );
  }

  Widget dropdownField({
    required String title,
    required String value,
    required List<String> items,
    required Function(String?) onChanged,
  }) {
    return Column(
      crossAxisAlignment:
          CrossAxisAlignment.start,

      children: [

        sectionTitle(title),

        const SizedBox(height: 12),

        Container(
          padding:
              const EdgeInsets.symmetric(
            horizontal: 16,
          ),

          decoration: BoxDecoration(
            color: const Color(0xffF5F7F9),
            borderRadius:
                BorderRadius.circular(14),
          ),

          child: DropdownButtonHideUnderline(
            child: DropdownButton<String>(
              value: value,
              isExpanded: true,

              items: items.map((item) {

                return DropdownMenuItem(
                  value: item,
                  child: Text(item),
                );
              }).toList(),

              onChanged: onChanged,
            ),
          ),
        ),
      ],
    );
  }

  Widget radioOption(String value) {

    bool selected = mentorPlatform == value;

    return GestureDetector(
      onTap: () {

        setState(() {
          mentorPlatform = value;
        });
      },

      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [

          Container(
            width: 22,
            height: 22,

            decoration: BoxDecoration(
              shape: BoxShape.circle,

              border: Border.all(
                color: selected
                    ? const Color(0xff063D33)
                    : Colors.grey,
                width: 2,
              ),
            ),

            child: selected
                ? Center(
                    child: Container(
                      width: 10,
                      height: 10,

                      decoration:
                          const BoxDecoration(
                        color:
                            Color(0xff063D33),
                        shape: BoxShape.circle,
                      ),
                    ),
                  )
                : null,
          ),

          const SizedBox(width: 10),

          Text(
            value,
            style: const TextStyle(
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}
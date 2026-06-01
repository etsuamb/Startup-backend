import 'package:flutter/material.dart';
import 'investor_verification_submitted_page.dart';

// 👉 IMPORT YOUR PAGES
import 'investor_registration_page.dart';
import 'investor_profile_page.dart';
import 'investor_verification_page.dart';

class InvestorReviewPage extends StatelessWidget {
  const InvestorReviewPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF6F7F9),

      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.black),
          onPressed: () => Navigator.pop(context), // ✅ BACK
        ),
        title: const Text(
          "Review & Submit",
          style: TextStyle(color: Color(0xff0D3B36)),
        ),
      ),

      bottomNavigationBar: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [

            // BACK BUTTON
            Expanded(
              child: OutlinedButton(
                onPressed: () => Navigator.pop(context),
                child: const Text("Back"),
              ),
            ),

            const SizedBox(width: 12),

            // SUBMIT BUTTON
            Expanded(
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF0F5D4E),
                ),
                onPressed: () {
                  Navigator.pushReplacement(
                    context,
                    MaterialPageRoute(
                      builder: (_) => const InvestorVerificationSubmittedPage(),
                    ),
                  );
                },
                child: const Text("Submit for Verification →"),
              ),
            ),
          ],
        ),
      ),

      body: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 90),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [

            const Text(
              "Review and Submit",
              style: TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.bold,
                color: Color(0xff0D3B36),
              ),
            ),

            const SizedBox(height: 6),

            const Text(
              "Review your information before submitting your investor account for verification.",
              style: TextStyle(color: Colors.grey),
            ),

            const SizedBox(height: 20),

            // ================= STEP INDICATOR =================
            Row(
              children: [
                const Text(
                  "STEP 4 OF 5",
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    color: Color(0xff98A2B3),
                  ),
                ),
                const Spacer(),
                buildProgress(true),
                buildProgress(true),
                buildProgress(true),
                buildProgress(true),
                buildProgress(false),
              ],
            ),

            const SizedBox(height: 30),

            // ================= ACCOUNT INFO =================
            sectionHeader(
              title: "Account Information",
              onEdit: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (_) => const InvestorRegistrationPage(),
                  ),
                );
              },
            ),

            infoRow("Full Legal Name", "Abebe Bekele"),
            infoRow("Work Email", "abebe@invest.com"),
            infoRow("Phone Number", "+251 911 123 4567"),

            const SizedBox(height: 25),

            // ================= INVESTOR PROFILE =================
            sectionHeader(
              title: "Investor Type and Profile",
              onEdit: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (_) => const InvestorProfilePage(),
                  ),
                );
              },
            ),

            infoRow("Investor Type", "Angel Investor"),
            infoRow("Location Preference", "Addis Ababa, Ethiopia"),

            const SizedBox(height: 10),

            Wrap(
              spacing: 8,
              children: [
                chip("Fintech"),
                chip("AgriTech"),
                chip("HealthTech"),
              ],
            ),

            const SizedBox(height: 10),

            infoRow("Startup Stage", "Series A"),
            infoRow("Investment Range", "\$250k - \$1M"),

            const SizedBox(height: 25),

            // ================= VERIFICATION =================
            sectionHeader(
              title: "Verification Summary",
              onEdit: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (_) => const InvestorVerificationPage(),
                  ),
                );
              },
            ),

            fileRow("ID_Card_Scan.pdf"),
            fileRow("profile_photo_hq.jpg"),

            const SizedBox(height: 10),

            const Row(
              children: [
                Icon(Icons.check_circle, color: Color(0xff0B7A5B)),
                SizedBox(width: 6),
                Text(
                  "TERMS & CONDITIONS ACCEPTED. IDENTITY VERIFIED.",
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    color: Color(0xff0D3B36),
                  ),
                ),
              ],
            ),

            const SizedBox(height: 20),

            // ================= INFO BOX =================
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFE6F4EF),
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Row(
                children: [
                  Icon(Icons.shield, color: Color(0xff0B7A5B)),
                  SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      "By clicking submit, your investor profile will enter a verification review. You will receive an email update within 48 hours.",
                      style: TextStyle(fontSize: 13),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ================= COMPONENTS =================

  static Widget sectionHeader({
    required String title,
    required VoidCallback onEdit,
  }) {
    return Row(
      children: [
        Expanded(
          child: Text(
            title.toUpperCase(),
            style: const TextStyle(
              fontWeight: FontWeight.bold,
              color: Color(0xff0D3B36),
            ),
          ),
        ),
        TextButton.icon(
          onPressed: onEdit,
          icon: const Icon(Icons.edit, size: 16),
          label: const Text("Edit"),
        ),
      ],
    );
  }

  static Widget infoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(top: 10),
      child: Row(
        children: [
          Expanded(
            child: Text(
              label.toUpperCase(),
              style: const TextStyle(fontSize: 11, color: Colors.grey),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
          ),
        ],
      ),
    );
  }

  static Widget fileRow(String fileName) {
    return Container(
      margin: const EdgeInsets.only(top: 10),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFFF2F4F7),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        children: [
          const Icon(Icons.insert_drive_file),
          const SizedBox(width: 10),
          Expanded(child: Text(fileName)),
          const Icon(Icons.check_circle, color: Colors.green),
        ],
      ),
    );
  }

  static Widget chip(String text) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: const Color(0xff0D3B36),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        text,
        style: const TextStyle(color: Colors.white, fontSize: 12),
      ),
    );
  }

  static Widget buildProgress(bool active) {
    return Container(
      margin: const EdgeInsets.only(left: 6),
      width: 28,
      height: 6,
      decoration: BoxDecoration(
        color:
            active ? const Color(0xff0B7A5B) : const Color(0xffD9DDE3),
        borderRadius: BorderRadius.circular(100),
      ),
    );
  }
}
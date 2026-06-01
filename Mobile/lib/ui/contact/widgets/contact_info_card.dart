import 'package:flutter/material.dart';

class ContactInfoCard extends StatelessWidget {
  const ContactInfoCard({super.key});

  @override
  Widget build(BuildContext context) {

    return Container(
      padding: const EdgeInsets.all(22),

      decoration: BoxDecoration(
        color: const Color(0xFFDDF4EF),
        borderRadius: BorderRadius.circular(24),
      ),

      child: Row(
        children: [

          Container(
            width: 52,
            height: 52,

            decoration: const BoxDecoration(
              color: Color(0xFF00796B),
              shape: BoxShape.circle,
            ),

            child: const Icon(
              Icons.email_outlined,
              color: Colors.white,
            ),
          ),

          const SizedBox(width: 16),

          Expanded(
            child: Column(
              crossAxisAlignment:
                  CrossAxisAlignment.start,

              children: [

                const Text(
                  'Direct Email',
                  style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF00695C),
                  ),
                ),

                const SizedBox(height: 4),

                const Text(
                  'support@startupconnect.et',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                  ),
                ),

                const SizedBox(height: 4),

                Text(
                  'Response time: 24–48 hours',
                  style: TextStyle(
                    color: Colors.grey.shade700,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
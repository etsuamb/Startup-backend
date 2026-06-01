import 'package:flutter/material.dart';

class LockedStartupsBanner extends StatelessWidget {
  const LockedStartupsBanner({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(28),
      decoration: BoxDecoration(
        border: Border.all(
          color: Colors.grey.shade300,
          style: BorderStyle.solid,
        ),
        borderRadius: BorderRadius.circular(28),
      ),
      child: Column(
        children: [

          CircleAvatar(
            radius: 32,
            backgroundColor: const Color(0xFFB2F5EA),
            child: Icon(
              Icons.visibility_off_outlined,
              color: Colors.black87,
              size: 32,
            ),
          ),

          const SizedBox(height: 20),

          const Text(
            '50+ More Startups',
            style: TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.w700,
            ),
          ),

          const SizedBox(height: 12),

          Text(
            'Discover high-potential Ethiopian ventures in Growth and Idea stages.',
            textAlign: TextAlign.center,
            style: TextStyle(
              height: 1.6,
              color: Colors.grey.shade700,
            ),
          ),

          const SizedBox(height: 20),

          const Text(
            'Sign Up to Unlock',
            style: TextStyle(
              color: Color(0xFF00695C),
              fontWeight: FontWeight.w700,
              fontSize: 18,
            ),
          ),
        ],
      ),
    );
  }
}
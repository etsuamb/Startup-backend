import 'package:flutter/material.dart';

class ConnectCtaCard extends StatelessWidget {
  const ConnectCtaCard({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(28),
      decoration: BoxDecoration(
        color: const Color(0xFF003D36),
        borderRadius: BorderRadius.circular(36),
      ),

      child: Column(
        children: [

          /// TITLE
          const Text(
            'Want to connect with startups?',
            textAlign: TextAlign.center,
            style: TextStyle(
              color: Colors.white,
              fontSize: 30,
              fontWeight: FontWeight.w700,
            ),
          ),

          const SizedBox(height: 14),

          /// SUBTITLE
          Text(
            'Join Ethiopia\'s most exclusive founder network today and discover the next big thing.',
            textAlign: TextAlign.center,
            style: TextStyle(
              height: 1.6,
              color: Colors.teal.shade100,
              fontSize: 14,
            ),
          ),

          const SizedBox(height: 28),

          /// CREATE ACCOUNT BUTTON
          SizedBox(
            width: double.infinity,
            height: 60,

            child: ElevatedButton(
              onPressed: () {},

              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFFFB11A),
                foregroundColor: Colors.black,

                elevation: 0,

                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(24),
                ),
              ),

              child: const Text(
                'Create Account',
                style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ),

          const SizedBox(height: 36),


          const SizedBox(height: 24),

          /// ICON ROW
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [

              _FooterIcon(
                icon: Icons.language,
                onTap: () {},
              ),

              const SizedBox(width: 24),

              _FooterIcon(
                icon: Icons.share_outlined,
                onTap: () {},
              ),

              const SizedBox(width: 24),

              _FooterIcon(
                icon: Icons.info_outline,
                onTap: () {},
              ),
            ],
          ),

          const SizedBox(height: 24),

          /// COPYRIGHT
          Text(
            '© 2024 StartupConnect Ethiopia.',
            textAlign: TextAlign.center,
            style: TextStyle(
              color: Colors.teal.shade700,
              fontSize: 12,
            ),
          ),

          const SizedBox(height: 4),

          Text(
            'Empowering the Visionary Ledger.',
            textAlign: TextAlign.center,
            style: TextStyle(
              color: Colors.teal.shade700,
              fontSize: 12,
            ),
          ),
        ],
      ),
    );
  }
}

/// FOOTER ICON
class _FooterIcon extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;

  const _FooterIcon({
    required this.icon,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,

      child: Container(
        width: 36,
        height: 36,

        decoration: BoxDecoration(
          color: Colors.transparent,
          borderRadius: BorderRadius.circular(18),
        ),

        child: Icon(
          icon,
          color: Colors.teal.shade400,
          size: 20,
        ),
      ),
    );
  }
}
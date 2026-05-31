import 'package:flutter/material.dart';
import 'package:startup_connect/widgets/app_menu_drawer.dart';

import '../data/mock_startups.dart';

import 'widgets/category_chip.dart';
import 'widgets/connect_cta_card.dart';
import 'widgets/locked_startups_banner.dart';
import 'widgets/startup_card.dart';

class BrowseStartupsPage extends StatefulWidget {
  const BrowseStartupsPage({super.key});

  @override
  State<BrowseStartupsPage> createState() =>
      _BrowseStartupsPageState();
}

class _BrowseStartupsPageState
    extends State<BrowseStartupsPage> {

  String selectedCategory = 'Tech';

  final categories = [
    'Tech',
    'Fintech',
    'Health',
    'Agriculture',
    'Idea',
    'Prototype',
    'Growth',
  ];

  @override
  Widget build(BuildContext context) {

    return Scaffold(
      endDrawer: const AppMenuDrawer(),
      backgroundColor: const Color(0xFFF5F5F5),

      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),

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
                    'Browse Startups',
                    style: TextStyle(
                      fontSize: 34,
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

              const SizedBox(height: 24),

              /// SEARCH
              TextField(
                decoration: InputDecoration(
                  hintText:
                      'Search startups by name or industry...',
                  prefixIcon:
                      const Icon(Icons.search),
                  filled: true,
                  fillColor: Colors.white,

                  border: OutlineInputBorder(
                    borderRadius:
                        BorderRadius.circular(40),
                    borderSide: BorderSide.none,
                  ),
                ),
              ),

              const SizedBox(height: 24),

              /// FILTER CHIPS
              Wrap(
                spacing: 12,
                runSpacing: 12,

                children: categories.map((category) {

                  return CategoryChip(
                    label: category,
                    selected:
                        selectedCategory == category,

                    onTap: () {
                      setState(() {
                        selectedCategory = category;
                      });
                    },
                  );
                }).toList(),
              ),

              const SizedBox(height: 28),

              /// STARTUP CARDS
              ...mockStartups.map(
                (startup) =>
                    StartupCard(startup: startup),
              ),

              const SizedBox(height: 12),

              /// LOCKED BANNER
              const LockedStartupsBanner(),

              const SizedBox(height: 28),

              /// CTA
              const ConnectCtaCard(),

              const SizedBox(height: 40),
            ],
          ),
        ),
      ),
    );
  }
}
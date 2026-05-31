class StartupModel {
  final String name;
  final String category;
  final String stage;
  final String description;
  final bool locked;

  StartupModel({
    required this.name,
    required this.category,
    required this.stage,
    required this.description,
    this.locked = true,
  });
}
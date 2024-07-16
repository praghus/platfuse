# Changelog

All notable changes to the Platfuse Game Engine project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.4.4] - 2024-07-16

### Added

-   `Entity` - `bounds`. Whether the object is bounded by the scene and cannot move outside.
-   `Shapes` for the Entities. Default: `Rectange` new: `Ellipse` and `Polygon`.

### Changed

-   N/A

### Deprecated

-   N/A

### Removed

-   N/A

### Fixed

-   Audio preloading on iOS devices.
-   Redraw tile on layer canvas after add/remove.

### Security

-   N/A

## [1.4.0] - 2024-07-10

### Added

-   Entity `family` property.
-   Game `getResolution()` method

### Changed

-   Camera constructor.
-   Split camera speed to horizontal and vertical value.

### Deprecated

-   N/A

### Removed

-   N/A

### Fixed

-   Camera shake scale.
-   Camera bounds and view size.
-   Entity initial position for non TMX objects

### Security

-   Bumped tmx-map-parser version due to xml2js vulnerability to prototype pollution

## [1.3.4] - 2024-07-07

### Added

-   N/A

### Changed

-   N/A

### Deprecated

-   N/A

### Removed

-   N/A

### Fixed

-   Camera scroll alnd scale.
-   Rotations for non animated objects.

### Security

-   N/A

## [1.3.0] - 2024-07-04

### Added

-   Initial setup and configuration for the Platfuse Game Engine.
-   Basic scene management functionality.
-   Asset preloading capabilities.
-   Input handling for keyboard and mouse.
-   Responsive canvas rendering.
-   Debug mode for development.

### Changed

-   N/A

### Deprecated

-   N/A

### Removed

-   N/A

### Fixed

-   N/A

### Security

-   N/A

## [1.0.0] - 2023-04-01

### Added

-   Initial release of the Platfuse Game Engine.

### Changed

-   N/A

### Deprecated

-   N/A

### Removed

-   N/A

### Fixed

-   N/A

### Security

-   N/A

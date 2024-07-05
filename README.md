# Platfuse Game Engine **[![NPM Version](https://img.shields.io/npm/v/platfuse.svg?style=flat)](https://www.npmjs.org/package/platfuse)**

Platfuse is a lightweight, highly customizable game engine built with TypeScript, designed to make 2D game development in web environments both straightforward and efficient.

## Main features

-   **Tiled Map Editor Support:** Directly use [Tiled map](https://www.mapeditor.org/) format (.tmx) for creating and editing game levels, offering a seamless integration with the popular map editor.
-   **Retro-Focused:** Tailored features and optimizations for creating games with a nostalgic feel. (main focus to be as pixel perfect as possible)
-   **Flexible Scene Management:** Easily manage game scenes, including loading, switching, and unloading.
-   **Asset Preloading:** Supports preloading of images and audio to ensure smooth gameplay.
-   **Input Handling:** Integrated input management for keyboard and mouse events.
-   **Sound Management:** Utilize the [Howler.js](https://howlerjs.com) library for comprehensive audio control.
-   **Particle System:** Incorporate a versatile particle system to add visually stunning effects like smoke, fire, and explosions to your games.
-   **Retro Camera Mode:** Easily switch the camera to a retro mode, disabling scrolling and allowing for fixed screen views, enhancing the nostalgic game experience.
-   **Responsive Design:** Automatically adjusts the game canvas to fit the window size, with support for fixed aspect ratios.
-   **Utility Functions:** Includes helper functions like linear interpolation (lerp) for smooth animations.
-   **Debug Mode:** Toggle debug mode for additional output helpful during development.

## Getting Started

To get started with Platfuse, you'll need to have Node.js and Yarn installed on your system.

### Installation

1. Use boilerplate template for your first Platfuse game:

    ```bash
    npx platfuse your-game-name
    ```

    It will create basic game project and install all required dependencies

2. Navigate to the created game directory:

    ```bash
    cd your-game-name
    ```

3. Start the development build:

    ```bash
    yarn start
    ```

4. Or build:

    ```bash
    yarn build
    ```

### Creating Your First Game

1. Define your game configuration and preload assets:

    ```typescript
    const gameConfig = {
        debug: true,
        global: true,
        fixedSize: vec2(800, 600),
        backgroundColor: '#000000',
        primaryColor: '#FFFFFF',
        secondaryColor: '#FF0000'
    }

    const preloadAssets = {
        player: 'path/to/player.png',
        background: 'path/to/background.png'
    }
    ```

2. Initialize the game engine with your configuration and assets:

    ```typescript
    const myGame = new Game(gameConfig, preloadAssets)
    ```

3. Create your first scene by extending the `Scene` class and implementing the required methods.

4. Start your game by initializing it with your main scene:
    ```typescript
    myGame.init(MyMainScene)
    ```

## Documentation

### Game

The [`Game`](https://praghus.github.io/platfuse/interfaces/Game.html) class key features and components:

-   **Initialization and Configuration**: The class constructor takes a [`GameConfig`](https://praghus.github.io/platfuse/interfaces/GameConfig.html) object.

-   **Asset Management**: It supports preloading and managing game assets, including images and sounds, with methods to retrieve and play sounds, and to get images by name.

-   **Scene Management**: The class allows for initializing and playing scenes, with support for switching between different scenes and managing scene lifecycle events.

-   **Rendering and Drawing**: It integrates a drawing utility for rendering game elements, handling the canvas context, and managing background and primary colors.

-   **Input Handling**: An input handler is included for managing user interactions.

-   **Game Loop and Timing**: Implements a game loop with support for pausing, updating game state, and rendering scenes. It also includes timing utilities for managing frame rates and calculating deltas.

-   **Utility Methods**: Provides utility methods for settings management, sound volume control, and creating timer objects.

-   **Responsive Design**: Includes an event handler for window resize events to adjust the game canvas size and maintain aspect ratio, ensuring the game is responsive across different devices.

-   **Debugging and Development Features**: Offers debugging support and configuration options for development purposes.

### Scene

The [Scene](https://praghus.github.io/platfuse/classes/Scene.html) class key functionalities include:

-   **Layer Management**: Methods to add, remove, show, and hide layers within the scene. Layers can contain objects or tiles, and their visibility can be toggled.
-   **Tile Management**: Methods to retrieve tiles based on their position within a layer or by their unique identifier. It supports handling flipped tiles through bitwise operations.
-   **Debugging Support**: A method to display debug information on the canvas. This includes the camera's position and scale, the grid visible through the camera, the pointer's position, the number of objects in the scene, and the average frames per second (FPS).

### Layer

The [`Layer`](https://praghus.github.io/platfuse/classes/Layer.html) classis designed for managing layers within a scene, particularly to use tile-based maps. It integrates with the [`tmx-map-parser`](https://github.com/praghus/tmx-map-parser) library for handling TMX layer data. Key features and functionalities include:

-   **Layer Identification and Metadata**: Each layer has a unique ID (defaulting to the current timestamp), an optional name, a type (custom or derived from TMX data), and custom properties.
-   **Dimension and Visibility Management**: The class supports setting layer dimensions (width and height) and visibility, allowing layers to be shown or hidden as needed.
-   **Tile Data Handling**: Tile data (an array of tile IDs) can be stored and used to render the layer's visual representation.
-   **Canvas Rendering**: The class can create a canvas element [`layerCanvas`](https://praghus.github.io/platfuse/classes/Layer.html#layerCanvas) specifically for the layer, onto which tile graphics are rendered based on the layer's tile data. This is particularly useful for optimizing rendering performance in web-based applications.
-   **Integration with Scene and Entities**: Layers are associated with a [`Scene`](https://praghus.github.io/platfuse/classes/Scene.html) object (representing the overall scene or map) and can contain [`Entity`](https://praghus.github.io/platfuse/classes/Entity.html) objects, allowing for a structured and hierarchical organization of game elements.

#### Custom Function Layers

In addition to handling standard tile and image layers, the [`Layer`](https://praghus.github.io/platfuse/classes/Layer.html) class supports the definition of custom function layers. These layers allow to implement specialized rendering or update logic that goes beyond static tile or image displays. This feature is particularly useful for dynamic content or interactive elements within a scene that cannot be adequately represented by static tiles or images alone.

Key aspects of custom function layers include:

-   **Custom Rendering Logic**: You can define a custom rendering function that is called whenever the layer needs to be drawn. This function can use any drawing commands to render content directly onto the layer's canvas, allowing for a wide range of visual effects.

-   **Dynamic Content Support**: Custom function layers are ideal for scenes that require dynamic content updates, such as moving characters, changing weather effects, or interactive elements that respond to user inputs.

-   **Integration with Game Loop**: Custom function layers can be integrated into the game's main loop, allowing their content to be updated each frame based on game state, user actions, or other criteria.

-   **Flexibility**: By providing a mechanism to execute arbitrary code for rendering and updating, custom function layers offer unparalleled flexibility, allows to implement features that would be difficult or impossible with standard layer types.

To define a custom function layer, You should extend the [`Layer`](https://praghus.github.io/platfuse/classes/Layer.html) class and override the `draw` method with their custom drawing logic. Additionally, any necessary update logic can be implemented in an `update` method, which should also be called from the game's main loop.

Example:

```typescript
class CustomFunctionLayer extends Layer {
    constructor(scene: Scene) {
        super(scene)
    }

    draw() {
        // Custom rendering logic here
    }

    update() {
        // Optional update logic here
    }
}
```

### Entity

The [`Entity`](https://praghus.github.io/platfuse/classes/Entity.html) class incorporates a simplified physics model for game development, focusing on movement, collision, and force application. Here's a summary of its physics-related features:

-   **Force Application**: Entities can have forces applied to them, which are affected by their mass. This allows for dynamic movement and interactions within the game world.

-   **Velocity and Speed Limit**: The class enforces a maximum speed (`maxSpeed`) for entities, ensuring that their movement remains within realistic bounds.

-   **Friction and Damping**: Entities experience damping (reduction of force over time) and friction when in contact with the ground, simulating natural movement and stopping behaviors.

-   **Gravity**: A gravity scale can be applied to entities, allowing them to fall or be affected by the game world's gravity.

-   **Collision Detection**: The class includes methods for detecting collisions with tiles (`collideWithTile`, `collideWithTileRaycast`) and other entities (`collideWithObject`), enabling interaction with the game environment and other entities.

-   **Collision Response**: Upon collision, entities can respond by stopping, sliding, or bouncing, based on their physical properties and the nature of the collision.

-   **Animation and Movement Update**: The `update` method integrates physics calculations with animation updates, ensuring that entity movements are both visually and physically consistent.

This physics model provides a foundation for creating dynamic and interactive game experiences, allowing entities to move, collide, and interact in a realistic manner.

---

For detailed documentation on the Platfuse Game Engine, including advanced configuration options, please refer to the official [documentation](https://praghus.github.io/platfuse).

## Contributing

We welcome contributions to the Platfuse Game Engine! Please read our contributing [guidelines](CONTRIBUTING.md) before submitting pull requests.

## License

Platfuse is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Project Status

The project is in a state of continuous development and improvement. For the latest changes, please refer to the [CHANGELOG.md](CHANGELOG.md).

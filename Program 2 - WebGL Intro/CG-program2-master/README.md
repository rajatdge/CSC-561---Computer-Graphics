# Computer Graphics (CSC 561)
### Program 2: Rasterization

#### _Part 1_ (Render Input Triangles)
Input Triangles are read from input source, appropriate values are stored in buffers and sent to WebGL and rendered correctly. The code for this is mostly in `function loadTriangles()`, the `fragmentShader` and the `vertexShader`.

References:
1. http://learningwebgl.com/blog/?p=28
2. http://learningwebgl.com/blog/?p=134
3. https://www.youtube.com/playlist?list=PLjcVFFANLS5zH_PeKC6I8p0Pt1hzph_rt (first 2 videos)

#### _Part 2_ (Render Input Ellipsoids)
Input Ellipsoids are read from input source, buffers are filled using latitude/longitude parameterization and sent to WebGl where they are rendered correctly. The code for this is mostly in `function loadEllipsoids()` and the `vertexShader`.

References:
1. http://learningwebgl.com/blog/?p=1253

#### _Part 3_ (Lighting)
Blinn-Phong Lighting is done in the `vertexShader`. All the required values for normals, ambient, diffuse, specular and exponent are filled into buffers in `loadTriangles()` and `loadEllipsoids()`.

#### _Part 4_ (Interactively Change View)
Keyboard input is taken and appropriate changes are made to variables such as `eye`, `lookAt` and `up`. The code for this is mostly in `handleKeysAndRender()`. 

References:
1. http://learningwebgl.com/blog/?p=571

#### _Part 5_ (Interactively Select Model)
For this, I added new attribute in the vertex shader, `modelIndex` which represents the model (traingle or ellipsoid) that the vertex belongs to and an uniform, `selectedModel` which holds the index of the currently selected model. By comparing these two I can decide whether to apply transformation or not. Transformations are only applied on the selected model.

#### _Part 6_ (Interactively Change Lighting Model)
New uniforms were added to the vertex shader for toggling between Blinn-Phong and Phong, increment for each of the requirement terms. These values are incremented by keyboard inputs in `handleKeyDown()`. These incremented values are taken into consideration while calculating the blinn-phong linghting in the vertex shader.

#### _Part 7_ (Interactively Transform Models)
The centers of each model are stored in a an array called `modelCenters`. While handling the various keyboard input, the corresponding transformations are applied to the `transformMatrix` which is sent to the vertex shader where it is applied to each vertex of the selected model. For rotations, it is also translated using the corresponding model centers so that the models appear to roatate around itself.
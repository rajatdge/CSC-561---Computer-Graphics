/* GLOBAL CONSTANTS AND VARIABLES */

/* assignment specific globals */
const WIN_Z = 0;  // default graphics window z coord in world space
const WIN_LEFT = 0; const WIN_RIGHT = 1;  // default left and right x coords in world space
const WIN_BOTTOM = 0; const WIN_TOP = 1;  // default top and bottom y coords in world space
const INPUT_TRIANGLES_URL = "https://ncsucgclass.github.io/prog2/triangles.json"; // triangles file loc
const INPUT_SPHERES_URL = "https://ncsucgclass.github.io/prog2/ellipsoids.json"; // ellipsoids file loc

var eye = new vec3.fromValues(0.5, 0.5, -0.5);    // default eye position in world space
var lookAt = new vec3.fromValues(0, 0, 1);        // look at vector
var up = new vec3.fromValues(0, 1, 0);        // view up vector

var light = new vec3.fromValues(-1, 3, -0.5);     // default light location in world space

/* webgl globals */
var gl = null; // the all powerful gl object. It's all here folks!

// buffers for vertex shader
var triBufferSize = 0; // the number of indices in the triangle buffer
var tVertexBuffer; // this contains vertex coordinates in triangles
var tIndexBuffer; // this contains indices into tVertexBuffer in triangles
var tNormalBuffer;  // normals in traingles
var tAmbientBuffer; // ambient terms in triangles
var tDiffuseBuffer; // diffuse terms in triangles
var tSpecularBuffer; // specular terms in triangles
var tSpecularExpBuffer;   // specular exponent in triangles
var tModelIndexBuffer;      // index of the model that a vertex belongs to

var eBufferSize = 0; // number of indices in ellipsoid buffer
var eVertexBuffer; // this contains vertex coordinates in ellipsoids
var eIndexBuffer; // this contains indices into eVertexBuffer in ellipsoids
var eNormalBuffer; // normals in ellipsoids
var eAmbientBuffer; // ambient terms in ellipsoids
var eDiffuseBuffer; // diffuse terms in ellipsoids
var eSpecularBuffer; // specular terms in ellipsoids
var eSpecularExpBuffer; // specular exponent in ellipsoids
var eModelIndexBuffer;    // index of the model that a vetrex belongs to

// uniforms for vertex shader
var viewMatrix = mat4.create();   // view matrix
var projMatrix = mat4.create();   // projection matrix

var transformMatrix = mat4.create();  // transform matrix
var selectedModel = 0.0;              // traingle/ellipsoid model currently selected

var blinnToggle = 1;                    // 1 --> blinn-phong, 0 --> phong
var ambientIncrement = 0.0;           // increment for ambient weight
var diffuseIncrement = 0.0;           // increment for diffuse weight
var specularIncrement = 0.0;          // increment for specular weight
var expIncrement = 0.0;              // increment for specular exponent

// where to put position for vertex shader
var vertexPositionAttrib;
var vertexNormalAttrib;
var ambientAttrib;
var diffuseAttrib;
var specularAttrib;
var specularExpAttrib;
var modelIndexAttrib;

var eyePositionUniform;
var lightPositionUniform;
var viewMatrixUniform;
var projMatrixUniform;
var transformMatrixUniform;
var selectedModelUniform;
var blinnToggleUniform;
var ambientIncrementUniform;
var diffuseIncrementUniform;
var specularIncrementUniform;
var expIncrementUniform;

// misc global variables
var modelCount = 1.0;
var selectedTriangle = 0.0;
var selectedEllipsoid = 0.0;
var inputTriangles;
var inputEllipsoids;
var modelCenters = {};

// ASSIGNMENT HELPER FUNCTIONS

// get the JSON file from the passed URL
function getJSONFile(url,descr) {
    try {
        if ((typeof(url) !== "string") || (typeof(descr) !== "string"))
            throw "getJSONFile: parameter not a string";
        else {
            var httpReq = new XMLHttpRequest(); // a new http request
            httpReq.open("GET",url,false); // init the request
            httpReq.send(null); // send the request
            var startTime = Date.now();
            while ((httpReq.status !== 200) && (httpReq.readyState !== XMLHttpRequest.DONE)) {
                if ((Date.now()-startTime) > 3000)
                    break;
            } // until its loaded or we time out after three seconds
            if ((httpReq.status !== 200) || (httpReq.readyState !== XMLHttpRequest.DONE))
                throw "Unable to open "+descr+" file!";
            else
                return JSON.parse(httpReq.response);
        } // end if good params
    } // end try

    catch(e) {
        console.log(e);
        return(String.null);
    }
} // end get json file

// set up the webGL environment
function setupWebGL() {

    // Get the canvas and context
    var canvas = document.getElementById("myWebGLCanvas"); // create a js canvas
    gl = canvas.getContext("webgl"); // get a webgl object from it
    gl.viewportWidth = canvas.width;
    gl.viewportHeight = canvas.height;

    try {
        if (gl == null) {
            throw "unable to create gl context -- is your browser gl ready?";
        } else {
            gl.clearColor(0.0, 0.0, 0.0, 1.0); // use black when we clear the frame buffer
            gl.clearDepth(1.0); // use max when we clear the depth buffer
            gl.enable(gl.DEPTH_TEST); // use hidden surface removal (with zbuffering)
        }
    } // end try

    catch(e) {
        console.log(e);
    } // end catch

} // end setupWebGL

// read triangles in, load them into webgl buffers
function loadTriangles(){
    inputTriangles = getJSONFile(INPUT_TRIANGLES_URL,"triangles");

    if (inputTriangles != String.null) {
        var whichSetVert; // index of vertex in current triangle set
        var whichSetTri; // index of triangle in current triangle set
        var coordArray = []; // 1D array of vertex coords for WebGL
        var indexArray = []; // 1D array of vertex indices for WebGL
        var vtxBufferSize = 0; // the number of vertices in the vertex buffer
        var vtxToAdd = []; // vtx coords to add to the coord array
        var indexOffset = vec3.create(); // the index start for the current set
        var triToAdd = vec3.create(); // tri indices to add to the index array

        var normalToAdd = [];   // normals to add to normalArray
        var normalArray = [];   // array of vertex normals
        var ambientArray = [];  // array of ambient terms
        var diffuseArray = [];  // array of diffuse terms
        var specularArray = []; // array of specular terms
        var specularExpArray = [];   // array of specular factors
        var modelIndexArray = [];

        for (var whichSet=0; whichSet<inputTriangles.length; whichSet++) {
            vec3.set(indexOffset,vtxBufferSize,vtxBufferSize,vtxBufferSize); // update vertex start

            var ambientTerm = inputTriangles[whichSet].material.ambient;
            var diffuseTerm = inputTriangles[whichSet].material.diffuse;
            var specularTerm = inputTriangles[whichSet].material.specular;
            var specularExp = inputTriangles[whichSet].material.n;

            var center = vec3.create();

            // set up the vertex coord array
            for (whichSetVert=0; whichSetVert<inputTriangles[whichSet].vertices.length; whichSetVert++) {
                vtxToAdd = inputTriangles[whichSet].vertices[whichSetVert];
                coordArray.push(vtxToAdd[0],vtxToAdd[1],vtxToAdd[2]);

                normalToAdd = inputTriangles[whichSet].normals[whichSetVert];
                normalArray.push(normalToAdd[0], normalToAdd[1], normalToAdd[2]);

                ambientArray.push(ambientTerm[0], ambientTerm[1], ambientTerm[2]);
                diffuseArray.push(diffuseTerm[0], diffuseTerm[1], diffuseTerm[2]);
                specularArray.push(specularTerm[0], specularTerm[1], specularTerm[2]);
                specularExpArray.push(specularExp);
                modelIndexArray.push(modelCount);
                vec3.add(center, center, vtxToAdd);
            } // end for vertices in set

            // set up the triangle index array, adjusting indices across sets
            for (whichSetTri=0; whichSetTri<inputTriangles[whichSet].triangles.length; whichSetTri++) {
                vec3.add(triToAdd,indexOffset,inputTriangles[whichSet].triangles[whichSetTri]);
                indexArray.push(triToAdd[0],triToAdd[1],triToAdd[2]);
            } // end for triangles in set

            vtxBufferSize += inputTriangles[whichSet].vertices.length; // total number of vertices
            triBufferSize += inputTriangles[whichSet].triangles.length; // total number of tris
            //} // end for each triangle set

            vec3.scale(center, center, (1.0/inputTriangles[whichSet].vertices.length));
            modelCenters[modelCount] = center;
            modelCount++;
        }
        // send vertex, normal, colors to webGL
        tVertexBuffer = gl.createBuffer(); // init empty vertex coord buffer
        gl.bindBuffer(gl.ARRAY_BUFFER,tVertexBuffer); // activate that buffer
        gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(coordArray),gl.STATIC_DRAW); // coords to that buffer

        tNormalBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER,tNormalBuffer); // activate that buffer
        gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(normalArray),gl.STATIC_DRAW);

        tAmbientBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER,tAmbientBuffer);
        gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(ambientArray),gl.STATIC_DRAW);

        tDiffuseBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER,tDiffuseBuffer);
        gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(diffuseArray),gl.STATIC_DRAW);

        tSpecularBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER,tSpecularBuffer);
        gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(specularArray),gl.STATIC_DRAW);

        tSpecularExpBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, tSpecularExpBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(specularExpArray), gl.STATIC_DRAW);

        tModelIndexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, tModelIndexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(modelIndexArray), gl.STATIC_DRAW);

        // send the triangle indices to webGL
        tIndexBuffer = gl.createBuffer(); // init empty triangle index buffer
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, tIndexBuffer); // activate that buffer
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(indexArray),gl.STATIC_DRAW); // indices to that buffer
        triBufferSize = indexArray.length;
    } // end if triangles found
} // end load triangles

// read ellipsoids in, load them into webgl buffers
function loadEllipsoids(){
    inputEllipsoids = getJSONFile(INPUT_SPHERES_URL,"ellipsoids");

    if(inputEllipsoids != String.null){
        var coordArray = [];
        var indexArray = [];
        var normalArray = [];
        var ambientArray = [];
        var diffuseArray = [];
        var specularArray = [];
        var specularExpArray = [];
        var modelIndexArray = [];

        var indexOffset = 0;
        var latitudeBands = 50;
        var longitudeBands = 50;

        for(var whichSet=0; whichSet<inputEllipsoids.length; whichSet++){
          var center = new vec3.fromValues(inputEllipsoids[whichSet].x, inputEllipsoids[whichSet].y, inputEllipsoids[whichSet].z);

          var ambientTerm = inputEllipsoids[whichSet].ambient;
          var diffuseTerm = inputEllipsoids[whichSet].diffuse;
          var specularTerm = inputEllipsoids[whichSet].specular;
          var specularExp = inputEllipsoids[whichSet].n;

          for (var latNumber = 0; latNumber <= latitudeBands; latNumber++) {
              var theta = latNumber * Math.PI / latitudeBands;
              var sinTheta = Math.sin(theta);
              var cosTheta = Math.cos(theta);

              for (var longNumber = 0; longNumber <= longitudeBands; longNumber++) {
                  var phi = longNumber * 2 * Math.PI / longitudeBands;
                  var sinPhi = Math.sin(phi);
                  var cosPhi = Math.cos(phi);

                  var x = cosPhi * sinTheta;
                  var y = cosTheta;
                  var z = sinPhi * sinTheta;

                  coordArray.push(center[0] + inputEllipsoids[whichSet].a * x,
                                  center[1] + inputEllipsoids[whichSet].b * y,
                                  center[2] + inputEllipsoids[whichSet].c * z);

                  normalArray.push(x, y, z);

                  ambientArray.push(ambientTerm[0], ambientTerm[1], ambientTerm[2]);
                  diffuseArray.push(diffuseTerm[0], diffuseTerm[1], diffuseTerm[2]);
                  specularArray.push(specularTerm[0], specularTerm[1], specularTerm[2]);
                  specularExpArray.push(specularExp);
                  modelIndexArray.push(modelCount);
              }
          }

          for (var latNumber = 0; latNumber < latitudeBands; latNumber++) {
              for (var longNumber = 0; longNumber < longitudeBands; longNumber++) {
                  var first = (latNumber * (longitudeBands + 1)) + longNumber + indexOffset;
                  var second = first + longitudeBands + 1;

                  indexArray.push(first);
                  indexArray.push(second);
                  indexArray.push(first + 1);

                  indexArray.push(second);
                  indexArray.push(second + 1);
                  indexArray.push(first + 1);
              }
          }

          indexOffset += (latitudeBands+1)*(longitudeBands+1);

          modelCenters[modelCount] = center;
          modelCount++;
        }

        // send the vertex coords to webGL
        eVertexBuffer = gl.createBuffer(); // init empty vertex coord buffer
        gl.bindBuffer(gl.ARRAY_BUFFER,eVertexBuffer); // activate that buffer
        gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(coordArray),gl.STATIC_DRAW); // coords to that buffer

        eNormalBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, eNormalBuffer); // activate that buffer
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normalArray),gl.STATIC_DRAW);

        eAmbientBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER,eAmbientBuffer);
        gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(ambientArray),gl.STATIC_DRAW);

        eDiffuseBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER,eDiffuseBuffer);
        gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(diffuseArray),gl.STATIC_DRAW);

        eSpecularBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER,eSpecularBuffer);
        gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(specularArray),gl.STATIC_DRAW);

        eSpecularExpBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, eSpecularExpBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(specularExpArray), gl.STATIC_DRAW);

        eModelIndexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, eModelIndexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(modelIndexArray), gl.STATIC_DRAW);

        // send the ellipsoid indices to webGL
        eIndexBuffer = gl.createBuffer(); // init empty triangle index buffer
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, eIndexBuffer); // activate that buffer
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indexArray), gl.STATIC_DRAW); // indices to that buffer
        eBufferSize = indexArray.length;

    } // end if ellipsoids found
} // end load ellipsoids

// setup the webGL shaders
function setupShaders() {

    // define fragment shader in essl using es6 template strings
    var fShaderCode = `
        precision mediump float;

        varying vec3 fragColor;

        void main(void) {
            gl_FragColor = vec4(fragColor, 1.0);
        }
    `;

    // define vertex shader in essl using es6 template strings
    var vShaderCode = `
        precision mediump float;

        attribute vec3 vertexPosition;
        attribute vec3 vertexNormal;
        attribute vec3 ambient;
        attribute vec3 diffuse;
        attribute vec3 specular;
        attribute float factor;
        attribute float modelIndex;

        uniform vec3 lightPosition;
        uniform vec3 eyePosition;

        uniform mat4 vMat;
        uniform mat4 pMat;
        uniform mat4 tMat;
        uniform float selectedModel;
        uniform int blinn;
        uniform float aInc;
        uniform float dInc;
        uniform float sInc;
        uniform float nInc;

        varying vec3 fragColor;

        void main(void) {
            mat4 transform = (modelIndex == selectedModel) ? tMat : mat4(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1);  // apply transformation if selected model, identity otherwise
            gl_Position = pMat * vMat * transform * vec4(vertexPosition, 1.0);

            vec3 N = vertexNormal;
            vec3 L = normalize(lightPosition - vertexPosition);
            float NdotL = dot(N, L);

            vec3 V = normalize(eyePosition - vertexPosition);
            vec3 H = normalize(L+V);
            vec3 R = 2.0*NdotL*N - L;

            // add increments
            vec3 totalAmbient = ambient + ((modelIndex == selectedModel) ? vec3(aInc, aInc, aInc) : vec3(0, 0, 0));
            vec3 totalDiffuse = diffuse + ((modelIndex == selectedModel) ? vec3(dInc, dInc, dInc) : vec3(0, 0, 0));
            vec3 totalSpecular = specular + ((modelIndex == selectedModel) ? vec3(sInc, sInc, sInc) : vec3(0, 0, 0));
            float totalFactor = factor + ((modelIndex == selectedModel) ? nInc : 0.0);

            float specCoeff = pow(((blinn==1)?dot(N, H):dot(R, V)), totalFactor); // blinn-phong or phong

            float red = max(0.0, totalAmbient[0]) + max(0.0, totalDiffuse[0]*NdotL) + max(0.0, totalSpecular[0] * specCoeff);
            float green = max(0.0, totalAmbient[1]) + max(0.0, totalDiffuse[1]*NdotL) + max(0.0, totalSpecular[1] * specCoeff);
            float blue = max(0.0, totalAmbient[2]) + max(0.0, totalDiffuse[2]*NdotL) + max(0.0, totalSpecular[2] * specCoeff);

            fragColor = vec3(red, green, blue);
        }
    `;

    try {
        // console.log("fragment shader: "+fShaderCode);
        var fShader = gl.createShader(gl.FRAGMENT_SHADER); // create frag shader
        gl.shaderSource(fShader,fShaderCode); // attach code to shader
        gl.compileShader(fShader); // compile the code for gpu execution

        // console.log("vertex shader: "+vShaderCode);
        var vShader = gl.createShader(gl.VERTEX_SHADER); // create vertex shader
        gl.shaderSource(vShader,vShaderCode); // attach code to shader
        gl.compileShader(vShader); // compile the code for gpu execution

        if (!gl.getShaderParameter(fShader, gl.COMPILE_STATUS)) { // bad frag shader compile
            throw "error during fragment shader compile: " + gl.getShaderInfoLog(fShader);
            gl.deleteShader(fShader);
        } else if (!gl.getShaderParameter(vShader, gl.COMPILE_STATUS)) { // bad vertex shader compile
            throw "error during vertex shader compile: " + gl.getShaderInfoLog(vShader);
            gl.deleteShader(vShader);
        } else { // no compile errors
            var shaderProgram = gl.createProgram(); // create the single shader program
            gl.attachShader(shaderProgram, fShader); // put frag shader in program
            gl.attachShader(shaderProgram, vShader); // put vertex shader in program
            gl.linkProgram(shaderProgram); // link program into gl context

            if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) { // bad program link
                throw "error during shader program linking: " + gl.getProgramInfoLog(shaderProgram);
            } else { // no shader program link errors
                gl.useProgram(shaderProgram); // activate shader program (frag and vert)
                vertexPositionAttrib = // get pointer to vertex shader input
                    gl.getAttribLocation(shaderProgram, "vertexPosition");
                gl.enableVertexAttribArray(vertexPositionAttrib); // input to shader from array

                vertexNormalAttrib =gl.getAttribLocation(shaderProgram, "vertexNormal");
                gl.enableVertexAttribArray(vertexNormalAttrib);

                ambientAttrib = gl.getAttribLocation(shaderProgram, "ambient");
                gl.enableVertexAttribArray(ambientAttrib);

                diffuseAttrib = gl.getAttribLocation(shaderProgram, "diffuse");
                gl.enableVertexAttribArray(diffuseAttrib);

                specularAttrib = gl.getAttribLocation(shaderProgram, "specular");
                gl.enableVertexAttribArray(specularAttrib);

                specularExpAttrib = gl.getAttribLocation(shaderProgram, "factor");
                gl.enableVertexAttribArray(specularExpAttrib);

                modelIndexAttrib = gl.getAttribLocation(shaderProgram, "modelIndex");
                gl.enableVertexAttribArray(modelIndexAttrib);

                lightPositionUniform = gl.getUniformLocation(shaderProgram, 'lightPosition');
                gl.uniform3fv(lightPositionUniform, light);

                eyePositionUniform = gl.getUniformLocation(shaderProgram, 'eyePosition');
                gl.uniform3fv(eyePositionUniform, eye);

                projMatrixUniform = gl.getUniformLocation(shaderProgram, 'pMat');
                viewMatrixUniform = gl.getUniformLocation(shaderProgram, 'vMat');
                transformMatrixUniform = gl.getUniformLocation(shaderProgram, 'tMat');
                selectedModelUniform = gl.getUniformLocation(shaderProgram, 'selectedModel');
                blinnToggleUniform = gl.getUniformLocation(shaderProgram, 'blinn');
                ambientIncrementUniform = gl.getUniformLocation(shaderProgram, 'aInc');
                diffuseIncrementUniform = gl.getUniformLocation(shaderProgram, 'dInc');
                specularIncrementUniform = gl.getUniformLocation(shaderProgram, 'sInc');
                expIncrementUniform = gl.getUniformLocation(shaderProgram, 'nInc');

            } // end if no shader program link errors
        } // end if no compile errors
    } // end try

    catch(e) {
        console.log(e);
    } // end catch
} // end setup shaders

// render the loaded model
function renderModel(){
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); // clear frame/depth buffers

    // activate and feed buffers into vertex shader
    gl.bindBuffer(gl.ARRAY_BUFFER,tVertexBuffer); // activate
    gl.vertexAttribPointer(vertexPositionAttrib,3,gl.FLOAT,false,0,0); // feed

    gl.bindBuffer(gl.ARRAY_BUFFER,tNormalBuffer);
    gl.vertexAttribPointer(vertexNormalAttrib,3,gl.FLOAT,false,0,0);

    gl.bindBuffer(gl.ARRAY_BUFFER,tAmbientBuffer);
    gl.vertexAttribPointer(ambientAttrib,3,gl.FLOAT,false,0,0);

    gl.bindBuffer(gl.ARRAY_BUFFER,tDiffuseBuffer);
    gl.vertexAttribPointer(diffuseAttrib,3,gl.FLOAT,false,0,0);

    gl.bindBuffer(gl.ARRAY_BUFFER,tSpecularBuffer);
    gl.vertexAttribPointer(specularAttrib,3,gl.FLOAT,false,0,0);

    gl.bindBuffer(gl.ARRAY_BUFFER, tSpecularExpBuffer);
    gl.vertexAttribPointer(specularExpAttrib, 1, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, tModelIndexBuffer);
    gl.vertexAttribPointer(modelIndexAttrib, 1, gl.FLOAT, false, 0, 0);

    // triangle buffer: activate and render
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,tIndexBuffer); // activate
    gl.drawElements(gl.TRIANGLES, triBufferSize, gl.UNSIGNED_SHORT,0); // render



    // activate and feed buffers into vertex shader
    gl.bindBuffer(gl.ARRAY_BUFFER,eVertexBuffer); // activate
    gl.vertexAttribPointer(vertexPositionAttrib,3,gl.FLOAT,false,0,0); // feed

    gl.bindBuffer(gl.ARRAY_BUFFER,eNormalBuffer);
    gl.vertexAttribPointer(vertexNormalAttrib,3,gl.FLOAT,false,0,0);

    gl.bindBuffer(gl.ARRAY_BUFFER,eAmbientBuffer);
    gl.vertexAttribPointer(ambientAttrib, 3, gl.FLOAT,false,0,0);

    gl.bindBuffer(gl.ARRAY_BUFFER,eDiffuseBuffer);
    gl.vertexAttribPointer(diffuseAttrib, 3, gl.FLOAT,false,0,0);

    gl.bindBuffer(gl.ARRAY_BUFFER,eSpecularBuffer);
    gl.vertexAttribPointer(specularAttrib, 3, gl.FLOAT,false,0,0);

    gl.bindBuffer(gl.ARRAY_BUFFER, eSpecularExpBuffer);
    gl.vertexAttribPointer(specularExpAttrib, 1, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, eModelIndexBuffer);
    gl.vertexAttribPointer(modelIndexAttrib, 1, gl.FLOAT, false, 0, 0);

    // ellipsoid buffer: activate and render
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,eIndexBuffer); // activate
    gl.drawElements(gl.TRIANGLES,eBufferSize,gl.UNSIGNED_SHORT,0); // render
} // end render triangles and ellipsoids


/* MAIN -- HERE is where execution begins after window load */

function main() {
    setupWebGL(); // set up the webGL environment
    loadTriangles(); // load in the triangles from tri file
    loadEllipsoids(); // load in the ellipsoids from ellip file
    setupShaders(); // setup the webGL shaders

    document.onkeydown = handleKeyDown;
    document.onkeyup = handleKeyUp;

    handleKeysAndRender(); // draw the triangles and ellipsoids using webGL
} // end main

var currentlyPressedKeys = {};

function handleKeyDown(event){
  currentlyPressedKeys[event.keyCode] = true;

  if(event.keyCode == 37){                                                      // Left Arrow --> select previous triangle
    selectedTriangle = selectedTriangle-1.0;
    if(selectedTriangle < 0.0)  selectedTriangle = inputTriangles.length - 1;
    selectedModel = selectedTriangle + 1.0;
  }
  if(event.keyCode == 39){                                                      // Right Arrow --> select next triangle
    selectedTriangle = selectedTriangle+1.0;
    if(selectedTriangle == inputTriangles.length)  selectedTriangle = 0.0;
    selectedModel = selectedTriangle + 1.0;
  }
  if(event.keyCode == 38){                                                      // Up Arrow --> select previous ellipsoid
    selectedEllipsoid = selectedEllipsoid-1.0;
    if(selectedEllipsoid < 0.0)  selectedEllipsoid = inputEllipsoids.length - 1;
    selectedModel = inputTriangles.length + selectedEllipsoid + 1.0;
  }
  if(event.keyCode == 40){                                                      // Right Arrow --> select next ellipsoid
    selectedEllipsoid = selectedEllipsoid+1.0;
    if(selectedEllipsoid == inputEllipsoids.length)  selectedEllipsoid = 0.0;
    selectedModel = inputTriangles.length + selectedEllipsoid + 1.0;
  }
  if(event.keyCode == 32){                                                      // Space --> unselect model
    selectedModel = 0.0;
  }
  if(event.keyCode == 66){                                                      // b --> toggle between phong and blinn-phong
    blinnToggle = (blinnToggle+1)%2;
  }
  if(event.keyCode == 78){                                                      // n --> increase specular exponent by 1
    expIncrement = (expIncrement + 1.0)%20.0;
  }
  if(event.keyCode == 49){                                                      // 1 --> increase ambient weight by 0.1
    ambientIncrement = (ambientIncrement+0.1)%1.0
  }
  if(event.keyCode == 50){                                                      // 2 --> increase diffuse weight by 0.1
    diffuseIncrement = (diffuseIncrement+0.1)%1.0
  }
  if(event.keyCode == 51){                                                      // 3 --> increase specular weight by 0.1
    specularIncrement = (specularIncrement+0.1)%1.0
  }
}

function handleKeyUp(event){
  currentlyPressedKeys[event.keyCode] = false;
}

function handleKeysAndRender(){
  requestAnimationFrame(handleKeysAndRender);

  var translateIncrement = 0.01;
  var rotateIncrement = glMatrix.toRadian(1);
  var mCenter = modelCenters[selectedModel];

  if(!currentlyPressedKeys[16] && currentlyPressedKeys[65]){             // a --> translate left
    vec3.add(eye, eye, [translateIncrement, 0, 0]);
  }
  if(!currentlyPressedKeys[16] && currentlyPressedKeys[68]){             // d --> translate right
    vec3.add(eye, eye, [-translateIncrement, 0, 0]);
  }
  if(!currentlyPressedKeys[16] && currentlyPressedKeys[87]){             // w --> translate forward
    vec3.add(eye, eye, [0, 0, translateIncrement]);
  }
  if(!currentlyPressedKeys[16] && currentlyPressedKeys[83]){             // s --> translate backward
    vec3.add(eye, eye, [0, 0, -translateIncrement]);
  }
  if(!currentlyPressedKeys[16] && currentlyPressedKeys[81]){             // q --> translate up
    vec3.add(eye, eye, [0, translateIncrement, 0]);
  }
  if(!currentlyPressedKeys[16] && currentlyPressedKeys[69]){             // e --> translate down
    vec3.add(eye, eye, [0, -translateIncrement, 0]);
  }

  if(currentlyPressedKeys[16] && currentlyPressedKeys[65]){             // A --> rotate left around Y axis
    vec3.rotateY(lookAt, lookAt, [0, 0, 0], rotateIncrement);
  }
  if(currentlyPressedKeys[16] && currentlyPressedKeys[68]){             // D --> rotate right around Y axis
    vec3.rotateY(lookAt, lookAt, [0, 0, 0], -rotateIncrement);
  }
  if(currentlyPressedKeys[16] && currentlyPressedKeys[87]){             // W --> rotate left around X axis
    vec3.rotateX(lookAt, lookAt, [0, 0, 0], rotateIncrement);
    vec3.rotateX(up, up, [0, 0, 0], rotateIncrement);
  }
  if(currentlyPressedKeys[16] && currentlyPressedKeys[83]){             // S --> rotate right around X axis
    vec3.rotateX(lookAt, lookAt, [0, 0, 0], -rotateIncrement);
    vec3.rotateX(up, up, [0, 0, 0], -rotateIncrement);
  }

  if(currentlyPressedKeys[37] || currentlyPressedKeys[39]
      || currentlyPressedKeys[38] || currentlyPressedKeys[40]){             // Left, Right, Up or Down Key --> scale selected model
    ambientIncrement = 0.0;
    diffuseIncrement = 0.0;
    specularIncrement = 0.0;
    expIncrement = 0.0;

    mat4.identity(transformMatrix);
    mat4.translate(transformMatrix, transformMatrix, mCenter);
    mat4.scale(transformMatrix, transformMatrix, [1.2, 1.2, 1.2]);
    mat4.translate(transformMatrix, transformMatrix, [-mCenter[0], -mCenter[1], -mCenter[2]]);
  }

  if(currentlyPressedKeys[32]){                                           // Space --> unselect model
    mat4.identity(transformMatrix);
  }

  if(!currentlyPressedKeys[16] && currentlyPressedKeys[75]){              // k --> translate selected model left
    mat4.translate(transformMatrix, transformMatrix, [translateIncrement, 0, 0]);
  }
  if(!currentlyPressedKeys[16] && currentlyPressedKeys[186]){              // ; --> translate selected model right
    mat4.translate(transformMatrix, transformMatrix, [-translateIncrement, 0, 0]);
  }
  if(!currentlyPressedKeys[16] && currentlyPressedKeys[79]){              // o --> translate selected model forward
    mat4.translate(transformMatrix, transformMatrix, [0, 0, translateIncrement]);
  }
  if(!currentlyPressedKeys[16] && currentlyPressedKeys[76]){              // l --> translate selected model backward
    mat4.translate(transformMatrix, transformMatrix, [0, 0, -translateIncrement]);
  }
  if(!currentlyPressedKeys[16] && currentlyPressedKeys[73]){              // i --> translate selected model up
    mat4.translate(transformMatrix, transformMatrix, [0, translateIncrement, 0]);
  }
  if(!currentlyPressedKeys[16] && currentlyPressedKeys[80]){              // p --> translate selected model down
    mat4.translate(transformMatrix, transformMatrix, [0, -translateIncrement, 0]);
  }

  if(currentlyPressedKeys[16] && (currentlyPressedKeys[75] || currentlyPressedKeys[186] || currentlyPressedKeys[79] || currentlyPressedKeys[76]
                                || currentlyPressedKeys[73] || currentlyPressedKeys[80])){

    mat4.translate(transformMatrix, transformMatrix, mCenter);
    if(currentlyPressedKeys[75]){                                   // K --> rotate selected model left around X axis
      mat4.rotateY(transformMatrix, transformMatrix, rotateIncrement);
    }
    if(currentlyPressedKeys[186]){                                  // : --> rotate selected model right around Y axis
      mat4.rotateY(transformMatrix, transformMatrix, -rotateIncrement);
    }
    if(currentlyPressedKeys[79]){                                   // O --> rotate selected model forward around X
      mat4.rotateX(transformMatrix, transformMatrix, rotateIncrement);
    }
    if(currentlyPressedKeys[76]){                                   // L --> rotate selected model backward around X
      mat4.rotateX(transformMatrix, transformMatrix, -rotateIncrement);
    }
    if(currentlyPressedKeys[73]){                                   // I --> rotate selected model clockwise around Z
      mat4.rotateZ(transformMatrix, transformMatrix, rotateIncrement);
    }
    if(currentlyPressedKeys[80]){                                   // P --> rotate selected model counter-clockwise around Z
      mat4.rotateZ(transformMatrix, transformMatrix, -rotateIncrement);
    }

    mat4.translate(transformMatrix, transformMatrix, [-mCenter[0], -mCenter[1], -mCenter[2]]);
  }

  var center = vec3.create();
  vec3.add(center, eye, lookAt);
  mat4.lookAt(viewMatrix, eye, center, up);
  mat4.perspective(projMatrix, glMatrix.toRadian(90), gl.viewportWidth/gl.viewportHeight, 0.1, 100.0);

  gl.uniformMatrix4fv(projMatrixUniform, gl.FALSE, projMatrix);
  gl.uniformMatrix4fv(viewMatrixUniform, gl.FALSE, viewMatrix);
  gl.uniformMatrix4fv(transformMatrixUniform, gl.FALSE, transformMatrix);
  gl.uniform1f(selectedModelUniform, selectedModel);
  gl.uniform1i(blinnToggleUniform, blinnToggle);
  gl.uniform1f(ambientIncrementUniform, ambientIncrement);
  gl.uniform1f(diffuseIncrementUniform, diffuseIncrement);
  gl.uniform1f(specularIncrementUniform, specularIncrement);
  gl.uniform1f(expIncrementUniform, expIncrement);

  renderModel();
}

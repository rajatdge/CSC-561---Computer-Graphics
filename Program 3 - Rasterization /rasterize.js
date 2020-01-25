/* GLOBAL CONSTANTS AND VARIABLES */

/* assignment specific globals */
const WIN_Z = 0;  // default graphics window z coord in world space
const WIN_LEFT = 0; const WIN_RIGHT = 1;  // default left and right x coords in world space
const WIN_BOTTOM = 0; const WIN_TOP = 1;  // default top and bottom y coords in world space
const INPUT_TRIANGLES_URL = "https://ncsucgclass.github.io/prog2/triangles.json"; // triangles file loc
//const INPUT_TRIANGLES_URL = "https://ncsucgclass.github.io/prog3/triangles2.json";
const INPUT_SPHERES_URL = "https://ncsucgclass.github.io/prog2/spheres.json"; // spheres file loc
var Eye = new vec4.fromValues(0.5,0.5,-0.5,1.0); // default eye position in world space

/* webgl globals */
var gl = null; // the all powerful gl object. It's all here folks!
var vertexBuffer; // this contains vertex coordinates in triples
var triangleBuffer; // this contains indices into vertexBuffer in triples
var triBufferSize; // the number of indices in the triangle buffer
var altPosition; // flag indicating whether to alter vertex positions
var vertexPointAttrib; // where to put position for vertex shader
var altPositionUniform; // where to put altPosition flag for vertex shader
var colorPositionAttrib;
var vertexNormalAttrib; 
var ambientAttrib;
var diffuseAttrib;
var specularAttrib;
var factorAttrib;
var lightVecAttrib;
var eyePositionAttrib;
var modelMapperAttrib;

var indices = [];
var colors = [ 0,0,1, 1,0,0, 0,1,0, 1,0,1,];
var diffuse_Buffer;
var ambient_Buffer;
var normals_Buffer;
var n_Buffer;
var modelMapper_Buffer;
var transformation_matrix = mat4.create();
var n_figures;
var curr_selected_model = 0.0;
var shader_transformation_matrix;
var shader_selected_model;

var eye = new vec3.fromValues(0.5, 0.5, -0.5);    
var lookAt = new vec3.fromValues(0, 0, 1);        
var up = new vec3.fromValues(0, 1, 0);        
var light = new vec3.fromValues(0.5, 1.5, -0.5);

var modelCenters = {};
var modelMapper = [];
var viewMatrix;
var projMatrix;
var viewMat;
var projMat;
var selectFlag=false;
var interactive_transform_flag = false;
var projection_flag_default = true;


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
} // end get input spheres

// set up the webGL environment
function setupWebGL() {

    // Get the canvas and context
    var canvas = document.getElementById("myWebGLCanvas"); // create a js canvas
    gl = canvas.getContext("webgl"); // get a webgl object from it
    
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
function loadTriangles() {
    var inputTriangles = getJSONFile(INPUT_TRIANGLES_URL,"triangles");
    if (inputTriangles != String.null) { 
        var whichSetVert; // index of vertex in current triangle set
        var whichSetTri; // index of triangle in current triangle set
        var coordArray = []; // 1D array of vertex coords for WebGL
        var diffuseArray = [];
        var ambientArray = [];
        var specularArray = [];
        var normalsArray = [];
        var nArray = []
        var triangles = [];
        var prev = 0;
        var counter = 0;
        
        for (var whichSet=0; whichSet<inputTriangles.length; whichSet++) {
            for (whichSetVert=0; whichSetVert<inputTriangles[whichSet].vertices.length; whichSetVert++){
                coordArray = coordArray.concat(inputTriangles[whichSet].vertices[whichSetVert]);
                diffuseArray = diffuseArray.concat(inputTriangles[whichSet].material.diffuse);
                ambientArray = ambientArray.concat(inputTriangles[whichSet].material.ambient);
                specularArray = specularArray.concat(inputTriangles[whichSet].material.specular);
                normalsArray = normalsArray.concat(inputTriangles[whichSet].normals[whichSetVert]);
                nArray = nArray.concat(inputTriangles[whichSet].n);
            }
        } 

        for (var whichSet=0; whichSet<inputTriangles.length; whichSet++) {
           for (whichSetTri=0; whichSetTri<inputTriangles[whichSet].triangles.length; whichSetTri++){
                for(var i = 0; i<inputTriangles[whichSet].triangles[whichSetTri].length;i++){
                    indices = indices.concat(inputTriangles[whichSet].triangles[whichSetTri][i] + prev);
                }
            }
            prev = prev + inputTriangles[whichSet].vertices.length;
        }

        for (var whichSet=0; whichSet<inputTriangles.length; whichSet++){
            var tmp = vec3.create();
            for (whichSetVert=0; whichSetVert<inputTriangles[whichSet].vertices.length; whichSetVert++){
                vec3.add(tmp, tmp, inputTriangles[whichSet].vertices[whichSetVert]);
                modelMapper.push(counter);
            }
            vec3.scale(tmp, tmp, (1/inputTriangles[whichSet].vertices.length));
            modelCenters[counter] = tmp;
            counter++;
        }

        n_figures = counter;
        console.log(modelCenters);
        console.log(modelMapper);
        // send the vertex coords to webGL
        vertexBuffer = gl.createBuffer(); // init empty vertex coord buffer
        gl.bindBuffer(gl.ARRAY_BUFFER,vertexBuffer); // activate that buffer
        gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(coordArray),gl.STATIC_DRAW); // coords to that buffer

        Index_Buffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, Index_Buffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

        diffuse_Buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, diffuse_Buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(diffuseArray), gl.STATIC_DRAW);

        ambient_Buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, ambient_Buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(ambientArray), gl.STATIC_DRAW);

        specular_Buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, specular_Buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(specularArray), gl.STATIC_DRAW);

        normals_Buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, normals_Buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normalsArray), gl.STATIC_DRAW);

        n_Buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, n_Buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(nArray), gl.STATIC_DRAW);

        modelMapper_Buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, modelMapper_Buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(modelMapper), gl.STATIC_DRAW);
        
    } // end if triangles found
} // end load triangles

function renderTransformedInput(){
    var canvas = document.getElementById("myWebGLCanvas");
    var center = vec3.create();
    var viewMatrix = mat4.create();
    var projMatrix = mat4.create();
    vec3.add(center, eye, lookAt);
    mat4.lookAt(viewMatrix, eye, center, up);
    if(projection_flag_default){
        mat4.perspective(projMatrix, glMatrix.toRadian(90), canvas.width/canvas.height, 0.1, 100.0);
    }
    else{
        mat4.ortho(projMatrix, -1, 1, -1, 1,0.1, 100.0);
    }
    gl.uniformMatrix4fv(viewMat, gl.FALSE, viewMatrix);
    gl.uniformMatrix4fv(projMat, gl.FALSE, projMatrix);
}

// setup the webGL shaders
function setupShaders(){
    
    // define fragment shader in essl using es6 template strings
    var fShaderCode = `
        precision mediump float;
        varying vec3 vertexPoint;
        varying vec3 vertexColor;
        varying vec3 fragementColor;
        varying vec3 vertexNormal;
        varying vec3 ambient;
        varying vec3 diffuse;
        varying vec3 specular;
        varying float factor;
        uniform vec3 lightVec;
        uniform vec3 eyeVec;
        
        void main(void) {
            vec3 N = normalize(vertexNormal);
            vec3 L = normalize(lightVec - vertexPoint);
            vec3 V = normalize(eyeVec - vertexPoint);
            vec3 H = normalize(L+V);
            float NdotL = max(0.0,dot(N, L));
            float NdotHtoF = max(0.0,pow(dot(N, H), factor));
            vec3 diffuseComponent = diffuse*NdotL;
            vec3 specularComponent = specular*NdotHtoF;
            float r = ambient[0] + diffuseComponent[0] + specularComponent[0];
            float g = ambient[1] + diffuseComponent[1] + specularComponent[1];
            float b = ambient[2] + diffuseComponent[2] + specularComponent[2];
            gl_FragColor = vec4(vec3(r,g,b),1.0);
        }
    `;
    
    // define vertex shader in essl using es6 template strings
    var vShaderCode = `
        precision mediump float;

        varying vec3 vertexPoint;
        varying vec3 vertexColor;
        varying vec3 fragementColor;
        varying vec3 vertexNormal;
        varying vec3 ambient;
        varying vec3 diffuse;
        varying vec3 specular;
        varying float factor;

        attribute vec3 vertexPos;
        attribute vec3 vertexCol;
        attribute vec3 fragementCol;
        attribute vec3 vertexNorm;
        attribute vec3 amb;
        attribute vec3 diff;
        attribute vec3 spec;
        attribute float f;
        attribute float curr_model;

        uniform mat4 viewShaderMat;
        uniform mat4 projShaderMat;
        uniform mat4 transform_mat;
        uniform float current_selected_model;

        void main(void) {
            vertexPoint = vertexPos;
            vertexColor = vertexCol;
            fragementColor = fragementCol;
            vertexNormal = vertexNorm;
            ambient = amb;
            diffuse = diff;
            specular = spec;
            factor = f;

            mat4 transform;

            if(curr_model == current_selected_model){
                transform = transform_mat;
            }
            else {
                transform = mat4(1,0,0,0,
                                 0,1,0,0,
                                 0,0,1,0,
                                 0,0,0,1);
            }
            gl_Position = projShaderMat * viewShaderMat * transform * vec4(vertexPoint, 1.0);

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
                vertexPointAttrib = // get pointer to vertex shader input
                    gl.getAttribLocation(shaderProgram, "vertexPos"); 
                vertexNormalAttrib = gl.getAttribLocation(shaderProgram, 'vertexNorm');
                ambientAttrib = gl.getAttribLocation(shaderProgram, 'amb');
                diffuseAttrib = gl.getAttribLocation(shaderProgram, 'diff');
                specularAttrib = gl.getAttribLocation(shaderProgram, 'spec');
                factorAttrib = gl.getAttribLocation(shaderProgram, 'f');
                lightVecAttrib = gl.getUniformLocation(shaderProgram, 'lightVec');
                eyePositionAttrib = gl.getUniformLocation(shaderProgram, 'eyePosition');
                modelMapperAttrib = gl.getAttribLocation(shaderProgram, 'curr_model');

                gl.enableVertexAttribArray(vertexPointAttrib); // input to shader from array
                gl.enableVertexAttribArray(vertexNormalAttrib);
                gl.enableVertexAttribArray(ambientAttrib);
                gl.enableVertexAttribArray(diffuseAttrib);
                gl.enableVertexAttribArray(specularAttrib);
                gl.enableVertexAttribArray(factorAttrib);
                gl.uniform3fv(lightVecAttrib, light);
                gl.uniform3fv(eyePositionAttrib, eye);
                gl.enableVertexAttribArray(modelMapperAttrib);

                altPositionUniform = // get pointer to altPosition flag
                    gl.getUniformLocation(shaderProgram, "altPosition");

                viewMat = gl.getUniformLocation(shaderProgram, 'viewShaderMat');
                projMat = gl.getUniformLocation(shaderProgram, 'projShaderMat');
                shader_transformation_matrix = gl.getUniformLocation(shaderProgram, 'transform_mat');
                shader_selected_model = gl.getUniformLocation(shaderProgram, 'current_selected_model');

            } // end if no shader program link errors
        } // end if no compile errors
    } // end try 
    catch(e) {
        console.log(e);
    } // end catch
    altPosition = false;
    setTimeout(function alterPosition() {
        altPosition = !altPosition;
        setTimeout(alterPosition, 2000);
    }, 2000); // switch flag value every 2 seconds
} // end setup shaders
var bgColor = 0;

// render the loaded model
function renderTriangles() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); // clear frame/depth buffers
    //bgColor = (bgColor < 1) ? (bgColor + 0.001) : 0;
    gl.clearColor(bgColor, 0, 0, 1.0);
    requestAnimationFrame(renderTriangles);
    renderTransformedInput();
    magnifyModel();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer); // activate
    gl.vertexAttribPointer(vertexPointAttrib,3,gl.FLOAT,false,3 * Float32Array.BYTES_PER_ELEMENT,0); // feed
    gl.bindBuffer(gl.ARRAY_BUFFER, normals_Buffer); // activate
    gl.vertexAttribPointer(vertexNormalAttrib,3,gl.FLOAT,false,3 * Float32Array.BYTES_PER_ELEMENT,0);
    gl.bindBuffer(gl.ARRAY_BUFFER, ambient_Buffer); // activate
    gl.vertexAttribPointer(ambientAttrib,3,gl.FLOAT,false,3 * Float32Array.BYTES_PER_ELEMENT,0);
    gl.bindBuffer(gl.ARRAY_BUFFER, diffuse_Buffer); // activate
    gl.vertexAttribPointer(diffuseAttrib,3,gl.FLOAT,false,3 * Float32Array.BYTES_PER_ELEMENT,0);
    gl.bindBuffer(gl.ARRAY_BUFFER, specular_Buffer); // activate
    gl.vertexAttribPointer(specularAttrib,3,gl.FLOAT,false,3 * Float32Array.BYTES_PER_ELEMENT,0);
    gl.bindBuffer(gl.ARRAY_BUFFER, n_Buffer); // activate
    gl.vertexAttribPointer(factorAttrib,1,gl.FLOAT,false,1 * Float32Array.BYTES_PER_ELEMENT,0);
    gl.uniform1i(altPositionUniform, altPosition); // feed
    gl.bindBuffer(gl.ARRAY_BUFFER, modelMapper_Buffer); // activate
    gl.vertexAttribPointer(modelMapperAttrib,1,gl.FLOAT,false,1 * Float32Array.BYTES_PER_ELEMENT,0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,Index_Buffer);
    gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT,0);
} // end render triangles

function processKeyEvent(event){
  console.log(event.key);
  var currCenter = modelCenters[curr_selected_model];
  if(event.key == "A"){          
    vec3.rotateY(lookAt, lookAt, [0, 0, 0], glMatrix.toRadian(1));
  }
  else if(event.key == "D"){             
    vec3.rotateY(lookAt, lookAt, [0, 0, 0], -glMatrix.toRadian(1));
  }
  else if(event.key == "W"){            
    vec3.rotateX(lookAt, lookAt, [0, 0, 0], glMatrix.toRadian(1));
    vec3.rotateX(up, up, [0, 0, 0], glMatrix.toRadian(1));
  }
  else if(event.key == "S"){            
    vec3.rotateX(lookAt, lookAt, [0, 0, 0], -glMatrix.toRadian(1));
    vec3.rotateX(up, up, [0, 0, 0], -glMatrix.toRadian(1));
  }
  else if(event.key == "a"){             
    vec3.add(eye, eye, [0.05, 0, 0]);
  }
  else if(event.key == "d"){            
    vec3.add(eye, eye, [-0.05, 0, 0]);
  }
  else if(event.key == "w"){            
    vec3.add(eye, eye, [0, 0, 0.05]);
  }
  else if(event.key == "s"){            
    vec3.add(eye, eye, [0, 0, -0.05]);
  }
  else if(event.key == "q"){             
    vec3.add(eye, eye, [0, 0.05, 0]);
  }
  else if(event.key == "e"){             
    vec3.add(eye, eye, [0, -0.05, 0]);
  }
  else if(event.key == "ArrowLeft"){
    interactive_transform_flag = false;
    selectFlag = true;
    if (curr_selected_model == 0.0){
        curr_selected_model = n_figures-1;
    }
    else{
        curr_selected_model = curr_selected_model-1;
    }
  }
  else if(event.key == "ArrowRight"){
    interactive_transform_flag = false;
    selectFlag = true;
    if (curr_selected_model == n_figures-1){
        curr_selected_model = 0.0;
    }
    else{
        curr_selected_model = curr_selected_model+1;
    }
  }
  else if(event.key == " "){
    selectFlag = false;
  }

  else if(event.key == "k"){   
    mat4.translate(transformation_matrix, transformation_matrix, [0.05, 0, 0]);
    interactive_transform_flag = true;
  }
  else if(event.key == ";"){              
    mat4.translate(transformation_matrix, transformation_matrix, [-0.05, 0, 0]);
    interactive_transform_flag = true;
  }
  else if(event.key == "o"){              
    mat4.translate(transformation_matrix, transformation_matrix, [0, 0, 0.05]);
    interactive_transform_flag = true;
  }
  else if(event.key == "l"){              
    mat4.translate(transformation_matrix, transformation_matrix, [0, 0, -0.05]);
    interactive_transform_flag = true;
  }
  else if(event.key == "i"){              
    mat4.translate(transformation_matrix, transformation_matrix, [0, 0.05, 0]);
    interactive_transform_flag = true;
  }
  else if(event.key == "p"){              
    mat4.translate(transformation_matrix, transformation_matrix, [0, -0.05, 0]);
    interactive_transform_flag = true;
  }
  else if(event.key == "K"){  
    if(selectFlag){ 
    mat4.translate(transformation_matrix, transformation_matrix, currCenter);
    mat4.rotateY(transformation_matrix, transformation_matrix, 0.05);
    mat4.translate(transformation_matrix, transformation_matrix, [-currCenter[0], -currCenter[1], -currCenter[2]]);
    interactive_transform_flag = true;
    }
  }
  else if(event.key == ":"){ 
    if(selectFlag){   
    mat4.translate(transformation_matrix, transformation_matrix, currCenter);                              
    mat4.rotateY(transformation_matrix, transformation_matrix, -0.05);
    mat4.translate(transformation_matrix, transformation_matrix, [-currCenter[0], -currCenter[1], -currCenter[2]]);
    interactive_transform_flag = true;
    }
  }
  else if(event.key == "O"){
    if(selectFlag){ 
    mat4.translate(transformation_matrix, transformation_matrix, currCenter);                                  
    mat4.rotateX(transformation_matrix, transformation_matrix, 0.05);
    mat4.translate(transformation_matrix, transformation_matrix, [-currCenter[0], -currCenter[1], -currCenter[2]]);
    interactive_transform_flag = true;
    }
  }
  else if(event.key == "L"){ 
    if(selectFlag){ 
    mat4.translate(transformation_matrix, transformation_matrix, currCenter);                                  
    mat4.rotateX(transformation_matrix, transformation_matrix, -0.05);
    mat4.translate(transformation_matrix, transformation_matrix, [-currCenter[0], -currCenter[1], -currCenter[2]]);
    interactive_transform_flag = true;
    }
  }
  else if(event.key == "I"){  
    if(selectFlag){   
    mat4.translate(transformation_matrix, transformation_matrix, currCenter);                               
    mat4.rotateZ(transformation_matrix, transformation_matrix, 0.05);
    mat4.translate(transformation_matrix, transformation_matrix, [-currCenter[0], -currCenter[1], -currCenter[2]]);
    interactive_transform_flag = true;
    }
  }
  else if(event.key == "P"){  
    if(selectFlag){ 
    mat4.translate(transformation_matrix, transformation_matrix, currCenter);                                 
    mat4.rotateZ(transformation_matrix, transformation_matrix, -0.05);
    mat4.translate(transformation_matrix, transformation_matrix, [-currCenter[0], -currCenter[1], -currCenter[2]]);
    interactive_transform_flag = true;
    }
  }
  else if(event.key == "<"){
    projection_flag_default = true;
  }
  else if(event.key == "="){
    projection_flag_default = false;
  }
  else{
    console.log("INVALID INPUT");
  }
}

function magnifyModel(){
    if(interactive_transform_flag){
        gl.uniformMatrix4fv(shader_transformation_matrix, gl.FALSE, transformation_matrix);
        gl.uniform1f(shader_selected_model, curr_selected_model);  
        return;
    }
    var currCenter = modelCenters[curr_selected_model];
    center_translate = [-currCenter[0], -currCenter[1], -currCenter[2]];
    scale_vec = [1.2, 1.2, 1.2];
    mat4.identity(transformation_matrix);
    if(selectFlag){
        mat4.translate(transformation_matrix, transformation_matrix, currCenter);
        mat4.scale(transformation_matrix, transformation_matrix, scale_vec);
        mat4.translate(transformation_matrix, transformation_matrix, center_translate);
    }
    gl.uniformMatrix4fv(shader_transformation_matrix, gl.FALSE, transformation_matrix);
    gl.uniform1f(shader_selected_model, curr_selected_model);   
}

function main(){
  setupWebGL(); // set up the webGL environment
  loadTriangles(); // load in the triangles from tri file
  setupShaders(); // setup the webGL shaders
  renderTriangles(); // draw the triangles using webGL
  document.onkeydown = processKeyEvent;  
} // end main

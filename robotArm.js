"use strict";

var canvas, gl, program;

var NumVertices = 36; //(6 faces)(2 triangles/face)(3 vertices/triangle)

// Lokasi uniform untuk variabel pencahayaan
var ambientProductLoc, diffuseProductLoc, specularProductLoc, lightPositionLoc;

// Properti pencahayaan
var ambientProduct, diffuseProduct, specularProduct, lightPosition;

var rotating = false;
var rotationSpeed = 1;

var points = [];
var colors = [];

var vertices = [
    vec4( -0.5, -0.5,  0.5, 1.0 ),
    vec4( -0.5,  0.5,  0.5, 1.0 ),
    vec4(  0.5,  0.5,  0.5, 1.0 ),
    vec4(  0.5, -0.5,  0.5, 1.0 ),
    vec4( -0.5, -0.5, -0.5, 1.0 ),
    vec4( -0.5,  0.5, -0.5, 1.0 ),
    vec4(  0.5,  0.5, -0.5, 1.0 ),
    vec4(  0.5, -0.5, -0.5, 1.0 )
];

// RGBA colors
var vertexColors = [
    vec4( 0.0, 0.0, 0.0, 1.0 ),  // black
    vec4( 1.0, 1.0, 0.0, 1.0 ),  // yellow
    vec4( 1.0, 1.0, 0.0, 1.0 ),  // yellow
    vec4( 1.0, 1.0, 0.0, 1.0 ),  // yellow
    vec4( 1.0, 1.0, 0.0, 1.0 ),  // yellow
    vec4( 1.0, 1.0, 0.0, 1.0 ),  // yellow
    vec4( 0.0, 1.0, 1.0, 0.5 ),  // cyan
    vec4( 1.0, 1.0, 0.0, 1.0 )   // yellow
];


// Parameters controlling the size of the Robot's arm

var BASE_HEIGHT      = 2.0;
var BASE_WIDTH       = 4.0;
var LOWER_ARM_HEIGHT = 4.0;
var LOWER_ARM_WIDTH  = 0.5;
var UPPER_ARM_HEIGHT = 3.0;
var UPPER_ARM_WIDTH  = 0.5;

var COCKPIT_WIDTH = 1.5;
var COCKPIT_HEIGHT = 2.5;
var COCKPIT_DEPTH = 1.5;


var TRACK1_WIDTH = 6.0;
var TRACK1_HEIGHT = 0.85;
var TRACK1_DEPTH = 1.0;

var TRACK2_WIDTH = 6.0;
var TRACK2_HEIGHT = 0.85;
var TRACK2_DEPTH = 1.0;

var BUCKET_WIDTH = 2.0;
var BUCKET_HEIGHT = 2.0;
var BUCKET_DEPTH = 2.0;

// Shader transformation matrices
var modelViewMatrix, projectionMatrix;

// Array of rotation angles (in degrees) for each rotation axis

var Base = 0;
var LowerArm = 1;
var UpperArm = 2;
var track = 3;
var Bucket = 4;


var theta= [ 0, -60, 90];

var angle = 0;

var modelViewMatrixLoc;

var vBuffer, cBuffer;

init();

//----------------------------------------------------------------------------

function quad(  a,  b,  c,  d ) {
    colors.push(vertexColors[a]);
    points.push(vertices[a]);
    colors.push(vertexColors[a]);
    points.push(vertices[b]);
    colors.push(vertexColors[a]);
    points.push(vertices[c]);
    colors.push(vertexColors[a]);
    points.push(vertices[a]);
    colors.push(vertexColors[a]);
    points.push(vertices[c]);
    colors.push(vertexColors[a]);
    points.push(vertices[d]);
}


function colorCube() {
    quad( 1, 0, 3, 2 );
    quad( 2, 3, 7, 6 );
    quad( 3, 0, 4, 7 );
    quad( 6, 5, 1, 2 );
    quad( 4, 5, 6, 7 );
    quad( 5, 4, 0, 1 );
}


//--------------------------------------------------


function init() {

    canvas = document.getElementById( "gl-canvas" );

    gl = canvas.getContext('webgl2');
    if (!gl) { alert( "WebGL 2.0 isn't available" ); }

    gl.viewport( 0, 0, canvas.width, canvas.height );

    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );
    gl.enable( gl.DEPTH_TEST );

    //
    //  Load shaders and initialize attribute buffers
    //
    program = initShaders( gl, "vertex-shader", "fragment-shader" );

    gl.useProgram( program );

    colorCube();

    // Load shaders and use the resulting shader program

    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    // Create and initialize  buffer objects

    vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );

    var positionLoc = gl.getAttribLocation( program, "aPosition" );
    gl.vertexAttribPointer( positionLoc, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( positionLoc );

    cBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW );

    var colorLoc = gl.getAttribLocation( program, "aColor" );
    gl.vertexAttribPointer( colorLoc, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( colorLoc );

    document.getElementById("slider1").onchange = function(event) {
        theta[0] = event.target.value;
    };
    document.getElementById("slider2").onchange = function(event) {
         theta[1] = event.target.value;
    };
    document.getElementById("slider3").onchange = function(event) {
         theta[2] =  event.target.value;
    };
    document.getElementById("slider4").onchange = function(event) {
         theta[3] =  event.target.value;
    };
   document.getElementById("slider5").onchange = function(event) {
        theta[4] =  event.target.value;
    };
   document.getElementById("rotateButton").onclick = function() {
    if (rotating) {
        stopRotation(); 
        this.innerHTML = "Start Rotation"; 
    } else {
        startRotation(); 
        this.innerHTML = "Stop Rotation"; 
    }
    };  
    modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");

    projectionMatrix = ortho(-10, 10, -10, 10, -10, 10);
    gl.uniformMatrix4fv( gl.getUniformLocation(program, "projectionMatrix"),  false, flatten(projectionMatrix) );

    //lighting

    // Inisialisasi nilai pencahayaan
    ambientProduct = mult(vec3(0.6, 0.2, 0.0), vec3(1.0, 1.0, 1.0));
    diffuseProduct = mult(vec3(0.6, 0.3, 0.0), vec3(1.0, 1.0, 1.0));
    specularProduct = mult(vec3(0.6, 0.3, 0.0), vec3(1.0, 1.0, 1.0));
    lightPosition = vec4(1.0, 1.0, 1.0, 0.0);

    // Dapatkan lokasi uniform untuk variabel pencahayaan
    ambientProductLoc = gl.getUniformLocation(program, "ambientProduct");
    diffuseProductLoc = gl.getUniformLocation(program, "diffuseProduct");
    specularProductLoc = gl.getUniformLocation(program, "specularProduct");
    lightPositionLoc = gl.getUniformLocation(program, "lightPosition");

    render();
}

//----------------------------------------------------------------------------

function track1() {  // Renamed function
    var s = scale(TRACK1_WIDTH, TRACK1_HEIGHT, TRACK1_DEPTH);
    var instanceMatrix = mult(translate(0.0, TRACK1_HEIGHT - 1.0, TRACK1_DEPTH + 0.8), s);

    var t = mult(modelViewMatrix, instanceMatrix);
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(t));
    gl.drawArrays(gl.TRIANGLES, 0, NumVertices);
}

function track2() {  // Renamed function
    var s = scale(TRACK2_WIDTH, TRACK2_HEIGHT, TRACK2_DEPTH);
    var instanceMatrix = mult(translate(0.0, TRACK2_HEIGHT - 1.0, -TRACK2_DEPTH - 0.8), s);

    var t = mult(modelViewMatrix, instanceMatrix);
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(t));
    gl.drawArrays(gl.TRIANGLES, 0, NumVertices);
}

//----------------------------------------------------------------------------

function base() {
    var s = scale(BASE_WIDTH, BASE_HEIGHT, BASE_WIDTH);
    //console.log("s", s);
    var instanceMatrix = mult( translate( 0.0, 0.5 * BASE_HEIGHT, 0.0 ), s);
    //var instanceMatrix = mult(s,  translate( 0.0, 0.5 * BASE_HEIGHT, 0.0 ));

    //console.log("instanceMatrix", instanceMatrix);

    var t = mult(modelViewMatrix, instanceMatrix);
    gl.uniformMatrix4fv(modelViewMatrixLoc,  false, flatten(t)  );
    gl.drawArrays( gl.TRIANGLES, 0, NumVertices );

    //console.log("base", t);
}

//----------------------------------------------------------------------------


function upperArm() {
    var s = scale(UPPER_ARM_WIDTH, UPPER_ARM_HEIGHT, UPPER_ARM_WIDTH);
    //console.log("s", s);

    var instanceMatrix = mult(translate( 0.0, 0.5 * UPPER_ARM_HEIGHT, 0.0 ),s);
    //var instanceMatrix = mult(s, translate(  0.0, 0.5 * UPPER_ARM_HEIGHT, 0.0 ));

    //console.log("instanceMatrix", instanceMatrix);

    var t = mult(modelViewMatrix, instanceMatrix);

    //console.log("upper arm mv", modelViewMatrix);

    gl.uniformMatrix4fv( modelViewMatrixLoc,  false, flatten(t)  );
    gl.drawArrays( gl.TRIANGLES, 0, NumVertices );

    //console.log("upper arm t", t);

}

//----------------------------------------------------------------------------


function lowerArm()
{
    var s = scale(LOWER_ARM_WIDTH, LOWER_ARM_HEIGHT, LOWER_ARM_WIDTH);
    var instanceMatrix = mult( translate( 0.0, 0.5 * LOWER_ARM_HEIGHT, 0.0 ), s);


    var t = mult(modelViewMatrix, instanceMatrix);
    gl.uniformMatrix4fv( modelViewMatrixLoc,  false, flatten(t)   );
    gl.drawArrays( gl.TRIANGLES, 0, NumVertices );

}

//----------------------------------------------------------------------------

function cockpit() {  // Renamed function
    var s = scale(COCKPIT_WIDTH, COCKPIT_HEIGHT, COCKPIT_DEPTH);
    var instanceMatrix = mult(translate(-BASE_WIDTH /4 + 2.7, COCKPIT_HEIGHT, COCKPIT_DEPTH - 0.8), s);

    var t = mult(modelViewMatrix, instanceMatrix);
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(t));
    gl.drawArrays(gl.TRIANGLES, 0, NumVertices);
}

//----------------------------------------------------------------------------

function bucket() {
    var s = scale(BUCKET_WIDTH, BUCKET_HEIGHT, BUCKET_DEPTH);
    var instanceMatrix = mult(translate(0.0, 0.5 * UPPER_ARM_HEIGHT , 0.0), s); 
    
    var t = mult(modelViewMatrix, instanceMatrix);
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(t));
    gl.drawArrays(gl.TRIANGLES, 0, NumVertices);
}

//----------------------------------------------------------------------------

function startRotation() {
    rotating = true;
    rotateArm();
}

function stopRotation() {
    rotating = false;
}

function rotateArm() {
    if (rotating) {
        theta[Base] += rotationSpeed;

        if (theta[Base] > 180) theta[Base] = -180;
        render();
        setTimeout(rotateArm, 8);
    }
}

function render() {

    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );

    gl.uniform3fv(ambientProductLoc, flatten(ambientProduct));
    gl.uniform3fv(diffuseProductLoc, flatten(diffuseProduct));
    gl.uniform3fv(specularProductLoc, flatten(specularProduct));
    gl.uniform4fv(lightPositionLoc, flatten(lightPosition));

    gl.drawArrays(gl.TRIANGLES, 0, NumVertices);

    modelViewMatrix = rotate(theta[Base], vec3(0, 1, 0 ));
    track1();
    track2();
    base();
    cockpit();

    modelViewMatrix = mult(modelViewMatrix, translate(BASE_WIDTH / 2, BASE_HEIGHT / 2, -1.0));  // Side of base
    modelViewMatrix = mult(modelViewMatrix, rotate(90, vec3(0, 0, 1)));            // Initial 90-degree rotation around Z
    modelViewMatrix = mult(modelViewMatrix, rotate(theta[LowerArm], vec3(0, 0, 1))); // Lower arm rotation around Z
    lowerArm();

    printm( translate(0.0, BASE_HEIGHT, 0.0));
    printm(modelViewMatrix);

    modelViewMatrix = mult(modelViewMatrix, translate(0.0, LOWER_ARM_HEIGHT , 0.0)); // Translate in x and y direction
    modelViewMatrix = mult(modelViewMatrix, rotate(theta[UpperArm], vec3(0, 0, 1)));
    upperArm();

    modelViewMatrix = mult(modelViewMatrix, translate(0.0, UPPER_ARM_HEIGHT , 0.0));       // Translate to the end of the lower arm
    modelViewMatrix = mult(modelViewMatrix, rotate(theta[Bucket], vec3(0, 0, 1)));  // Rotate with the lower arm
    bucket();

//printm(modelViewMatrix);

    requestAnimationFrame(render);
}

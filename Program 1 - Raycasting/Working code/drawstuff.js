class Color {
    
        // Color constructor default opaque black
    constructor(r=0,g=0,b=0,a=255) {
        try {
            if ((typeof(r) !== "number") || (typeof(g) !== "number") || (typeof(b) !== "number") || (typeof(a) !== "number"))
                throw "color component not a number";
            else if ((r<0) || (g<0) || (b<0) || (a<0)) 
                throw "color component less than 0";
            else if ((r>255) || (g>255) || (b>255) || (a>255)) 
                throw "color component bigger than 255";
            else {
                this.r = r; this.g = g; this.b = b; this.a = a; 
            }
        } // end try
        
        catch (e) {
            console.log(e);
        }
    } // end Color constructor

        // Color change method
    change(r,g,b,a) {
        try {
            if ((typeof(r) !== "number") || (typeof(g) !== "number") || (typeof(b) !== "number") || (typeof(a) !== "number"))
                throw "color component not a number";
            else if ((r<0) || (g<0) || (b<0) || (a<0)) 
                throw "color component less than 0";
            else if ((r>255) || (g>255) || (b>255) || (a>255)) 
                throw "color component bigger than 255";
            else {
                this.r = r; this.g = g; this.b = b; this.a = a; 
                return(this);
            }
        } // end throw
        
        catch (e) {
            console.log(e);
        }
    } // end Color change method
    
        // Color add method
    add(c) {
        try {
            if (!(c instanceof Color))
                throw "Color.add: non-color parameter";
            else {
                this.r += c.r; this.g += c.g; this.b += c.b; this.a += c.a;
                return(this);
            }
        } // end try
        
        catch(e) {
            console.log(e);
        }
    } // end color add
    
        // Color subtract method
    subtract(c) {
        try {
            if (!(c instanceof Color))
                throw "Color.subtract: non-color parameter";
            else {
                this.r -= c.r; this.g -= c.g; this.b -= c.b; this.a -= c.a;
                return(this);
            }
        } // end try
        
        catch(e) {
            console.log(e);
        }
    } // end color subgtract
    
        // Color scale method
    scale(s) {
        try {
            if (typeof(s) !== "number")
                throw "scale factor not a number";
            else {
                this.r *= s; this.g *= s; this.b *= s; this.a *= s; 
                return(this);
            }
        } // end throw
        
        catch (e) {
            console.log(e);
        }
    } // end Color scale method
    
        // Color copy method
    copy(c) {
        try {
            if (!(c instanceof Color))
                throw "Color.copy: non-color parameter";
            else {
                this.r = c.r; this.g = c.g; this.b = c.b; this.a = c.a;
                return(this);
            }
        } // end try
        
        catch(e) {
            console.log(e);
        }
    } // end Color copy method
    
        // Color clone method
    clone() {
        var newColor = new Color();
        newColor.copy(this);
        return(newColor);
    } // end Color clone method
    
        // Send color to console
    toConsole() {
        console.log("rgba: "+ this.r +" "+ this.g +" "+ this.b +" "+ this.a);
    }  // end Color toConsole
    
} // end color class

// Vector class
class Vector { 
    constructor(x=0,y=0,z=0) {
        this.set(x,y,z);
    } // end constructor
    
    // sets the components of a vector
    set(x,y,z) {
        try {
            if ((typeof(x) !== "number") || (typeof(y) !== "number") || (typeof(z) !== "number"))
                throw "vector component not a number";
            else
                this.x = x; this.y = y; this.z = z; 
        } // end try
        
        catch(e) {
            console.log(e);
        }
    } // end vector set
    
    // copy the passed vector into this one
    copy(v) {
        try {
            if (!(v instanceof Vector))
                throw "Vector.copy: non-vector parameter";
            else
                this.x = v.x; this.y = v.y; this.z = v.z;
        } // end try
        
        catch(e) {
            console.log(e);
        }
    }
    
    toConsole(prefix) {
        console.log(prefix+"["+this.x+","+this.y+","+this.z+"]");
    } // end to console
    
    // static dot method
    static dot(v1,v2) {
        try {
            if (!(v1 instanceof Vector) || !(v2 instanceof Vector))
                throw "Vector.dot: non-vector parameter";
            else
                return(v1.x*v2.x + v1.y*v2.y + v1.z*v2.z);
        } // end try
        
        catch(e) {
            console.log(e);
            return(NaN);
        }
    } // end dot static method
    
    // static add method
    static add(v1,v2) {
        try {
            if (!(v1 instanceof Vector) || !(v2 instanceof Vector))
                throw "Vector.add: non-vector parameter";
            else
                return(new Vector(v1.x+v2.x,v1.y+v2.y,v1.z+v2.z));
        } // end try
        
        catch(e) {
            console.log(e);
            return(new Vector(NaN,NaN,NaN));
        }
    } // end add static method

    // static subtract method, v1-v2
    static subtract(v1,v2) {
        try {
            if (!(v1 instanceof Vector) || !(v2 instanceof Vector))
                throw "Vector.subtract: non-vector parameter";
            else {
                var v = new Vector(v1.x-v2.x,v1.y-v2.y,v1.z-v2.z);
                //v.toConsole("Vector.subtract: ");
                return(v);
            }
        } // end try
        
        catch(e) {
            console.log(e);
            return(new Vector(NaN,NaN,NaN));
        }
    } // end subtract static method

    // static scale method
    static scale(c,v) {
        try {
            if (!(typeof(c) === "number") || !(v instanceof Vector))
                throw "Vector.scale: malformed parameter";
            else
                return(new Vector(c*v.x,c*v.y,c*v.z));
        } // end try
        
        catch(e) {
            console.log(e);
            return(new Vector(NaN,NaN,NaN));
        }
    } // end scale static method
    
    // static normalize method
    static normalize(v) {
        try {
            if (!(v instanceof Vector))
                throw "Vector.normalize: parameter not a vector";
            else {
                var lenDenom = 1/Math.sqrt(Vector.dot(v,v));
                return(Vector.scale(lenDenom,v));
            }
        } // end try
        
        catch(e) {
            console.log(e);
            return(new Vector(NaN,NaN,NaN));
        }
    } // end scale static method
    
} // end Vector class

/* utility functions */

// deep object copy with (proto)types too
function deepCopy(anInstance) {
    var incOut = Object.create(anInstance); // copy prototype and properties
  
    // copy values, or recurse as needed to copy objects in the object
    for (var incKey in incOut)
        if (typeof(incOut[incKey]) == "object")
            incOut[incKey] = deepCopy(incOut[incKey]);
        else
            incOut[incKey] = anInstance[incKey];
    
    return(incOut);
} // end deep copy

function getInputBoxes() {
    const INPUT_BOXES_URL = "https://ncsucgclass.github.io/prog1/boxes.json";
        
    // load the boxes file
    var httpReq = new XMLHttpRequest(); // a new http request
    httpReq.open("GET",INPUT_BOXES_URL,false); // init the request
    httpReq.send(null); // send the request
    var startTime = Date.now();
    while ((httpReq.status !== 200) && (httpReq.readyState !== XMLHttpRequest.DONE)) {
        if ((Date.now()-startTime) > 3000)
            break;
    } // until its loaded or we time out after three seconds
    if ((httpReq.status !== 200) || (httpReq.readyState !== XMLHttpRequest.DONE)) {
        console.log*("Unable to open input boxes file!");
        return String.null;
    } else
        return JSON.parse(httpReq.response); 
} // end get input boxes

/* app functions */

// draw a pixel at x,y using color
function drawPixel(imagedata,x,y,color) {
    try {
        if ((typeof(x) !== "number") || (typeof(y) !== "number"))
            throw "drawpixel location not a number";
        else if ((x<0) || (y<0) || (x>=imagedata.width) || (y>=imagedata.height))
            throw "drawpixel location outside of image";
        else if (color instanceof Color) {
            var pixelindex = (y*imagedata.width + x) * 4;
            imagedata.data[pixelindex] = color.r;
            imagedata.data[pixelindex+1] = color.g;
            imagedata.data[pixelindex+2] = color.b;
            imagedata.data[pixelindex+3] = color.a;
        } else 
            throw "drawpixel color is not a Color";
    } // end try
    
    catch(e) {
        console.log(e);
    }
} // end drawPixel

function calculateColor(point, N, material, light, eyePos){
    
    var L = Vector.normalize(Vector.subtract(light, point));  
         
    var V = Vector.normalize(Vector.subtract(eyePos, point));   

    var NdotL = Vector.dot(N, L);               

    var R = Vector.normalize(Vector.subtract(Vector.scale(2*NdotL, N), L));

    var RdotVtoN = Math.pow(Vector.dot(R,V),material.n);
                
    
    var r = Math.max(0,material.ambient[0]) + Math.max(0,material.diffuse[0]*NdotL) + Math.max(0,material.specular[0]*RdotVtoN);
    var g = Math.max(0,material.ambient[1]) + Math.max(0,material.diffuse[1]*NdotL) + Math.max(0,material.specular[1]*RdotVtoN);
    var b = Math.max(0,material.ambient[2]) + Math.max(0,material.diffuse[2]*NdotL) + Math.max(0,material.specular[2]*RdotVtoN);
    // var r = Math.max(0, material.ambient[0]*light.ambient) + 
    // Math.max(0, material.diffuse[0]*light.diffuse*NdotL) + 
    // Math.max(0, material.specular[0]*light.specular*NdotHeN);

    // var g = Math.max(0, material.ambient[1]*light.ambient) + 
    // Math.max(0, material.diffuse[1]*light.diffuse*NdotL) + 
    // Math.max(0, material.specular[1]*light.specular*NdotHeN);

    // var b = Math.max(0, material.ambient[2]*light.ambient) + 
    // Math.max(0, material.diffuse[2]*light.diffuse*NdotL) + 
    // Math.max(0, material.specular[2]*light.specular*NdotHeN);


    return new Color(r*255, g*255, b*255, 255);
    
}

function main() {
    // Get the canvas, context, and image data
    var canvas = document.getElementById("viewport"); 
    var context = canvas.getContext("2d");
    var w = context.canvas.width; // as set in html
    var h = context.canvas.height;  // as set in html
    var imagedata = context.createImageData(w,h);
    
    var bgColor = new Color(1, 0, 0, 255);

    var eye = new Vector(0.5, 0.5, -0.5);
    var up = new Vector(0, 1, 0);
    var lookAt = new Vector(0, 0, 1);

    var corners = {ul : new Vector(0,1,0), ur : new Vector(1,1,0),
                   ll : new Vector(0,0,0), lr : new Vector(1,0,0)}

    var boxes = getInputBoxes();
    console.log(boxes.length);

    normals = {
        lx : new Vector(-1,0,0),
        rx : new Vector(1,0,0),
        by : new Vector(0,-1,0),
        ty : new Vector(0,1,0),
        fz : new Vector(0,0,-1),
        rz : new Vector(0,0,1)
    }

    for (var i=0;i<context.canvas.height;i++){
        for (var j=0;j<context.canvas.width;j++){
            var s = i/context.canvas.height;
            var t = j/context.canvas.width;
            var Pl = Vector.add(corners.ul, Vector.scale(s,Vector.subtract(corners.ll, corners.ul)));
            var Pr = Vector.add(corners.ur, Vector.scale(s,Vector.subtract(corners.lr, corners.ur)));
            var P = Vector.add(Pl, Vector.scale(t,Vector.subtract(Pr, Pl)));
            var ray_direction = Vector.subtract(P, eye);
            var t0 = Number.POSITIVE_INFINITY;
            var t1 = Number.POSITIVE_INFINITY;
            var closest_box = 0;
            var n_global;

            for (var box=0; box<boxes.length; box++){
                var lx = boxes[box].lx;
                var rx = boxes[box].rx;
                var by = boxes[box].by;
                var ty = boxes[box].ty;
                var fz = boxes[box].fz;
                var rz = boxes[box].rz;

                var tlx = (lx - eye.x)/ray_direction.x;
                var trx = (rx - eye.x)/ray_direction.x;
                var tby = (by - eye.y)/ray_direction.y;
                var tty = (ty - eye.y)/ray_direction.y;
                var tfz = (fz - eye.z)/ray_direction.z;
                var trz = (rz - eye.z)/ray_direction.z;

                var nx;
                var ny;
                var nz;
                var n_surface;


                var tx0 = Math.min(tlx,trx);
                if (tlx < trx) {
                    //tx0 = tlx;
                    nx = "lx";
                } 
                else {
                    //tx0 = tlx;
                    nx = "rx";
                }
                var tx1 = Math.max(tlx,trx);
                var ty0 = Math.min(tby,tty);
                if (tby < tty) {
                    //ty0 = tby;
                    ny = "by";
                } 
                else {
                    //ty0 = ttx;
                    ny = "ty";
                }
                var ty1 = Math.max(tby,tty);
                var tz0 = Math.min(tfz,trz);
                if (tfz < trz) {
                    //tz0 = tfz;
                    nz = "fz";
                } 
                else {
                    //ty0 = ttx;
                    nz = "rz";
                }
                var tz1 = Math.max(tfz,trz);

                var t0_tmp = Number.NEGATIVE_INFINITY;
                var t1_tmp = Number.POSITIVE_INFINITY;

                t0_tmp = Math.max(tx0, ty0, tz0);

                if (tx0 > ty0 && tx0 > tz0){
                     n_surface = nx;
                }
                else if (ty0 > tx0 && ty0 > tz0){
                     n_surface = ny;
                }
                else if (tz0 > tx0 && tz0 > ty0){
                     n_surface = nz;
                }

                t1_tmp = Math.min(tx1, ty1, tz1);
                //console.log(t0_tmp + " " + t1_tmp);

                // var intersection = (t0 <= t1);

                if (t0_tmp <= t1_tmp){
                    if (t0_tmp < t0){
                        t0 = t0_tmp;
                        t1 = t1_tmp;
                        closest_box = box;
                        n_global = n_surface;
                    } 
                }


            } 

            if (t0 == Number.POSITIVE_INFINITY){
               drawPixel(imagedata, j, i, new Color(0,0,0,255));
            }
            else {
               point = Vector.add(eye, Vector.scale(t0, ray_direction));
               var r = boxes[closest_box].diffuse[0];
               var g = boxes[closest_box].diffuse[1];
               var b = boxes[closest_box].diffuse[2];
               var color = calculateColor(point, normals[n_global], boxes[closest_box], new Vector(-0.5, 1.5, -0.5), eye);
               drawPixel(imagedata, j, i, color);
            }
        }
    }
    context.putImageData(imagedata, 0 , 0);

} // end main
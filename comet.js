var canvas, ctx;

function init() {
    canvas = document.getElementById("system-xy");
    ctx = canvas.getContext('2d');
}

const G = 6.67430e-11;
var timestep = 100;
var tick = 0;

/* seed algorithm:
Generate a random 7-digit number
1 2 3 4 5 6 7
1st digit is tail color (3 colors)
2nd digit is ion tail color (3 colors)
3,4 is eccentricity + 0.9
5,6,7 is perihelion distance * 1000
*/

const sun = {mass: 1.988435e30, radius: 695700000, atmosphere: 9044100000}; // kg, m, m from center

const tail = ["#fffff5", "#f5f5f0", "#ffffff"];
const ion = [ "#6040e3", "#a8b1ff", "#63a7ff"];

function generateComet(seed) {
    var comet = []; // tail color, ion color, aphelion, perihelion
    if (seed.toString().length == 7) {
        comet.push(tail[Number(seed.toString()[0] % 3)]); // tail
        comet.push(ion[Number(seed.toString()[1]) % 3]); // ion

        comet.push(0.9+0.01*Number(seed.toString()[2])+0.001*Number(seed.toString()[3])); // ecc

        comet.push((100*Number(seed.toString()[4])+10*Number(seed.toString()[5])+Number(seed.toString()[6]))/1000);
        // peri
    }

    console.log(comet);
  
}

function distance(x1,y1,z1,x2,y2,z2) {
	var x = x2-x1;
	var y = y2-y1;
	var z = z2-z1;
	return Math.sqrt(Math.pow(x,2)+Math.pow(y,2)+Math.pow(z,2));
}

function crossproduct(x1,y1,z1,x2,y2,z2) {
	var x,y,z;
	x = y1*z2 - z1*y2;
	y = z1*x2 - x1*z2;
	z = x1*y2 - y1*x2;
	return [x,y,z];
}

function gravParam(obj) {
	var a = objects[obj];
	return G*a.mass;
}

function magnitude(vector) {
	return Math.sqrt(Math.pow(vector[0],2)+Math.pow(vector[1],2)+Math.pow(vector[2],2));
}

function normalize(vector) {
	var d = magnitude(vector);
	return [vector[0]/d, vector[1]/d, vector[2]/d];
}

function arctan2(Ey, Ex)
{
   var u;
   var Pi = 3.14159265358979;


   if (Ex != 0)
   {
      u = Math.atan(Ey / Ex);
      if (Ex < 0) {u = u + Pi}
      if (Ex > 0 && Ey < 0) {u = u + 2 * Pi}
   }
   else
   {
      if (Ey < 0) {u = -Pi / 2}
      if (Ey == 0) {u = 0}
      if (Ey > 0) {u = Pi / 2}
   }
   return u;
}



function plot(comet) {
    // a = comet[3]/(1-comet[2])
    // x = a * (Math.cos(tau) - comet[2]);
    // y = a * Math.sqrt(1-comet[2]*comet[2]) * Math.sin(tau);
}

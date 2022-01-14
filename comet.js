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
1 2 3 4 5 6 7 8 9 10
1st digit is tail color (3 colors)
2nd digit is ion tail color (3 colors)
3,4 is eccentricity + 0.9 if not hyperbolic, otherwise it is eccentricity + 1
5,6,7 is perihelion distance * 1000
8,9,10 is argPe
11 is if it is hyperbolic
*/

const sun = {mass: 1.988435e30, radius: 695700000, atmosphere: 9044100000}; // kg, m, m from center

const tail = ["#fffff5", "#f5f5f0", "#ffffff"];
const ion = [ "#6040e3", "#a8b1ff", "#63a7ff"];

function generateComet(seed) {
    var comet = []; // tail color, ion color, eccentricity, periapsis, eccentric anomaly, argPe
    s = seed.toString().split("");
    if (s.length == 11) {
        comet.push(tail[Number(s[0] % 3)]); // tail
        comet.push(ion[Number(s[1]) % 3]); // ion

        if (s[10]%2 == 0) {
            comet.push(0.9+0.01*Number(s[2])+0.001*Number(s[3])); // ecc
        }
        else if (s[10]%2 == 1) {
            comet.push(1+0.1*Number(s[2])+0.01*Number(s[3])); // ecc
        }

        comet.push((100*Number(s[4])+10*Number(s[5])+Number(s[6]))/500);
        // peri

        if (s[10]%2 == 0) {
            var sma = ((100*Number(s[4])+10*Number(s[5])+Number(s[6]))/500)/(1-(1+0.1*Number(s[2])+0.01*Number(s[3])));
            comet.push(-Math.acos( (-10/sma + 1)/ (0.9+0.1*Number(s[2])+0.01*Number(s[3]))-Math.floor((-10/sma + 1)/ (0.9+0.1*Number(s[2])+0.01*Number(s[3])))));

            //comet.push(-Math.PI/2);
        }
        if (s[10]%2 == 1) {
            // comet.push(-Math.acosh((5+0.1*Number(s[2])+0.01*Number(s[3]))));
            var sma = ((100*Number(s[4])+10*Number(s[5])+Number(s[6]))/500)/(1-(1+0.1*Number(s[2])+0.01*Number(s[3])));
            comet.push(-Math.acosh( (-10/sma + 1)/ (1+0.1*Number(s[2])+0.01*Number(s[3]))));
            // acosh((10/a +1)/ecc)
        }

        comet.push(Math.PI*(2*(100*Number(s[7])+10*Number(s[8])+Number(s[9]))/1000));
    }

    console.log(comet);
  
    return comet;
}

function arctan2(Ey, Ex)
{
   var u;

   if (Ex>0) {
       u = Math.atan(Ey/Ex);
   }
   else if (Ex<0) {
    if (Ey>=0) {u = Math.atan(Ey/Ex) + Math.PI}
    else {u = Math.atan(Ey/Ex) - Math.PI}
   }
   else {
        if (Ey>0) {u = Math.PI/2}
        else if (Ey<0) {u = -Math.PI/2}
        else {u = undefined}
   }
   return u;
}

function magnitude(vector) {
    if (vector.length == 2) {
        return Math.sqrt(Math.pow(vector[0],2)+Math.pow(vector[1],2));
    }
    else if (vector.length == 3) {
        return Math.sqrt(Math.pow(vector[0],2)+Math.pow(vector[1],2)+Math.pow(vector[2],2));
    }
}

function normalize(vector) {
	var d = magnitude(vector);
    if (vector.length == 2) {
        return [vector[0]/d, vector[1]/d];
    }
    else if (vector.length == 3) {
        return [vector[0]/d, vector[1]/d, vector[2]/d];
    }
}

function plot(comet) {
    // tail color, ion color, eccentricity, periapsis, eccentric anomaly

    E = comet[4];

    

    // eccentricty
    ecc = comet[2];

    a = comet[3]/(1-comet[2]);

    if (ecc < 1) {
        b = Math.sqrt(-(comet[3]*(1+comet[2]))/(comet[2]-1) * comet[3]);
    }
    else if (ecc > 1) {
        b = a*Math.sqrt(ecc*ecc-1);
    }

    // console.log([a,b,E,ecc]);

    // true anomaly
    v = 2 * arctan2(Math.sqrt(1+ecc)*Math.sin(E/2), Math.sqrt(1-ecc)*Math.sin(E/2));
    // console.log(v)
    // distance
    if (ecc < 1) {
        d = a*(1-ecc*Math.cos(E));
    }
    else if (ecc > 1) {
        d = a*(ecc*Math.cosh(E)-1);
        d = Math.abs(d); // might break the system
    }
    // coords in orbital frame
    // O = [d*Math.cos(v), d*Math.sin(v), 0];

    // console.log(d);

    argPe=comet[5];
    LAN=0;
    i=0;
    
    if (ecc < 1) {
        coord1 = [a*(Math.cos(E)-ecc),b*Math.sin(E)];
    }
    else if (ecc > 1) {
        coord1 = [a*(Math.cosh(E)-ecc),b*Math.sinh(E)]; // ajioejj ja  wjjofo iajwoelflo aowooeojfo oae
    }

    coord = [coord1[0]*Math.cos(argPe)+coord1[1]*Math.sin(argPe), -coord1[0]*Math.sin(argPe)+coord1[1]*Math.cos(argPe)];

    ctx.fillStyle = '#ffffff';

    ctx.beginPath();

    ctx.arc((canvas.width/2)+coord[0]*zoom, (canvas.height/2)+coord[1]*zoom, 1, 0, Math.PI*2);

    ctx.fill();

    ctx.strokeStyle = comet[1];
    ctx.lineWidth = 2;

    var ionfactor = 100;
    var dropoff = 1/25;

    ctx.beginPath();
    
    ctx.moveTo((canvas.width/2)+coord[0]*zoom, (canvas.height/2)+coord[1]*zoom);
    // center the vector from the sun to the comet at 0,0
    var vector1 = [coord[0]*zoom, coord[1]*zoom];
    // normalize this vector
    var norm1 = normalize(vector1);
    if (d < 2) {
        norm1 = [-0.25*d*ionfactor*norm1[0]+ionfactor*norm1[0], -0.25*d*ionfactor*norm1[1]+ionfactor*norm1[1]]
    }
    else if (d < 5) {
        norm1 = [ionfactor*norm1[0]/d, ionfactor*norm1[1]/d]
    }
    else if (d < 0.2/dropoff+5) {
        norm1 = [dropoff*ionfactor*norm1[0]*(-d+5)+0.2*ionfactor*norm1[0], dropoff*ionfactor*norm1[1]*(-d+5)+0.2*ionfactor*norm1[1]]
    }
    else {
        norm1 = [0,0];
    }
    
    ctx.lineTo((canvas.width/2)+coord[0]*zoom+norm1[0], (canvas.height/2)+coord[1]*zoom+norm1[1]); 
    
    ctx.stroke();

    if (ecc < 1) {
        E += step/d; // default 0.01
    }
    else if (ecc > 1) {
        E += 3.03 * step/d; // default 0.01
    }
    comet[4] = E;

    // console.log(comet);
}

var step = 0.01;

comets = [];

for (let i=0; i<5; i++) {comets.push(generateComet(Math.floor(Math.random()*90000000000)+10000000000));}

// comets.push(generateComet(11011000011));
// comets.push(generateComet(22991000010));
// comets[1][4] = -0.31;

zoom = 20;

function running() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#fff0e9';
    ctx.beginPath();

    ctx.arc(canvas.width/2, canvas.height/2, 5, 0, Math.PI*2);

    ctx.fill();

    for (let i=0; i<comets.length; i++) {
        plot(comets[i]);
    }
}

exe = [setInterval(running, 1)]

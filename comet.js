var canvas, ctx;
var canvas2, ctx2;
var canvas3, ctx3;

function init() {
    canvas = document.getElementById("system-xy");
    ctx = canvas.getContext('2d');

    canvas2 = document.getElementById("system-xz");
    ctx2 = canvas2.getContext('2d');

    canvas3 = document.getElementById("system-yz");
    ctx3 = canvas3.getContext('2d');
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
12,13,14 LAN
15,16,17 inclination
*/

const sun = {mass: 1.988435e30, radius: 695700000, atmosphere: 9044100000}; // kg, m, m from center

const tail = ["#fffff5", "#f5f5f0", "#ffffff"];
const ion = [ "#6040e3", "#a8b1ff", "#63a7ff"];

function generateComet(seed) { // now an array
    var comet = []; // tail color, ion color, eccentricity, periapsis, eccentric anomaly, argPe
    s = seed;
    if (s.length == 17) {
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

        if (s[10]%10 != 0) {
            var sma = ((100*Number(s[4])+10*Number(s[5])+Number(s[6]))/500)/(1-(1+0.1*Number(s[2])+0.01*Number(s[3])));
            comet.push(-Math.acos( (-10/sma + 1)/ (0.9+0.1*Number(s[2])+0.01*Number(s[3]))-Math.floor((-10/sma + 1)/ (0.9+0.1*Number(s[2])+0.01*Number(s[3])))));

            //comet.push(-Math.PI/2);
        }
        else {
            // comet.push(-Math.acosh((5+0.1*Number(s[2])+0.01*Number(s[3]))));
            var sma = ((100*Number(s[4])+10*Number(s[5])+Number(s[6]))/500)/(1-(1+0.1*Number(s[2])+0.01*Number(s[3])));
            comet.push(-Math.acosh( (-10/sma + 1)/ (1+0.1*Number(s[2])+0.01*Number(s[3]))));
            // acosh((10/a +1)/ecc)
        }

        comet.push(Math.PI*(2*(100*Number(s[7])+10*Number(s[8])+Number(s[9]))/1000));

        comet.push(Math.PI*(2*(100*Number(s[11])+10*Number(s[12])+Number(s[13]))/1000));

        comet.push(Math.PI*(2*(100*Number(s[14])+10*Number(s[15])+Number(s[16]))/1000));
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

function sin(x) {
    return Math.sin(x);
}

function cos(x) {
    return Math.cos(x);
}

function plot(comet) {
    // tail color, ion color, eccentricity, periapsis, eccentric anomaly

    var E = comet[4];

    // eccentricty
    var ecc = comet[2];

    if (ecc == 1) {
        ecc = 1.0001;
    }

    var a = comet[3]/(1-comet[2]);

    if (ecc < 1) {
        b = Math.sqrt(-(comet[3]*(1+comet[2]))/(comet[2]-1) * comet[3]);
    }
    else if (ecc > 1) {
        b = a*Math.sqrt(ecc*ecc-1);
    }

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

    var argPe=comet[5];
    var LAN=comet[6];
    var i=comet[7];
    
    var coord1;

    if (ecc < 1) {
        coord1 = [a*(Math.cos(E)-ecc),b*Math.sin(E), 0];
    }
    else if (ecc > 1) {
        coord1 = [a*(Math.cosh(E)-ecc),b*Math.sinh(E), 0];
    }

    // rotate by argument of periapsis?
    // coord = [coord1[0]*Math.cos(argPe)+coord1[1]*Math.sin(argPe), -coord1[0]*Math.sin(argPe)+coord1[1]*Math.cos(argPe)];

    coord = [
        coord1[0] * (cos(argPe)*cos(LAN)-sin(argPe)*cos(i)*sin(LAN)) - coord1[1] * (sin(argPe)*cos(LAN)+cos(argPe)*cos(i)*sin(LAN)),
        coord1[0] * (cos(argPe)*sin(LAN)+sin(argPe)*cos(i)*cos(LAN)) + coord1[1]*(cos(argPe)*cos(i)*cos(LAN)-sin(argPe)*sin(LAN)),
        coord1[0] * (sin(argPe)*sin(i)) + coord1[1] * (cos(argPe)*sin(i))
    ]
    // console.log(coord);

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc((canvas.width/2)+coord[0]*zoom, (canvas.height/2)+coord[1]*zoom, 1, 0, Math.PI*2);
    ctx.fill();


    ctx2.fillStyle = '#ffffff';
    ctx2.beginPath();
    ctx2.arc((canvas2.width/2)+coord[0]*zoom, (canvas2.height/2)+coord[2]*zoom, 1, 0, Math.PI*2);
    ctx2.fill();

    ctx3.fillStyle = '#ffffff';
    ctx3.beginPath();
    ctx3.arc((canvas3.width/2)+coord[1]*zoom, (canvas3.height/2)+coord[2]*zoom, 1, 0, Math.PI*2);
    ctx3.fill();

    ctx.strokeStyle = comet[1];
    ctx.lineWidth = 2;

    var ionfactor = 100;
    var dropoff = 1/25;

    ctx.beginPath();
    
    ctx.moveTo((canvas.width/2)+coord[0]*zoom, (canvas.height/2)+coord[1]*zoom);
    // center the vector from the sun to the comet at 0,0
    var vector1 = [coord[0]*zoom, coord[1]*zoom, coord[2]*zoom];
    // normalize this vector
    var norm1 = normalize(vector1);
    if (d < 2) {
        norm1 = [-0.25*d*ionfactor*norm1[0]+ionfactor*norm1[0], -0.25*d*ionfactor*norm1[1]+ionfactor*norm1[1], -0.25*d*ionfactor*norm1[2]+ionfactor*norm1[2]]
    }
    else if (d < 5) {
        norm1 = [ionfactor*norm1[0]/d, ionfactor*norm1[1]/d, ionfactor*norm1[2]/d]
    }
    else if (d < 0.2/dropoff+5) {
        norm1 = [dropoff*ionfactor*norm1[0]*(-d+5)+0.2*ionfactor*norm1[0], dropoff*ionfactor*norm1[1]*(-d+5)+0.2*ionfactor*norm1[1], dropoff*ionfactor*norm1[2]*(-d+5)+0.2*ionfactor*norm1[2]]
    }
    else {
        norm1 = [0,0,0];
    }
    
    ctx.lineTo((canvas.width/2)+coord[0]*zoom+norm1[0], (canvas.height/2)+coord[1]*zoom+norm1[1]); 
    ctx.stroke();

    ctx2.strokeStyle = comet[1];
    ctx2.lineWidth = 2;

    ctx2.beginPath();
    ctx2.moveTo((canvas2.width/2)+coord[0]*zoom, (canvas2.height/2)+coord[2]*zoom);
    ctx2.lineTo((canvas2.width/2)+coord[0]*zoom+norm1[0], (canvas2.height/2)+coord[2]*zoom+norm1[2]); 
    ctx2.stroke();

    ctx3.strokeStyle = comet[1];
    ctx3.lineWidth = 2;

    ctx3.beginPath();
    ctx3.moveTo((canvas3.width/2)+coord[1]*zoom, (canvas3.height/2)+coord[2]*zoom);
    ctx3.lineTo((canvas3.width/2)+coord[1]*zoom+norm1[1], (canvas3.height/2)+coord[2]*zoom+norm1[2]); 
    ctx3.stroke();

    if (ecc < 1) {
        E += step/d; // default 0.01
    }
    else if (ecc > 1) {
        E += 3.03 * step/d; // default 0.01
    }
    comet[4] = E;

    if (ecc > 1 && d>100) {
        comets.splice(comets.indexOf(comet), 1);
        comets.push(generateComet(makeArr()));
    }

    // console.log(comet);
}

var step = 0.01;

function makeArr() {
    var arr = [];
    for (let i=0; i<17; i++) {
        arr.push(Math.floor(Math.random()*10))
    }
    console.log(arr);
    return arr;
}

comets = [];

// comets.push(generateComet(11011000011));
comets.push(generateComet("22991000000000250".split('')));
comets[0][4] = -0.31;

for (let i=0; i<4; i++) {comets.push(generateComet(makeArr()));}

zoom = 20;

function running() {
    var opacity = 1; // 0.004

    ctx.fillStyle = `rgba(0, 0, 0, ${opacity})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#fff0e9';
    ctx.beginPath();
    ctx.arc(canvas.width/2, canvas.height/2, 5, 0, Math.PI*2);
    ctx.fill();

    ctx2.fillStyle = `rgba(0, 0, 0, ${opacity})`;
    ctx2.fillRect(0, 0, canvas2.width, canvas2.height);

    ctx2.fillStyle = '#fff0e9';
    ctx2.beginPath();
    ctx2.arc(canvas2.width/2, canvas2.height/2, 5, 0, Math.PI*2);
    ctx2.fill();

    ctx3.fillStyle = `rgba(0, 0, 0, ${opacity})`;
    ctx3.fillRect(0, 0, canvas3.width, canvas3.height);

    ctx3.fillStyle = '#fff0e9';
    ctx3.beginPath();
    ctx3.arc(canvas3.width/2, canvas3.height/2, 5, 0, Math.PI*2);
    ctx3.fill();

    for (let i=0; i<comets.length; i++) {
        plot(comets[i]);
    }
}

var exe = [setInterval(running, 1)]

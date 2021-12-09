const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');

const G = 6.67430e-11;
var timestep = 100;
var tick = 0;

/* seed algorithm:
Generate a random 9-digit number
1 2 3 4 5 6 7 8 9

1st digit is tail color (3 colors)
2nd digit is ion tail color (3 colors)
4,5,6 digits are log10 of aphelion (4.56), if 6 it's parabolic if it's more than 7 its hyperbolic
7,8,9 is perihelion distance * 1000
*/

const sun = {mass: 1.988435e30, radius: 695700000, atmosphere: 9044100000} // kg, m, m from center

const tail = ["#fffff5", "#f5f5f0", "#ffffff"]
const ion = [ "#6040e3", "#a8b1ff", "#63a7ff"]

function generateComet(seed) {
    var comet = []; // tail color, ion color, aphelion, perihelion
    if (seed.toString().length == 9) {
        comet.push(tail[Number(seed.toString()[0]]))
        comet.push(ion[Number(seed.toString()[1]]))
        
        // 100 * Number(seed.toString()[1]) + 10 * Number(seed.toString()[2]) + Number(seed.toString()[3]);
    }
  
  
}

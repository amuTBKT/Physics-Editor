function Point(x, y){
	this.x = x || 0;
	this.y = y || 0;
}

// area of triangle abc
function area(a, b, c) {
    return (((b.x - a.x)*(c.y - a.y))-((c.x - a.x)*(b.y - a.y)));
}

// point b is left to line ac
function left(a, b, c) {
    return area(a, b, c) > 0;
}

// point b is left or on the line ac
function leftOn(a, b, c) {
    return area(a, b, c) >= 0;
}

// point b is right to the line ac
function right(a, b, c) {
    return area(a, b, c) < 0;
}

// point b is right or on the line ac
function rightOn(a, b, c) {
    return area(a, b, c) <= 0;
}

// point b is  on the line ac
function collinear(a, b, c) {
    return area(a, b, c) == 0;
}

// squared distance between point a-b
function sqdist(a, b) {
    var dx = b.x - a.x;
    var dy = b.y - a.y;
    return dx * dx + dy * dy;
}

function Line(p1, p2){
	this.first = p1;
	this.second = p2;
}

function eq(a, b) {
    return Math.abs(a - b) <= 1e-8;
}

// return intersecion of two line
function lineInt(l1, l2) {
    var i = new Point();
    var a1, b1, c1, a2, b2, c2, det;
    a1 = l1.second.y - l1.first.y;
    b1 = l1.first.x - l1.second.x;
    c1 = a1 * l1.first.x + b1 * l1.first.y;
    a2 = l2.second.y - l2.first.y;
    b2 = l2.first.x - l2.second.x;
    c2 = a2 * l2.first.x + b2 * l2.first.y;
    det = a1 * b2 - a2 * b1;
    if (!eq(det, 0)) { // lines are not parallel
        i.x = (b2 * c1 - b1 * c2) / det;
        i.y = (a1 * c2 - a2 * c1) / det;
    }
    return i;
};


function Polygon(){
	this.vertices = [];
}

Polygon.prototype.draw = function(context){
	context.strokeStyle = "#fff";
	context.moveTo(this.at(0).x, this.at(0).y);
	for (var i = 0; i < this.size(); i++){
		context.lineTo(this.at(i).x, this.at(i).y);
	}
	context.closePath();
	context.stroke();
};

// vertex at index - i
Polygon.prototype.at = function(i) {
    var s = this.size();
    return this.vertices[i < 0 ? i % s + s : i % s];		// if i < 0 return last vertex, and if i > size return first vertex 
};

// first vertex
Polygon.prototype.first = function() {
    return this.vertices[0];
};

// last vertex
Polygon.prototype.last = function() {
    return this.vertices[this.vertices.length - 1];
};

// number of vertices
Polygon.prototype.size = function() {
    return this.vertices.length;
};

// add vertex
Polygon.prototype.push = function(p) {
    this.vertices.push(p);
};

// add vertex
Polygon.prototype.addPoint = function(x, y){
	this.push(new Point(x, y));
};

// reverse order of vertices
Polygon.prototype.reverse = function() {
    this.vertices.reverse();
};

// returs copy of polygon
Polygon.prototype.copy = function(i, j) {
    var p = new Polygon();
    if (i < j) {
        p.vertices = this.vertices.slice(i, j + 1);
    } else {
        p.vertices = this.vertices.slice(i, this.vertices.length);
        var tmp = this.vertices.slice(0, j + 1);
        for (var k = 0; k < tmp.length; k++){
        	p.push(tmp[k]);
        }
        delete(tmp);
    }
    return p;
};

// makes polygon clockwise
Polygon.prototype.makeCCW = function() {
    var br = 0;

    // find bottom right point
    for (var i = 1; i < this.size(); ++i) {
        if (this.vertices[i].y < this.vertices[br].y || (this.vertices[i].y == this.vertices[br].y && this.vertices[i].x > this.vertices[br].x)) {
            br = i;
        }
    }

    // reverse poly if clockwise
    if (!left(this.at(br - 1), this.at(br), this.at(br + 1))) {
        this.reverse();
    }
};

// returns whether vertex at index if reflex
Polygon.prototype.isReflex = function(i) {
    return right(this.at(i - 1), this.at(i), this.at(i + 1));
};

// decompose polygon (if concave) to array of convex polygons 
Polygon.prototype.decompose = function(){
	var polygons = [];					// array to store convex polygons
	decomposePolygon(this, polygons);	// decompose polygon and store them in polygons[]
	return polygons;					// return array of polygons
};

// deompose polygon
function decomposePolygon(poly, polygons){
	var upperInt = new Point, lowerInt = new Point, p = new Point, closestVert = new Point;
    var upperDist, lowerDist, d, closestDist;
    var upperIndex = 0, lowerIndex = 0, closestIndex = 0;
    var lowerPoly = new Polygon, upperPoly = new Polygon;
    
    if (poly.size() < 2){
        return;
    }
    for (var i = 0; i < poly.size(); ++i) {
        if (poly.isReflex(i)) {
            upperDist = lowerDist = Number.POSITIVE_INFINITY;
            for (var j = 0; j < poly.size(); ++j) {
                if (left(poly.at(i - 1), poly.at(i), poly.at(j))
                        && rightOn(poly.at(i - 1), poly.at(i), poly.at(j - 1))) { 								// if line intersects with an edge
                    p = lineInt(new Line(poly.at(i - 1), poly.at(i)), new Line(poly.at(j), poly.at(j - 1)));	// intersection(poly.at(i - 1), poly.at(i), poly.at(j), poly.at(j - 1)); // find the point of intersection
                    if (right(poly.at(i + 1), poly.at(i), p)) { 												// make sure it's inside the poly
                        d = sqdist(poly.at(i), p);
                        if (d < lowerDist) { 																	// keep only the closest intersection
                            lowerDist = d;
                            lowerInt = p;
                            lowerIndex = j;
                        }
                    }
                }
                if (left(poly.at(i + 1), poly.at(i), poly.at(j + 1))
                        && rightOn(poly.at(i + 1), poly.at(i), poly.at(j))) {
                    p = lineInt(new Line(poly.at(i + 1), poly.at(i)), new Line(poly.at(j), poly.at(j + 1)));	// intersection(at(poly, i + 1), at(poly, i), at(poly, j), at(poly, j + 1));
                    if (left(poly.at(i - 1), poly.at(i), p)) {
                        d = sqdist(poly.at(i), p);
                        if (d < upperDist) {
                            upperDist = d;
                            upperInt = p;
                            upperIndex = j;
                        }
                    }
                }
            }

            // if there are no vertices to connect to, choose a point in the middle
            if (lowerIndex == (upperIndex + 1) % poly.size()) {
                // console.log("Case 1: Vertex(" + i + "), lowerIndex(" + lowerIndex + "), upperIndex(" + upperIndex + "), poly.size(" + poly.size());
                p.x = (lowerInt.x + upperInt.x) / 2;
                p.y = (lowerInt.y + upperInt.y) / 2;
                var tmp;
                if (i < upperIndex) {
                    tmp = poly.vertices.slice(i, upperIndex + 1);
                    for (var k = 0; k < tmp.length; k++){
                    	lowerPoly.push(tmp[k]);
                    }
                    lowerPoly.push(p);
                    upperPoly.push(p);
                    if (lowerIndex != 0) {
                    	tmp = poly.vertices.slice(lowerIndex, poly.size());
                    	for (var k = 0; k < tmp.length; k++){
                    		upperPoly.push(tmp[k]);
                    	}
                	}
                	tmp = poly.vertices.slice(0, i + 1);
                    for (var k = 0; k < tmp.length; k++){
                    	upperPoly.push(tmp[k]);
                    }
                } else {
                    if (i != 0) {
                    	tmp = poly.vertices.slice(i, poly.size());
                    	for (var k = 0; k < tmp.length; k++){
                    		lowerPoly.push(tmp[k]);
                    	}
                    }
					tmp = poly.vertices.slice(0, upperIndex + 1);
                    for (var k = 0; k < tmp.length; k++){
                    	lowerPoly.push(tmp[k]);
                    }
                    lowerPoly.push(p);
                    upperPoly.push(p);
                    tmp = poly.vertices.slice(lowerIndex, i + 1);
                    for (var k = 0; k < tmp.length; k++){
                    	upperPoly.push(tmp[k]);
                    }
                }
            } else {
                // connect to the closest point within the triangle
                // console.log("Case 2: Vertex(" + i + "), closestIndex(" + closestIndex + "), poly.size(" + poly.size());
                if (lowerIndex > upperIndex) {
                    upperIndex += poly.size();
                }
                closestDist = Number.POSITIVE_INFINITY;
                for (var j = lowerIndex; j <= upperIndex; ++j) {
                    if (leftOn(poly.at(i - 1), poly.at(i), poly.at(j))
                            && rightOn(poly.at(i + 1), poly.at(i), poly.at(j))) {
                        d = sqdist(poly.at(i), poly.at(j));
                        if (d < closestDist) {
                            closestDist = d;
                            closestVert = poly.at(j);
                            closestIndex = j % poly.size();
                        }
                    }
                }
                var tmp;
                if (i < closestIndex) {
                    tmp = poly.vertices.slice(i, closestIndex + 1);
                    for (var k = 0; k < tmp.length; k++){
                    	lowerPoly.push(tmp[k]);
                    }
                    if (closestIndex != 0) {
                    	tmp = poly.vertices.slice(closestIndex, poly.size());
                    	for (var k = 0; k < tmp.length; k++){
                    		upperPoly.push(tmp[k]);
                    	}
                    }
                    tmp = poly.vertices.slice(0, i + 1);
                    for (var k = 0; k < tmp.length; k++){
                    	upperPoly.push(tmp[k]);
                    }
                } else {
                    if (i != 0) {
                    	tmp = poly.vertices.slice(i, poly.size());
                    	for (var k = 0; k < tmp.length; k++){
                    		lowerPoly.push(tmp[k]);
                    	}
                    }
                    tmp = poly.vertices.slice(0, closestIndex + 1);
                    for (var k = 0; k < tmp.length; k++){
                    	lowerPoly.push(tmp[k]);
                    }
                    tmp = poly.vertices.slice(closestIndex, i + 1);
                    for (var k = 0; k < tmp.length; k++){
                    	upperPoly.push(tmp[k]);
                    }
                }
            }

            // solve smallest poly first
            if (lowerPoly.size() < upperPoly.size()) {
                decomposePolygon(lowerPoly, polygons);
                decomposePolygon(upperPoly, polygons);
            } else {
                decomposePolygon(upperPoly, polygons);
                decomposePolygon(lowerPoly, polygons);
            }
            return;
        }
    }
    polygons.push(poly);
};
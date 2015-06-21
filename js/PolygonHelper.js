function Point(x, y){
	this.x = x || 0;
	this.y = y || 0;
}

function area(a, b, c) {
    return (((b.x - a.x)*(c.y - a.y))-((c.x - a.x)*(b.y - a.y)));
}

function left(a, b, c) {
    return area(a, b, c) > 0;
}

function leftOn(a, b, c) {
    return area(a, b, c) >= 0;
}

function right(a, b, c) {
    return area(a, b, c) < 0;
}

function rightOn(a, b, c) {
    return area(a, b, c) <= 0;
}

function collinear(a, b, c) {
    return area(a, b, c) == 0;
}

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

function lineInt(l1, l2) {
    var i = new Point();
    var a1, b1, c1, a2, b2, c2, det;
    a1 = l1.second.y - l1.first.y;
    b1 = l1.first.x - l1.second.x;
    c1 = a1 * l1.first.x + b1 * l1.first.y;
    a2 = l2.second.y - l2.first.y;
    b2 = l2.first.x - l2.second.x;
    c2 = a2 * l2.first.x + b2 * l2.first.y;
    det = a1 * b2 - a2*b1;
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
	context.stroke();
};

Polygon.prototype.at = function(i) {
    var s = this.size();
    return this.vertices[i < 0 ? i % s + s : i % s];		// if i < 0 return last vertex, and if i > size return first vertex 
};

Polygon.prototype.first = function() {
    return this.vertices[0];
};

Polygon.prototype.last = function() {
    return this.vertices[this.vertices.length - 1];
};

Polygon.prototype.size = function() {
    return this.vertices.length;
};

Polygon.prototype.push = function(p) {
    this.vertices.push(p);
};

Polygon.prototype.addPoint = function(x, y){
	this.push(new Point(x, y));
};

Polygon.prototype.reverse = function() {
    this.vertices.reverse();
};

Polygon.prototype.copy = function(i, j) {
    var p = new Polygon();
    if (i < j) {
        //p.v.insert(p.v.begin(), v.begin() + i, v.begin() + j + 1);
        p.vertices = this.vertices.slice(i, j + 1);
    } else {
        // p.v.insert(p.v.begin(), v.begin() + i, v.end());
        // p.v.insert(p.v.end(), v.begin(), v.begin() + j + 1);
        p.vertices = this.vertices.slice(i, this.vertices.length);
        var tmp = this.vertices.slice(0, j + 1);
        for (var k = 0; k < tmp.length; k++){
        	p.push(tmp[k]);
        }
        delete(tmp);
    }
    return p;
};

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

Polygon.prototype.isReflex = function(i) {
    return right(this.at(i - 1), this.at(i), this.at(i + 1));
};

Polygon.prototype.canSee = function(a, b) {
    var p;				// point
    var dist;

    if (leftOn(this.at(a + 1), this.at(a), this.at(b)) && rightOn(this.at(a - 1), this.at(a), this.at(b))) {
        return false;
    }
    dist = sqdist(this.at(a), this.at(b));
    for (var i = 0; i < this.size(); ++i) { // for each edge
        if ((i + 1) % this.size() == a || i == a) // ignore incident edges
            continue;
        if (leftOn(this.at(a), this.at(b), this.at(i + 1)) && rightOn(this.at(a), this.at(b), this.at(i))) { // if diag intersects an edge
            p = lineInt(new Line(this.at(a), this.at(b)), new Line(this.at(i), this.at(i + 1)));
            if (sqdist(this.at(a), p) < dist) { // if edge is blocking visibility to b
                return false;
            }
        }
    }

    return true;
};

Polygon.prototype.decomp = function() {
    var min = [], tmp1 = [], tmp2 = [];
    var nDiags = 100000000;

    for (var i = 0; i < this.size(); ++i) {
        if (this.isReflex(i)) {
            for (var j = 0; j < this.size(); ++j) {
                if (this.canSee(i, j)) {
                    tmp1 = this.copy(i, j).decomp();
                    tmp2 = this.copy(j, i).decomp();
                    var tmp = tmp2.slice(0, tmp2.length);
                    for (var k = 0; k < tmp.length; k++){
                    	tmp1.push(tmp[k]);
                    }
                    if (tmp1.length < nDiags) {
                        min = tmp1;
                        nDiags = tmp1.length;
                        min.push(new Line(this.at(i), this.at(j)));
                    }
                }
            }
        }
    }

    delete(tmp1);
    delete(tmp2);
    
    return min;
}
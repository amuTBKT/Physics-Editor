function LineSegment(startx, starty, endx, endy){
	this.sX = startx;
	this.sY = starty;
	this.eX = endx;
	this.eY = endy;

	this.signX = 1;
	if (endx > startx){
		this.signX *= -1;
	}

	this.signY = 1;
	if (endy > starty){
		this.signY *= -1;
	}
}

LineSegment.prototype.distanceFromPoint = function(pX, pY){
	var distance = Math.abs((this.eX - this.sX) * (this.sY - pY) - (this.sX - pX) * (this.eY - this.sY));
	distance /= Math.pow( (this.eX - this.sX) * (this.eX - this.sX) + (this.eY - this.sY) * (this.eY - this.sY) , 0.5);
	return distance;
}

LineSegment.prototype.checkInBoundsX = function(px){
	return (this.signX * px < this.signX * this.sX && this.signX * px > this.signX * this.eX);
}

LineSegment.prototype.checkInBoundsY = function(py){
	return (this.signY * py < this.signY * this.sY && this.signY * py > this.signY * this.eY);
}

function Vertex(x, y, w, h) {
	this.x = x;
	this.y = y;
	this.width = w;
	this.height = h;
	this.isSelected = false;
}

Vertex.prototype.move = function (dx, dy) {
	this.x += dx;
	this.y += dy;
};

function Shape(type){
	this.position = [0, 0];
	this.scaleXY = [1, 1];
	this.vertices = [];
	this.bounds = [0, 0, 0, 0];
	this.centroid = [0, 0];
	this.isSelected = false;
	this.inEditMode = false;
	this.shapeType = type;

	// fixture properties
	this.mass = 1;
	this.friction = 1;
	this.restitution = 0.5;
	this.isBulllet = 0;
}

Shape.SHAPE_BOX = 0;
Shape.SHAPE_CIRCLE = 1;
Shape.SHAPE_POLYGON = 2;
Shape.SHAPE_CHAIN = 3;

Shape.prototype.addVertex = function(v){
	if (this.shapeType == Shape.SHAPE_BOX || this.shapeType == Shape.SHAPE_CIRCLE)
		return;

	if (this.vertices.length > 3){
		var lineSegment, distance = 10000, index = 0;
		for (var i = 0; i < this.vertices.length; i++){
			if (i == this.vertices.length - 1){
				lineSegment = new LineSegment(this.vertices[i].x, this.vertices[i].y, this.vertices[0].x, this.vertices[0].y);
			}
			else{
				lineSegment = new LineSegment(this.vertices[i].x, this.vertices[i].y, this.vertices[i + 1].x, this.vertices[i + 1].y);
			}

			if (distance > lineSegment.distanceFromPoint(v.x, v.y)){
				if (lineSegment.checkInBoundsX(v.x) || lineSegment.checkInBoundsY(v.y)){
					index = i;
					distance = lineSegment.distanceFromPoint(v.x, v.y);			
				}
			}
		}

		if (distance > 25 && this.shapeType == Shape.SHAPE_CHAIN){
			this.vertices.push(v);
			return;
		}

		if (distance > 100) return;

		this.vertices.splice(index + 1, 0, v);
	}
	else{
		this.vertices.push(v);
	}

	this.calculateBounds();
};

Shape.prototype.removeVertexGivenVertex = function(v){
	if (this.shapeType == Shape.SHAPE_BOX || this.shapeType == Shape.SHAPE_CIRCLE)
		return;

	for (var i = 0; i < this.vertices.length; i++){
		if (this.vertices[i].x == v.x && this.vertices[i].y == v.y){ 
			this.vertices.splice(i, 1);
			break;
		}
	}
	this.calculateBounds();
};

Shape.prototype.removeVertexGivenIndex = function(index){
	if (this.shapeType == Shape.SHAPE_BOX || this.shapeType == Shape.SHAPE_CIRCLE)
		return;

	this.vertices.splice(index, 1);
	this.calculateBounds();
};

Shape.prototype.sortVertices = function(){
	for (var i = 0; i < this.vertices.length; i++){
		var v = this.vertices[i];
		var vec = [v.x - this.centroid[0], v.y - this.centroid[1]];
		var len = Math.pow(vec[0] * vec[0] + vec[1] * vec[1], 0.5);
		vec.x /= len;
		vec.y /= len;
		v.angle = Math.atan2(vec[1], vec[0]) + Math.PI;
	}

	this.vertices.sort(function(a, b){
		return a.angle - b.angle;
	});
};

Shape.prototype.move = function(dx, dy){
	this.position[0] += dx;
	this.position[1] += dy;

	for (var i = 0; i < this.vertices.length; i++){
		this.vertices[i].move(dx, dy);
	}

	this.calculateBounds();
};

Shape.prototype.setScale = function(sx, sy){
	this.scaleXY[0] = sx;
	this.scaleXY[1] = sy;

	for (var i = 0; i < this.vertices.length; i++){
		this.vertices[i].move(-this.position[0], -this.position[0]);

		this.vertices[i].x *= sx;
		this.vertices[i].y *= sy;

		this.vertices[i].move(this.position[0], this.position[0]);			
	}
};

Shape.prototype.calculateBounds = function(){
	var minX = 1000, maxX = -1000, minY = 1000, maxY = -1000;
	var v;
	for (var i = 0; i < this.vertices.length; i++){
		v = this.vertices[i];
		minX = Math.min(minX, v.x)
		maxX = Math.max(maxX, v.x);
		minY = Math.min(minY, v.y);
		maxY = Math.max(maxY, v.y);
	}
	this.bounds[0] = (maxX + minX) / 2;
	this.bounds[1] = (maxY + minY) / 2;
	this.bounds[2] = maxX - minX;
	this.bounds[3] = maxY - minY;

	// update centroid
	this.centroid = [0, 0];
	for (var i = 0; i < this.vertices.length; i++){
		this.centroid[0] += this.vertices[i].x;
		this.centroid[1] += this.vertices[i].y;
	}
	this.centroid[0] /= this.vertices.length;
	this.centroid[1] /= this.vertices.length;
};

Shape.prototype.toPhysics = function(){
	var shapes = [];
	//this.sortVertices();
	
	return shapes;
};



var Body = (function(){

	function Body(){

	}

})();
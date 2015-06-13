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

LineSegment.prototype.checkInBoundsAABB = function(bounds){
	var lineBounds = [(this.eX + this.sX) / 2, (this.eY + this.sY) / 2, Math.abs(this.eX - this.sX), Math.abs(this.eY - this.sY)];
	
	if (lineBounds[0] + lineBounds[2] / 2 < bounds[0] - bounds[2] / 2) return false;
	if (lineBounds[0] - lineBounds[2] / 2 > bounds[0] + bounds[2] / 2) return false;
	if (lineBounds[1] + lineBounds[3] / 2 < bounds[1] - bounds[3] / 2) return false;
	if (lineBounds[1] - lineBounds[3] / 2 > bounds[1] + bounds[3] / 2) return false;

	return true;
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

function Shape(type, width, height){
	this.position = [0, 0];						// position
	this.scaleXY = [1, 1];						// scale
	this.rotation = 0;							// only for editor purpose
	this.vertices = [];
	this.bounds = [0, 0, 0, 0];					// AABB for selecting
	this.centroid = [0, 0];						// centroid for shape
	this.isSelected = false;
	this.inEditMode = false;
	this.shapeType = type;

	// fixture properties
	this.mass = 1;
	this.friction = 1;
	this.restitution = 0.5;
	this.isBulllet = 0;


	if (type == Shape.SHAPE_CHAIN){
		this.mass = 0;
	}

	else if (type == Shape.SHAPE_BOX){
		var size = 10;
		this.vertices.push(new Vertex(-width / 2, -height / 2, size, size));
		this.vertices.push(new Vertex( width / 2, -height / 2, size, size));
		this.vertices.push(new Vertex( width / 2,  height / 2, size, size));
		this.vertices.push(new Vertex(-width / 2,  height / 2, size, size));
	}

	else if (type == Shape.SHAPE_CIRCLE){
		var radius = width / 2;
		var angle = 0;
		var resolution = 10;
		var size = 10;
		for (var i = 0; i < resolution; i++){
			angle = 2 * Math.PI * i / resolution;
			var vertex = new Vertex(radius * Math.cos(angle), radius * Math.sin(angle), size, size);
			this.vertices.push(vertex);
		}
	}
}

Shape.SHAPE_BOX = 0;
Shape.SHAPE_CIRCLE = 1;
Shape.SHAPE_POLYGON = 2;
Shape.SHAPE_CHAIN = 3;

Shape.prototype.addVertex = function(v){
	// if (this.shapeType == Shape.SHAPE_BOX || this.shapeType == Shape.SHAPE_CIRCLE)
	// 	return;

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
	// if (this.shapeType == Shape.SHAPE_BOX || this.shapeType == Shape.SHAPE_CIRCLE)
	// 	return;

	for (var i = 0; i < this.vertices.length; i++){
		if (this.vertices[i] == v){ 
			this.removeVertexGivenIndex(i);
			break;
		}
	}
};

Shape.prototype.removeVertexGivenIndex = function(index){
	// if (this.shapeType == Shape.SHAPE_BOX || this.shapeType == Shape.SHAPE_CIRCLE)
	// 	return;
	if (index == 0){
		this.vertices.shift();
	}
	else if (index == this.vertices.length - 1){
		this.vertices.pop();
	}
	else {
		this.vertices.splice(index, 1);
	}

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

Shape.prototype.setPosition = function(x, y){
	this.move(x - this.position[0], y - this.position[1]);
}

Shape.prototype.scale = function(sx, sy, pivotX, pivotY){
	this.scaleXY[0] *= sx;
	this.scaleXY[1] *= sy;

	for (var i = 0; i < this.vertices.length; i++){
		this.vertices[i].move(-pivotX, -pivotY);

		this.vertices[i].x *= sx;
		this.vertices[i].y *= sy;

		this.vertices[i].move(pivotX, pivotY);		
	}
};

// just for visualization in editor
Shape.prototype.rotate = function(angle, pivotX, pivotY){
	this.rotation += angle;

	for (var i = 0; i < this.vertices.length; i++){
		
		var x = this.vertices[i].x - pivotX;
		var y = this.vertices[i].y - pivotY;
		var newAngle = angle + Math.atan2(y, x) * 180 / Math.PI;
		var length = Math.pow(x * x + y * y, 0.5);
		this.vertices[i].x = pivotX + length * Math.cos(newAngle * Math.PI / 180);
		this.vertices[i].y = pivotY + length * Math.sin(newAngle * Math.PI / 180);

		// this.vertices[i].move(this.position[0], this.position[1]);			
	}

	// update position
	var x = this.position[0] - pivotX;
	var y = this.position[1] - pivotY;
	var newAngle = angle + Math.atan2(y, x) * 180 / Math.PI;
	var length = Math.pow(x * x + y * y, 0.5);
	this.position[0] = pivotX + length * Math.cos(newAngle * Math.PI / 180);
	this.position[1] = pivotY + length * Math.sin(newAngle * Math.PI / 180);
}

Shape.prototype.calculateBounds = function(){
	var minX = 100000, maxX = -100000, minY = 100000, maxY = -100000;
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

	var rot = shape.rotation;
	// reset rotation for exporting
	shape.rotate(-rot);


	// rotate again for visualization in editor
	shape.rotate(rot);

	return shapes;
};

function Body(){
	this.shapes = [];
	this.position = [0, 0];
	this.scaleXY = [1, 1];
	this.rotation = 0;
	this.bounds = [0, 0, 0, 0];
	this.isSelected = false;
}

Body.prototype.addShape = function(shape){
	shape.setPosition(this.position[0], this.position[1]);

	this.shapes.push(shape);
};

Body.prototype.removeShapeGivenIndex = function(index){
	if (index == 0){
		this.shapes.shift();
	}
	else if (index == this.shapes.length - 1){
		this.shapes.pop();
	}
	else {
		this.shapes.splice(index, 1);
	}
};

Body.prototype.removeShapeGivenShape = function(shape){
	for (var i = 0; i < this.shapes.length; i++){
		if (this.shapes[i] == shape){
			this.removeShapeGivenIndex(i);
			break;
		}
	}
};

Body.prototype.calculateBounds = function(){
	var minX = 100000, maxX = -100000, minY = 100000, maxY = -100000;
	var v;

	for (var i = 0; i < this.shapes.length; i++){
		for (var j = 0; j < this.shapes[i].vertices.length; j++){
			v = this.shapes[i].vertices[j];
			minX = Math.min(minX, v.x)
			maxX = Math.max(maxX, v.x);
			minY = Math.min(minY, v.y);
			maxY = Math.max(maxY, v.y);
		}
	}
	this.bounds[0] = (maxX + minX) / 2;
	this.bounds[1] = (maxY + minY) / 2;
	this.bounds[2] = maxX - minX;
	this.bounds[3] = maxY - minY;
};

Body.prototype.move = function(dx, dy){
	this.position[0] += dx;
	this.position[1] += dy;

	for (var i = 0; i < this.shapes.length; i++){
		this.shapes[i].move(dx, dy);
	}
};

Body.prototype.scale = function(sx, s){
	this.scaleXY[0] *= sx;
	this.scaleXY[1] *= sy;

	for (var i = 0; i < this.shapes.length; i++){
		this.shapes[i].scale(sx, sy, this.position[0], this.position[1]);
	}
};

Body.prototype.rotate = function(angle){
	this.rotation += angle;
	for (var i = 0; i < this.shapes.length; i++){
		this.shapes[i].rotate(angle, this.position[0], this.position[1]);
	}
};
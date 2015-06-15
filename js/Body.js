function LineSegment(startx, starty, endx, endy){
	/*
				Line Segment 
		(sX, sY)------------------				
			|\				     |				|
			|	\				 |				|	
			|		\			 |			bounds height
			|			\		 |				|
			|				\	 |				|
			|					\|				|
			-------------------(eX, eY)			

			<--- bounds width --->

	*/

	this.sX = startx;
	this.sY = starty;
	this.eX = endx;
	this.eY = endy;

 	// to keep track of whether sX > eX
	this.signX = 1;
	if (endx > startx){
		this.signX *= -1;
	}

	// to keep track of whether sY > eY
	this.signY = 1;
	if (endy > starty){
		this.signY *= -1;
	}
}

/**
*
* returns perpendicular distance between point and the line segment
*/
LineSegment.prototype.distanceFromPoint = function(pX, pY){
	var distance = Math.abs((this.eX - this.sX) * (this.sY - pY) - (this.sX - pX) * (this.eY - this.sY));
	distance /= Math.pow( (this.eX - this.sX) * (this.eX - this.sX) + (this.eY - this.sY) * (this.eY - this.sY) , 0.5);
	return distance;
}

/**
*
* returns true if point's x coordinate lies in line segment bounds 
*/
LineSegment.prototype.checkInBoundsX = function(px){
	return (this.signX * px < this.signX * this.sX && this.signX * px > this.signX * this.eX);
}

/**
*
* returns true if point's y coordinate lies in line segment bounds 
*/
LineSegment.prototype.checkInBoundsY = function(py){
	return (this.signY * py < this.signY * this.sY && this.signY * py > this.signY * this.eY);
}

/**
*
* params bounds => [x, y, width, height]
* returns true if the line segment bounds contains the rectangle bounds
*/
LineSegment.prototype.checkInBoundsAABB = function(bounds){
	var lineBounds = [(this.eX + this.sX) / 2, (this.eY + this.sY) / 2, Math.abs(this.eX - this.sX), Math.abs(this.eY - this.sY)];
	
	if (lineBounds[0] + lineBounds[2] / 2 < bounds[0] - bounds[2] / 2) return false;
	if (lineBounds[0] - lineBounds[2] / 2 > bounds[0] + bounds[2] / 2) return false;
	if (lineBounds[1] + lineBounds[3] / 2 < bounds[1] - bounds[3] / 2) return false;
	if (lineBounds[1] - lineBounds[3] / 2 > bounds[1] + bounds[3] / 2) return false;

	return true;
}

/**
*
* params x coordinate of vertex
* params y coordinate of vertex
* params width for collision detection
* params height for collision detection
*/
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

/**
*
* params type of shape
* params width, needed when type = BOX | CIRCLE
* params height, needed when type = BOX
*/
function Shape(type, width, height){
	this.shapeType = type;
	this.position = [0, 0];						// position
	this.scaleXY = [1, 1];						// scale
	this.rotation = 0;							// only for editor purpose
	this.vertices = [];
	this.bounds = [0, 0, 0, 0];					// AABB for selecting
	this.centroid = [0, 0];						// centroid for shape
	this.isSelected = false;
	this.inEditMode = false;

	// fixture properties
	this.mass = 1;
	this.friction = 1;
	this.restitution = 0.5;
	this.density = 1;
	this.isBulllet = 0;

	if (type == Shape.SHAPE_CHAIN || type == Shape.SHAPE_POLYGON){
		this.mass = type == Shape.SHAPE_CHAIN ? 0 : 1;
		var size = 10;
		width = width || 100;
		height = height || 100;
		this.vertices.push(new Vertex(-width / 2, -height / 2, size, size));
		this.vertices.push(new Vertex( width / 2, -height / 2, size, size));
		this.vertices.push(new Vertex( width / 2,  height / 2, size, size));
		this.vertices.push(new Vertex(-width / 2,  height / 2, size, size));
	}

	else if (type == Shape.SHAPE_BOX){
		this.width = width || 100;
		this.height = height || 100;

		var size = 10;
		this.vertices.push(new Vertex(-this.width / 2, -this.height / 2, size, size));
		this.vertices.push(new Vertex( this.width / 2, -this.height / 2, size, size));
		this.vertices.push(new Vertex( this.width / 2,  this.height / 2, size, size));
		this.vertices.push(new Vertex(-this.width / 2,  this.height / 2, size, size));
	}

	else if (type == Shape.SHAPE_CIRCLE){
		this.radius = width / 2 || 50;
		
		var angle = 0
		var resolution = 10;
		var size = 10;
		for (var i = 0; i < resolution; i++){
			angle = 2 * Math.PI * i / resolution;
			var vertex = new Vertex(this.radius * Math.cos(angle), this.radius * Math.sin(angle), size, size);
			this.vertices.push(vertex);
		}
	}
}

Shape.SHAPE_BOX = 0;
Shape.SHAPE_CIRCLE = 1;
Shape.SHAPE_POLYGON = 2;
Shape.SHAPE_CHAIN = 3;

Shape.prototype.addVertex = function(v){
	// do not edit BOX and CIRCLE shape
	if (this.shapeType == Shape.SHAPE_BOX || this.shapeType == Shape.SHAPE_CIRCLE)
		return;

	if (this.vertices.length > 3){
		var lineSegment, distance = 10000, index = 0;
		for (var i = 0; i < this.vertices.length; i++){
			// create new line segment to calculate distance b/w vertex to be addded and each edge of the shape
			if (i == this.vertices.length - 1){
				lineSegment = new LineSegment(this.vertices[i].x, this.vertices[i].y, this.vertices[0].x, this.vertices[0].y);
			}
			else{
				lineSegment = new LineSegment(this.vertices[i].x, this.vertices[i].y, this.vertices[i + 1].x, this.vertices[i + 1].y);
			}

			// if distance is smaller then preceding edge, update the index
			if (distance > lineSegment.distanceFromPoint(v.x, v.y)){
				if (lineSegment.checkInBoundsX(v.x) || lineSegment.checkInBoundsY(v.y)){
					index = i;

					// update distance
					distance = lineSegment.distanceFromPoint(v.x, v.y);			
				}
			}
		}

		// if shapeType = CHAIN and distance is greate than threshold then just add the new vertex at the end of array
		if (distance > 25 && this.shapeType == Shape.SHAPE_CHAIN){
			this.vertices.push(v);
			return;
		}

		// if distance of very large then don't add vertex
		if (distance > 100) return;

		// otherwise add the vertex on the edge (b/w two existing vertices)
		this.vertices.splice(index + 1, 0, v);
	}
	// if shape has less than 3 vertices then just push the new vertex at the end of the array
	else{
		this.vertices.push(v);
	}

	// update the bounds for the shape
	this.calculateBounds();
};

Shape.prototype.removeVertexGivenVertex = function(v){
	// do not edit BOX and CIRCLE shape
	if (this.shapeType == Shape.SHAPE_BOX || this.shapeType == Shape.SHAPE_CIRCLE)
		return;

	for (var i = 0; i < this.vertices.length; i++){
		if (this.vertices[i] == v){ 
			this.removeVertexGivenIndex(i);
			break;
		}
	}
};

Shape.prototype.removeVertexGivenIndex = function(index){
	if (this.shapeType == Shape.SHAPE_BOX || this.shapeType == Shape.SHAPE_CIRCLE)
		return;
	if (index == 0){
		this.vertices.shift();
	}
	else if (index == this.vertices.length - 1){
		this.vertices.pop();
	}
	else {
		this.vertices.splice(index, 1);
	}

	// update the bounds for the shape 
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

	if (this.shapeType == Shape.SHAPE_BOX){
		this.width *= sx;
		this.height *= sy;
	}
	else if (this.shapeType == Shape.SHAPE_CIRCLE){
		this.radius *= sx;
		sy = sx;
	}

	if (!pivotX || !pivotY){
		pivotX = this.position[0];
		pivotY = this.position[1];
	}

	// move the shape to new origin
	this.move(-pivotX, -pivotY);
	
	// update position
	this.position[0] *= sx;
	this.position[1] *= sy
	
	// scale vertices
	for (var i = 0; i < this.vertices.length; i++){
		this.vertices[i].x *= sx;
		this.vertices[i].y *= sy;
	}

	// revert origin
	this.move(pivotX, pivotY);		
};

Shape.prototype.setScale = function(sx, sy, pivotX, pivotY){
	this.scale(sx / this.scaleXY[0], sy / this.scaleXY[1], pivotX, pivotY);
};

// just for visualization in editor
Shape.prototype.rotate = function(angle, pivotX, pivotY){
	if (!pivotX || !pivotY){
		pivotX = this.position[0];
		pivotY = this.position[1];
	}

	// update rotation
	this.rotation += angle;

	// rotate vertices
	for (var i = 0; i < this.vertices.length; i++){
		var x = this.vertices[i].x - pivotX;
		var y = this.vertices[i].y - pivotY;
		var newAngle = angle + Math.atan2(y, x) * 180 / Math.PI;
		var length = Math.pow(x * x + y * y, 0.5);
		this.vertices[i].x = pivotX + length * Math.cos(newAngle * Math.PI / 180);
		this.vertices[i].y = pivotY + length * Math.sin(newAngle * Math.PI / 180);		
	}

	// update position
	var x = this.position[0] - pivotX;
	var y = this.position[1] - pivotY;
	var newAngle = angle + Math.atan2(y, x) * 180 / Math.PI;
	var length = Math.pow(x * x + y * y, 0.5);
	this.position[0] = pivotX + length * Math.cos(newAngle * Math.PI / 180);
	this.position[1] = pivotY + length * Math.sin(newAngle * Math.PI / 180);
}

Shape.prototype.setRotation = function(angle, pivotX, pivotY){
	this.rotate(angle - this.rotation, pivotX, pivotY);
};

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

// returns PhysicsShape for exporting
// use (x, y) as the origin for physics shape
Shape.prototype.toPhysics = function(x, y){
	var shapes = [];
	if (this.shapeType == Shape.SHAPE_BOX && this.rotation == 0){
		var pShape = new PhysicsShape(Shape.SHAPE_BOX);
		pShape.width = this.width;
		pShape.height = this.height;
		pShape.position = [this.position[0] - x, this.position[1] - y];
		shapes.push(pShape);
		return shapes;
	}
	else if (this.shapeType == Shape.SHAPE_CIRCLE){
		var pShape = new PhysicsShape(Shape.SHAPE_CIRCLE);
		pShape.radius = this.width / 2;
		pShape.position = [this.position[0] - x, this.position[1] - y];
		shapes.push(pShape);
		return shapes;
	}

	var pShape = new PhysicsShape(this.shapeType)
	for (var i = 0; i < this.vertices.length; i++){
		pShape.vertices.push([this.vertices[i].x - this.position[0], this.vertices[i].y - this.position[1]]);
	}
	shapes.push(pShape);
	return shapes;

	// TODO : concave shape generation
};

function Body(){
	this.shapes = [];
	this.position = [0, 0];
	this.scaleXY = [1, 1];
	this.rotation = 0;
	this.bounds = [0, 0, 0, 0];
	this.isSelected = false;
	this.bodyType = Body.BODY_TYPE_DYNAMIC;	// default to dynmic body
}

Body.BODY_TYPE_DYNAMIC = 0;
Body.BODY_TYPE_KINEMATIC = 1;
Body.BODY_TYPE_STATIC = 2;

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

Body.prototype.setPosition = function(x, y){
	this.move(x - this.position[0], y - this.position[1]);
};

Body.prototype.scale = function(sx, sy, pivotX, pivotY){
	if (!pivotX || !pivotY){
		pivotX = this.position[0];
		pivotY = this.position[1];
	}

	this.scaleXY[0] *= sx;
	this.scaleXY[1] *= sy;

	this.move(-pivotX, -pivotY);

	this.position[0] *= sx;
	this.position[1] *= sy;

	this.move(pivotX, pivotY);

	for (var i = 0; i < this.shapes.length; i++){
		this.shapes[i].scale(sx, sy, pivotX, pivotY);
	}
	
};

Body.prototype.setScale = function(sx, sy, pivotX, pivotY){
	this.scale(sx / this.scaleXY[0], sy / this.scaleXY[1], pivotX, pivotY);
};

Body.prototype.rotate = function(angle, pivotX, pivotY){
	if (!pivotX || !pivotY){
		pivotX = this.position[0];
		pivotY = this.position[1];
	}

	this.rotation += angle;
	for (var i = 0; i < this.shapes.length; i++){
		this.shapes[i].rotate(angle, pivotX, pivotY);
	}

	// update position
	var x = this.position[0] - pivotX;
	var y = this.position[1] - pivotY;
	var newAngle = angle + Math.atan2(y, x) * 180 / Math.PI;
	var length = Math.pow(x * x + y * y, 0.5);
	this.position[0] = pivotX + length * Math.cos(newAngle * Math.PI / 180);
	this.position[1] = pivotY + length * Math.sin(newAngle * Math.PI / 180);
};

Body.prototype.setRotation = function(angle, pivotX, pivotY){
	this.rotate(angle - this.rotation, pivotX, pivotY);
};

Body.prototype.toPhysics = function(){
	var rot = this.rotation;

	this.rotate(-rot);

	var pBody = new PhysicsBody(this.bodyType);
	pBody.position = this.position;
	pBody.rotation = rot;

	for (var i = 0; i < this.shapes.length; i++){
		var shape = this.shapes[i];
		
		var fixture = new Fixture();
		fixture.mass = shape.mass;
		fixture.restitution = shape.restitution;
		fixture.friction = shape.friction;
		fixture.density = shape.density;
		fixture.shapes = this.shapes[i].toPhysics(this.position[0], this.position[1]);
		pBody.fixtures.push(fixture);
	}

	this.rotate(rot);

	return pBody;
}

// exporting objects //
function Fixture(){
	this.shapes;
	this.restitution;
	this.mass;
	this.friction;
	this.density;
	this.isBullet;
}

function PhysicsShape(type){
	this.type = type;
	this.position = [0, 0];				// position relative to body				
	this.vertices = [];
	
	// for box shape
	this.width;
	this.height;

	// for circle shape
	this.radius;
}

function PhysicsBody(type){
	this.type = type;
	this.fixtures = [];
	this.position = [0, 0];
	this.rotation = 0;
}
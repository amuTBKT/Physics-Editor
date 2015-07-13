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

Vertex.prototype.clone = function(){
	var v = clone(this);
	return v;
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
	this.friction = 1;
	this.restitution = 0.25;
	this.density = 1;
	this.isSensor = false;
	this.maskBits = 65535;
	this.categoryBits = 1;
	this.groupIndex = 0;

	if (type == Shape.SHAPE_NONE){
		this.shapeType = Shape.SHAPE_POLYGON;
		return;
	}

	if (type == Shape.SHAPE_CHAIN || type == Shape.SHAPE_POLYGON){
		this.density = type == Shape.SHAPE_CHAIN ? 0 : 1;
		var size = 10;
		if ((width != null && height == null) || (width == null && height != null)){
			width = 50;
			var angle = 0
			var resolution = 10;
			var size = 10;
			for (var i = 0; i < resolution; i++){
				angle = 2 * Math.PI * i / resolution;
				var vertex = new Vertex(width * Math.cos(angle), width * Math.sin(angle), size, size);
				this.vertices.push(vertex);
			}
		}
		else {
			width = width || 100;
			height = height || 100;
			this.vertices.push(new Vertex(-width / 2, -height / 2, size, size));
			this.vertices.push(new Vertex( width / 2, -height / 2, size, size));
			this.vertices.push(new Vertex( width / 2,  height / 2, size, size));
			this.vertices.push(new Vertex(-width / 2,  height / 2, size, size));
		}
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
Shape.SHAPE_NONE = 4;

Shape.prototype.addVertex = function(x, y){
	var v = new Vertex(x, y, 10, 10);

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

Shape.prototype.indexOfVertex = function(v){
	for (var i = 0; i < this.vertices.length; i++){
		if (this.vertices[i] == v){ 
			return i;
		}
	}
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
		if (this.rotation == 0 || this.rotation % 180 == 0){
			this.width *= sx;// * Math.cos(this.rotation);
			this.height *= sy;// * Math.sin(this.rotation);
		}
		else if (this.rotation % 90 == 0){
			this.width *= sy;
			this.height *= sx;
		}
		else {
			var rotation = this.rotation;
			this.rotate(-rotation);

			this.width *= sx;
			this.height *= sy;

			if (pivotX == null || pivotY == null){
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

			// reset rotation
			this.rotate(rotation);

			return;
		}
	}
	else if (this.shapeType == Shape.SHAPE_CIRCLE){
		this.radius *= sx;
		sy = sx;
	}

	if (pivotX == null || pivotY == null){
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

Shape.prototype.setWidth = function(width){
	if (this.shapeType == Shape.SHAPE_BOX)
		this.scale(width / this.width, 1);
};

Shape.prototype.setRadius = function(radius){
	if (this.shapeType == Shape.SHAPE_CIRCLE)
		this.scale(radius / this.radius, 1);
};

Shape.prototype.setHeight = function(height){
	if (this.shapeType == Shape.SHAPE_BOX)
		this.scale(1, height / this.height);
};

// just for visualization in editor
Shape.prototype.rotate = function(angle, pivotX, pivotY){
	if (pivotX == null || pivotY == null){
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

Shape.prototype.clone = function(){
	var s = clone(this);
	return s;
};

Shape.prototype.isConvex = function(){
	var sumOfAngles = 0,											// sum of interior angles
		angleForConvexity = (this.vertices.length - 2) * 180,		// angle => (n - 2) * 180 for convexity
		edges = [];													// array of edges

	// calculate edges
	for (var i = 0; i < this.vertices.length; i++){
		if (i == this.vertices.length - 1){
			edges[i] = [this.vertices[0].x - this.vertices[i].x, this.vertices[0].y - this.vertices[i].y];
		}
		else {
			edges[i] = [this.vertices[i + 1].x - this.vertices[i].x, this.vertices[i + 1].y - this.vertices[i].y];
		}
	}

	// calculate angle b/w each edge
	for (var i = 0; i < edges.length; i++){
		if (i == edges.length - 1){
			var vec1 = edges[i],
				vec2 = edges[0],
				dot = vec1[0] * vec2[0] + vec1[1] * vec2[1],
				mag1 = Math.pow(vec1[0] * vec1[0] + vec1[1] * vec1[1], 0.5),
				mag2 = Math.pow(vec2[0] * vec2[0] + vec2[1] * vec2[1], 0.5),
				angle = Math.acos(dot / (mag1 * mag2));
			
			angle = Math.PI - angle;
			sumOfAngles += angle;
		}
		else {
			var vec1 = edges[i],
				vec2 = edges[i + 1],
				dot = vec1[0] * vec2[0] + vec1[1] * vec2[1],
				mag1 = Math.pow(vec1[0] * vec1[0] + vec1[1] * vec1[1], 0.5),
				mag2 = Math.pow(vec2[0] * vec2[0] + vec2[1] * vec2[1], 0.5),
				angle = Math.acos(dot / (mag1 * mag2)),
			
			angle = Math.PI - angle;
			sumOfAngles += angle;
		}
	}
	// convert radian to degrees (in radians gives unexpected results because of approximations)
	sumOfAngles = sumOfAngles * 180 / Math.PI;
	return Math.abs(sumOfAngles - angleForConvexity) < 0.1;
};

Shape.prototype.decomposeToConvex = function(x, y){
	var shapes = [];
	var polygons = decomposeToConvex(this.vertices);
	for (var i = 0; i < polygons.length; i++){
		var shape = new PhysicsShape(Shape.SHAPE_POLYGON);
		shape.position = [this.position[0] - x, this.position[1] - y];
		for (var j = 0; j < polygons[i].vertices.length; j++){
			shape.vertices.push([polygons[i].vertices[j].x - this.position[0], polygons[i].vertices[j].y - this.position[1]]);
		}
		shapes.push(shape);
	}
	return shapes;
};

function decomposeToConvex(vertices){
	var polygon = new Polygon();
	for (var i = 0; i < vertices.length; i++){
		polygon.addPoint(vertices[i].x, vertices[i].y);
	}
	return polygon.decompose();
}

// returns PhysicsShape for exporting
// use (x, y) as the origin for physics shape
Shape.prototype.exportShape = function(x, y){
	var shapes = []; // an array of physics shape (shapes if the shape is concave)
	
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
		pShape.radius = this.radius / 2;
		pShape.position = [this.position[0] - x, this.position[1] - y];
		shapes.push(pShape);
		return shapes;
	}

	var pShape = new PhysicsShape(this.shapeType == Shape.SHAPE_BOX ? Shape.SHAPE_POLYGON : this.shapeType);
	pShape.position = [this.position[0] - x, this.position[1] - y];
	// need to check for convexity if shape is polygon
	if (this.shapeType == Shape.SHAPE_POLYGON){
		// is shape convex
		if(this.isConvex()){
			// just export it
			for (var i = 0; i < this.vertices.length; i++){
				pShape.vertices.push([this.vertices[i].x - this.position[0], this.vertices[i].y - this.position[1]]);	// vertex position relative to shape
			}
			shapes.push(pShape);
			return shapes;
		}
		// decompose concave shape to convex shapes
		else {
			// decompose shape
			shapes = this.decomposeToConvex(x, y);
			return shapes;
		}
	}
	// just add the vertices if the shape is edge
	else {
		for (var i = 0; i < this.vertices.length; i++){
			pShape.vertices.push([this.vertices[i].x - this.position[0], this.vertices[i].y - this.position[1]]);		// vertex position relative to shape
		}
		shapes.push(pShape);
		return shapes;
	}
};

Shape.prototype.toPhysics = function(x, y){
	if (x == null || y == null){
		x = this.position[0];
		y = this.position[1];
	}
	var fixture = new Fixture();
	fixture.restitution = this.restitution;
	fixture.friction = this.friction;
	fixture.density = this.density;
	fixture.isSensor = this.isSensor;
	fixture.maskBits = this.maskBits;
	fixture.categoryBits = this.categoryBits;
	fixture.groupIndex = this.groupIndex;
	fixture.shapes = this.exportShape(x, y);
	return fixture;
};

function Body(){
	this.name = "body" + Body.counter++;	// for editor
	this.userData = "";						// for physics body
	this.texture = "";
	this.sprite;
	this.spriteData = [];					// [source-x, source-y, width, height, image-w, image-h]
	this.initialSpriteData = [];
	this.shapes = [];
	this.position = [0, 0];
	this.scaleXY = [1, 1];
	this.rotation = 0;
	this.bounds = [0, 0, 0, 0];
	this.isSelected = false;
	this.bodyType = Body.BODY_TYPE_DYNAMIC;	// default to dynmic body
	this.isBullet = false;
	this.isFixedRotation = false;
	this.linearDamping = 0;
	this.angularDamping = 0;
}

Body.counter = 0;
Body.BODY_TYPE_STATIC = 0;
Body.BODY_TYPE_KINEMATIC = 1;
Body.BODY_TYPE_DYNAMIC = 2;

Body.prototype.setSprite = function(file, x, y, w, h){
	if (x != null && y != null && w != null && h != null){	// image is sprite sheet
		this.sprite = new Image();
		this.sprite.src = file;
		this.spriteData = [x, y, w, h, w, h];
		this.initialSpriteData = [w, h];
	}
	else {
		this.sprite = new Image();
		this.sprite.src = file;
		var ref = this;
		this.sprite.onload = function(){
			console.log(this.width);
			ref.initialSpriteData = [this.width, this.height];
			ref.spriteData = [this.width, this.height];
		}
	}
	this.texture = file;
};

Body.prototype.setSpriteWidth = function(width){
	if (this.sprite == null){
		return;
	}

	if (this.spriteData.length > 2){
		this.spriteData[4] = width;
		this.spriteData[2] = width;
		return;
	}
	this.sprite.width = width;
	this.spriteData[0] = width;
};

Body.prototype.setSpriteHeight = function(height){
	if (this.sprite == null){
		return;
	}

	if (this.spriteData.length > 2){
		this.spriteData[5] = height;
		this.spriteData[3] = height;
		return;
	}
	this.sprite.height = height;
	this.spriteData[1] = height;
};

Body.prototype.setSpriteSourceWidth = function(width){
	if (this.sprite == null){
		return;
	}

	if (this.spriteData.length == 2){
		this.spriteData = [0, 0, width, this.initialSpriteData[1], this.initialSpriteData[0], this.initialSpriteData[1]];
		return;
	}

	this.spriteData[2] = width;
};

Body.prototype.setSpriteSourceHeight = function(height){
	if (this.sprite == null){
		return;
	}

	if (this.spriteData.length == 2){
		this.spriteData = [0, 0, this.initialSpriteData[0], height, this.initialSpriteData[0], this.initialSpriteData[1]];
		return;
	}

	this.spriteData[3] = height;
};

Body.prototype.setOffsetX = function(x){
	if (this.sprite == null){
		return;
	}

	if (this.spriteData.length == 2){
		this.spriteData = [x, 0, this.initialSpriteData[0], this.initialSpriteData[1], this.initialSpriteData[0], this.initialSpriteData[1]];
	}

	if (this.spriteData.length > 2){
		this.spriteData[0] = x;
		return;
	}
};

Body.prototype.setOffsetY = function(y){
	if (this.sprite == null){
		return;
	}

	if (this.spriteData.length == 2){
		this.spriteData = [0, y, this.initialSpriteData[0], this.initialSpriteData[1], this.initialSpriteData[0], this.initialSpriteData[1]];
	}

	if (this.spriteData.length > 2){
		this.spriteData[1] = y;
		return;
	}
};

Body.prototype.getSpriteWidth = function(){
	if (this.spriteData.length > 2){
		return this.spriteData[4];
	}
	return this.sprite.width;
};

Body.prototype.getSpriteHeight = function(){
	if (this.spriteData.length > 2){
		return this.spriteData[5];
	}
	return this.sprite.height;
};

Body.prototype.getSpriteSourceHeight = function(){
	if (this.spriteData.length > 2){
		return this.spriteData[3];
	}
	return null;
};

Body.prototype.getSpriteSourceWidth = function(){
	if (this.spriteData.length > 2){
		return this.spriteData[2];
	}
	return null;
};

Body.prototype.getSpriteOffsetX = function(){
	if (this.spriteData.length > 2){
		return this.spriteData[0];
	}
	return null;
};

Body.prototype.getSpriteOffsetY = function(){
	if (this.spriteData.length > 2){
		return this.spriteData[1];
	}
	return null;
};

// if (setPos == true) => shape would be moved to bodies center 
Body.prototype.addShape = function(shape, setPos){
	if (setPos){
		shape.setPosition(this.position[0], this.position[1]);
	}
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
	if (pivotX == null || pivotY == null){
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
	if (pivotX == null || pivotY == null){
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

Body.prototype.clone = function(){
	var b = clone(this);
	return b;
};

function clone(obj) {
    var copy;

    // Handle the 3 simple types, and null or undefined
    if (null == obj || "object" != typeof obj) return obj;

    if (obj instanceof Array) {
        copy = [];
        for (var i = 0, len = obj.length; i < len; i++) {
            copy[i] = clone(obj[i]);
        }
        return copy;
    }

    if (obj instanceof Vertex) {
        copy = new Vertex();
        for (var attr in obj) {
            if (obj.hasOwnProperty(attr)) copy[attr] = clone(obj[attr]);
        }
        return copy;
    }

    if (obj instanceof Shape) {
        copy = new Shape();
        for (var attr in obj) {
            if (obj.hasOwnProperty(attr)) copy[attr] = clone(obj[attr]);
        }
        return copy;
    }

    if (obj instanceof Body) {
        copy = new Body();
        for (var attr in obj) {
            if (obj.hasOwnProperty(attr) && attr != "name") copy[attr] = clone(obj[attr]);
        }
        return copy;
    }

    // if (obj instanceof Joint){
    // 	copy = new Joint(obj.jointType);
    //     for (var attr in obj) {
    //     	if (attr == 'bodyA'){		// donot clone body
    //     		copy[attr] = obj[attr];
    //     		continue;
    //     	}
    //         if (obj.hasOwnProperty(attr) && attr != "name") copy[attr] = clone(obj[attr]);
    //     }
    //     return copy;
    // }

    if (obj instanceof Image){
    	copy = new Image();
    	copy.src = obj.src;
    	copy.width = obj.width;
    	copy.height = obj.height;
    	return copy;
    }
}

Body.prototype.toPhysics = function(){
	var rot = this.rotation;

	this.rotate(-rot);

	var pBody = new PhysicsBody(this.bodyType);
	pBody.position = this.position;
	pBody.rotation = rot;
	pBody.isBullet = this.isBullet;
	pBody.isFixedRotation = this.isFixedRotation;
	pBody.userData = this.userData;
	pBody.linearDamping = this.linearDamping;
	pBody.angularDamping = this.angularDamping;
	if (this.texture){
		pBody.texture = this.texture;
		if (this.spriteData.length > 2){
			var sourceX = this.spriteData[0],
				sourceY = this.spriteData[1],
				sourceW = this.spriteData[2],
				sourceH = this.spriteData[3],
				imageW 	= this.spriteData[4];
				imageH	= this.spriteData[5];
			pBody.textureData = [sourceX, sourceY, sourceW, sourceH, imageW, imageH];
		}
		else {
			pBody.textureData = [this.sprite.width, this.sprite.height];
		}
	}

	for (var i = 0; i < this.shapes.length; i++){
		var shape = this.shapes[i];
		pBody.fixtures.push(shape.toPhysics(this.position[0], this.position[1]));
	}

	this.rotate(rot);

	return pBody;
};

// exporting objects //
function Fixture(){
	this.shapes;
	this.restitution;
	this.friction;
	this.density;
	this.isSensor = false;
	this.maskBits = 65535;
	this.categoryBits = 1;
	this.groupIndex = 0;
}

function PhysicsShape(type){
	this.type = parseInt(type);
	this.position = [0, 0];				// position relative to body				
	this.vertices = [];
	
	// for box shape
	this.width;
	this.height;

	// for circle shape
	this.radius;
}

function PhysicsBody(type){
	this.type = parseInt(type);
	this.userData = "";
	this.texture;
	this.textureData;
	this.fixtures = [];
	this.position = [0, 0];
	this.rotation = 0;
	this.isBullet = false;
	this.isFixedRotation = 0;
	this.linearDamping = 0;
	this.angularDamping = 0;
}

function PhysicsJoint(joint){
	this.bodyA;
	this.bodyB;
	this.localAnchorA 		= joint.localAnchorA;
	this.localAnchorB 		= joint.localAnchorB;
	this.userData 			= joint.userData;
	this.collideConnected 	= joint.collideConnected;
	this.userData 			= joint.userData;

	this.jointType = parseInt(joint.jointType);
	if (this.jointType == Joint.JOINT_DISTANCE){
		this.length 		= joint.length;
		this.frequencyHZ 	= joint.frequencyHZ;
		this.dampingRatio 	= joint.dampingRatio;
	}
	else if (this.jointType == Joint.JOINT_WELD){
		this.referenceAngle = joint.referenceAngle;
	}
	else if (this.jointType == Joint.JOINT_REVOLUTE){
		this.enableLimit 	= joint.enableLimit;
	 	this.enableMotor 	= joint.enableMotor;
	 	this.lowerAngle 	= joint.lowerAngle;
		this.maxMotorTorque = joint.maxMotorTorque;
	 	this.motorSpeed 	= joint.motorSpeed;
	 	this.referenceAngle = joint.referenceAngle;
	 	this.upperAngle		= joint.upperAngle;
	}
	else if (this.jointType == Joint.JOINT_WHEEL){
		this.localAxisA 	= joint.localAxisA;
		this.enableMotor 	= joint.enableMotor;
		this.maxMotorTorque = joint.maxMotorTorque;
	 	this.motorSpeed 	= joint.motorSpeed;
	 	this.frequencyHZ 	= joint.frequencyHZ;
		this.dampingRatio 	= joint.dampingRatio;
	}
	else if (this.jointType == Joint.JOINT_PULLEY){
		this.groundAnchorA 	= joint.groundAnchorA;
		this.groundAnchorB 	= joint.groundAnchorB;
		this.lengthA	   	= joint.lengthA;
		this.lengthB		= joint.lengthB;
		this.maxLengthA     = joint.maxLengthA;
		this.maxLengthB     = joint.maxLengthB;
		this.ratio 			= joint.frequencyHZ;
	}
	else if (this.jointType == Joint.JOINT_GEAR){
		this.ratio 			= joint.frequencyHZ;
		this.joint1			= -1;
		this.joint2			= -1;
		this.localAnchorA   = undefined;
		this.localAnchorB   = undefined;
	}
	else if (this.jointType == Joint.JOINT_PRISMATIC){
		this.enableLimit 	= joint.enableLimit;
	 	this.enableMotor 	= joint.enableMotor;
	 	this.lowerTranslation 	= joint.lowerTranslation;
	 	this.upperTranslation 	= joint.upperTranslation;
	 	this.localAxisA 	= joint.localAxisA;
		this.maxMotorForce = joint.maxMotorTorque;
	 	this.motorSpeed 	= joint.motorSpeed;
	 	this.referenceAngle = joint.referenceAngle;
	}
	else if (this.jointType == Joint.JOINT_ROPE){
		this.maxLength = joint.frequencyHZ;
	}
}

function Joint(type){
	this.bodyA;
	this.bodyB;
	this.bodyIndexA = -1;
	this.bodyIndexB = -1;
	this.localAnchorA = [0, 0];
	this.localAnchorB = [0, 0];
	this.userData = "";
	this.collideConnected = false;

	this.jointType = type;
	if (type == Joint.JOINT_DISTANCE){
		this.length 		= 100;
		this.frequencyHZ 	= 60;
		this.dampingRatio 	= 1;
	}
	else if (type == Joint.JOINT_WELD){
		this.referenceAngle = 0;
	}
	else if (type == Joint.JOINT_REVOLUTE){
		this.enableLimit 	= false;
	 	this.enableMotor 	= false;
	 	this.lowerAngle 	= 0;
		this.maxMotorTorque = 100;
	 	this.motorSpeed 	= 100;
	 	this.referenceAngle = 0;
	 	this.upperAngle		= 0;
	}
	else if (type == Joint.JOINT_WHEEL){
		this.localAxisA 	= [0, 1];
		this.enableMotor 	= false;
		this.maxMotorTorque = 100;
	 	this.motorSpeed 	= 100;
	 	this.frequencyHZ 	= 60;
		this.dampingRatio 	= 1;
	}
	else if (type == Joint.JOINT_PULLEY){
		this.groundAnchorA 	= [0, 0];
		this.groundAnchorB 	= [0, 0];
		this.lengthA	   	= 100;
		this.lengthB		= 100;
		this.maxLengthA     = 100;
		this.maxLengthB     = 100;
		this.frequencyHZ    = 1;			// frequecyHZ is equivalent to ratio in this case (makes it easy to use the current ui layout)
	}
	else if (type == Joint.JOINT_GEAR){
		// localAnchors not needed for this joint
		this.frequencyHZ    = 1;			// frequecyHZ is equivalent to ratio in this case (makes it easy to use the current ui layout)
		this.joint1;
		this.joint2;
		this.jointIndex1    = -1;
		this.jointIndex2	= -1;
	}
	else if (type == Joint.JOINT_PRISMATIC){
		this.enableLimit 	= false;
	 	this.enableMotor 	= false;
	 	this.lowerTranslation 	= 0;
	 	this.upperTranslation   = 100;
	 	this.localAxisA 	= [1, 0];
		this.maxMotorTorque = 100;
	 	this.motorSpeed 	= 100;
	 	this.referenceAngle = 0;
	}
	else if (type == Joint.JOINT_ROPE){
		this.frequencyHZ    = 100;			// frequecyHZ is equivalent to maxLength in this case (makes it easy to use the current ui layout)
	}

	// editor parameters
	this.position = [0, 0];
	this.scaleXY = [1, 1];
	this.isSelected = false;
	this.inEditMode = false;
	this.name = "joint" + Joint.counter++;
}

Joint.counter = 0;
Joint.JOINT_DISTANCE	= 0;
Joint.JOINT_WELD 		= 1;
Joint.JOINT_REVOLUTE	= 2;
Joint.JOINT_WHEEL 		= 3;
Joint.JOINT_PULLEY		= 4;
Joint.JOINT_GEAR		= 5;
Joint.JOINT_PRISMATIC	= 6;
Joint.JOINT_ROPE		= 7;

Joint.prototype.clone = function(cloneBodyA, cloneBodyB){
	var copy = new Joint(this.jointType);
        for (var attr in this) {
        	if (attr == 'bodyA' && !cloneBodyA){		// donot clone body
        		copy[attr] = this[attr];
        		continue;
        	}
        	if (attr == 'bodyB' && !cloneBodyB){		// donot clone body
        		copy[attr] = this[attr];
        		continue;
        	}
            if (this.hasOwnProperty(attr) && attr != "name") copy[attr] = clone(this[attr]);
        }
	return copy;
}

Joint.prototype.setUserData = function(data){
	this.userData = data;
};

Joint.prototype.setLocalAnchorA = function(x, y){
	this.localAnchorA = [x, y];
};
Joint.prototype.setLocalAnchorB = function(x, y){
	this.localAnchorB = [x, y];
};

Joint.prototype.moveAnchorA = function(x, y){
	this.localAnchorA[0] += x;
	this.localAnchorA[1] += y;
};

Joint.prototype.moveAnchorB = function(x, y){
	this.localAnchorB[0] += x;
	this.localAnchorB[1] += y;
};

Joint.prototype.move = function(x, y){
	this.position[0] += x;
	this.position[1] += y;

	this.moveAnchorA(x, y);
	this.moveAnchorB(x, y);

	if (this.jointType == Joint.JOINT_PULLEY){
		this.moveGroundAnchorA(x, y);
		this.moveGroundAnchorB(x, y);
	}
};

Joint.prototype.setPosition = function(x, y){
	this.move(x - this.position[0], y - this.position[1]);
};

Joint.prototype.scale = function(sx, sy, pivotX, pivotY){
	if (pivotX == null || pivotY == null){
		pivotX = this.position[0];
		pivotY = this.position[1];
	}

	this.scaleXY[0] *= sx;
	this.scaleXY[1] *= sy;

	this.move(-pivotX, -pivotY);

	this.position[0] *= sx;
	this.position[1] *= sy;

	this.localAnchorA[0] *= sx;
	this.localAnchorA[1] *= sy;
	this.localAnchorB[0] *= sx;
	this.localAnchorB[1] *= sy;

	this.move(pivotX, pivotY);
};

Joint.prototype.setScale = function(sx, sy, pivotX, pivotY){
	this.scale(sx / this.scaleXY[0], sy / this.scaleXY[1], pivotX, pivotY);
};

Joint.prototype.getBounds = function(){
	return [this.position[0], this.position[1], 32, 32];
};

Joint.prototype.getAnchorABounds = function(){
	return [this.localAnchorA[0], this.localAnchorA[1], 32, 32];
};

Joint.prototype.getAnchorBBounds = function(){
	return [this.localAnchorB[0], this.localAnchorB[1], 32, 32];
};

// distance joint
Joint.prototype.setLength = function(length){
	this.length = length;
};
Joint.prototype.setDampingRatio = function(dampingRatio){
	this.dampingRatio = dampingRatio;
};
Joint.prototype.setFrequency = function(frequency){
	this.frequencyHZ = frequency;
};

// weld joint
Joint.prototype.setReferenceAngle = function(angle){
	this.referenceAngle = angle * Math.PI / 180;
};

Joint.prototype.changeReferenceAngle = function(delta){
	this.referenceAngle += delta;
};

// revolute joint
Joint.prototype.changeLowerAngle = function(delta){
	this.lowerAngle += delta;
	// if joint is wheel or prismatic, then edit localAxis 
	if (this.jointType == Joint.JOINT_PRISMATIC || this.jointType == Joint.JOINT_WHEEL){
		this.rotateLocalAxis(delta);
	}
};
Joint.prototype.changeUpperAngle = function(delta){
	this.upperAngle += delta;
};
Joint.prototype.setLowerAngle = function(angle){
	this.lowerAngle = angle;
};
Joint.prototype.setUpperAngle = function(angle){
	this.upperAngle = angle;
};
Joint.prototype.setMotorSpeed = function(speed){
	this.motorSpeed = speed;
};
Joint.prototype.setMaxMotorTorque = function(torque){
	this.maxMotorTorque = torque;
};

// wheel and prismatic joint
Joint.prototype.rotateLocalAxis = function(delta){
	var newAngle = -Math.atan2(this.localAxisA[1], this.localAxisA[0]) + delta * Math.PI / 180;
	this.localAxisA = [Math.cos(newAngle), -Math.sin(newAngle)];
};

// pulley joint
Joint.prototype.setGroundAnchorA = function(x, y){
	this.groundAnchorA = [x, y];
};
Joint.prototype.setGroundAnchorB = function(x, y){
	this.groundAnchorB = [x, y];
};

Joint.prototype.moveGroundAnchorA = function(x, y){
	this.groundAnchorA[0] += x;
	this.groundAnchorA[1] += y;
};

Joint.prototype.moveGroundAnchorB = function(x, y){
	this.groundAnchorB[0] += x;
	this.groundAnchorB[1] += y;
};

Joint.prototype.setLengthA = function(length){
	this.lengthA = length;
};

Joint.prototype.setLengthB = function(length){
	this.lengthB = length;
};

Joint.prototype.setMaxLengthA = function(length){
	this.maxLengthA = length;
};

Joint.prototype.setMaxLengthB = function(length){
	this.maxLengthB = length;
};

Joint.prototype.getGroundAnchorABounds = function(){
	return [this.groundAnchorA[0], this.groundAnchorA[1], 32, 32];
};

Joint.prototype.getGroundAnchorBBounds = function(){
	return [this.groundAnchorB[0], this.groundAnchorB[1], 32, 32];
};

Joint.prototype.toPhysics = function(bodies, joints){
	var joint = new PhysicsJoint(this);
	joint.bodyA = bodies.indexOf(this.bodyA);
	joint.bodyB = bodies.indexOf(this.bodyB);
	if (joint.jointType == Joint.JOINT_PULLEY){
		joint.maxLengthA = Math.pow((this.groundAnchorA[0] - this.localAnchorA[0]) * (this.groundAnchorA[0] - this.localAnchorA[0]) + 
									(this.groundAnchorA[1] - this.localAnchorA[1]) * (this.groundAnchorA[1] - this.localAnchorA[1]), 0.5);
		joint.maxLengthB = Math.pow((this.groundAnchorB[0] - this.localAnchorB[0]) * (this.groundAnchorB[0] - this.localAnchorB[0]) + 
									(this.groundAnchorB[1] - this.localAnchorB[1]) * (this.groundAnchorB[1] - this.localAnchorB[1]), 0.5);
		joint.lengthA = joint.maxLengthA;
		joint.lengthB = joint.maxLengthB;
	}
	if (joint.jointType != Joint.JOINT_GEAR){
		var rotation, dx, dy, length, angle;
		if (this.bodyA.rotation != 0){
			rotation = -this.bodyA.rotation;
			dx = this.localAnchorA[0] - this.bodyA.position[0];
			dy = this.localAnchorA[1] - this.bodyA.position[1];
			length = Math.pow(dx * dx + dy * dy, 0.5);
			angle = Math.atan2(dy, dx);
			
			joint.localAnchorA = [	length * Math.cos(angle + rotation * Math.PI / 180), 
								 	length * Math.sin(angle + rotation * Math.PI / 180)  ];
		}
		else {
			joint.localAnchorA = [this.localAnchorA[0] - this.bodyA.position[0], this.localAnchorA[1] - this.bodyA.position[1]];
		}

		if (this.bodyB.rotation != 0){
			rotation = -this.bodyB.rotation;
			dx = this.localAnchorB[0] - this.bodyB.position[0];
			dy = this.localAnchorB[1] - this.bodyB.position[1]
			length = Math.pow(dx * dx + dy * dy, 0.5);
			angle = Math.atan2(dy, dx);

			joint.localAnchorB = [	length * Math.cos(angle + rotation * Math.PI / 180), 
								 	length * Math.sin(angle + rotation * Math.PI / 180)  ];
		}
		else {
			joint.localAnchorB = [this.localAnchorB[0] - this.bodyB.position[0], this.localAnchorB[1] - this.bodyB.position[1]];
		}
	}
	if (joint.jointType == Joint.JOINT_GEAR) {
		joint.joint1 = joints.indexOf(this.joint1);
		joint.joint2 = joints.indexOf(this.joint2);
	}
	return joint;
};
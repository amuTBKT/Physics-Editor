var b2Vec2 =  Box2D.Common.Math.b2Vec2,
   	b2AABB = Box2D.Collision.b2AABB,
    b2BodyDef = Box2D.Dynamics.b2BodyDef,
    b2Body = Box2D.Dynamics.b2Body,
    b2FixtureDef = Box2D.Dynamics.b2FixtureDef,
    b2Fixture = Box2D.Dynamics.b2Fixture,
    b2World = Box2D.Dynamics.b2World,
    b2MassData = Box2D.Collision.Shapes.b2MassData,
    b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape,
    b2CircleShape = Box2D.Collision.Shapes.b2CircleShape,
    b2DebugDraw = Box2D.Dynamics.b2DebugDraw,
    b2MouseJointDef =  Box2D.Dynamics.Joints.b2MouseJointDef,
    b2DistanceJointDef =  Box2D.Dynamics.Joints.b2DistanceJointDef,
    b2RevoluteJointDef =  Box2D.Dynamics.Joints.b2RevoluteJointDef,
    b2WeldJointDef =  Box2D.Dynamics.Joints.b2WeldJointDef,
    b2PulleyJointDef = Box2D.Dynamics.Joints.b2PulleyJointDef;

var WorldLoader = (function(){

	/** for bodies with texture data */
	function GameObject () {
  		this.body;
  		this.sprite;
  		this.spriteData = [];
	}

	function WorldLoader (){
		this.loadedBodies = [];			// to store box2d bodies created to use when creating joints
		this.loadedJoints = [];			// to store box2d joints created
		this.gameObjects = [];			// to store gameobjects created
		this.offsetX = 0;
		this.offsetY = 0;
	}

	WorldLoader.prototype.reset = function(){
		if (this.loadedBodies.length > 0){
			delete(this.loadedBodies);
		}
		this.loadedBodies = [];

		if (this.loadedJoints.length > 0){
			delete(this.loadedJoints);
		}
		this.loadedJoints = [];

		if (this.gameObjects.length > 0){
			delete(this.gameObjects);
		}
		this.gameObjects = [];
	};

	WorldLoader.prototype.loadJsonScene = function(scene, world){
		this.reset();

		// load bodies
		for (var i = 0; i < scene.bodies.length; i++){
			this.createBody(scene.bodies[i], world);
		}

		// load joints
		for (var i = 0; i < scene.joints.length; i++){
			this.createJoint(scene.joints[i], world);
		}
	};

	WorldLoader.prototype.createBody = function(b, world){
		var pB = b;

		var bodyDef = new b2BodyDef;
		bodyDef.type = pB.type;
		bodyDef.position.Set(pB.position[0] / 30, pB.position[1] / 30);
		var body = world.CreateBody(bodyDef);
		body.SetAngle(pB.rotation * Math.PI / 180);
		body.SetBullet(pB.isBullet);
		body.SetFixedRotation(pB.isFixedRotation);
		body.SetLinearDamping(pB.linearDamping);
		body.SetAngularDamping(pB.angularDamping);

		this.loadedBodies.push(body);

		if (pB.texture){
			this.createGameObject(pB.texture, pB.textureData, body);
		}

		for (var i = 0; i < pB.fixtures.length; i++){
			var f = pB.fixtures[i];
			var fixture = new b2FixtureDef;
			fixture.density = f.density;
			fixture.restitution = f.restitution;
			fixture.friction = f.friction;
			fixture.isSensor = f.isSensor;
			fixture.filter.maskBits = f.maskBits;
			fixture.filter.categoryBits = f.categoryBits;
			fixture.filter.groupIndex = f.groupIndex;

			for (var j = 0; j < f.shapes.length; j++){
		    	var s = f.shapes[j];
		    	if (s.type == Shape.SHAPE_BOX){
		       		var shape = new b2PolygonShape;
		       		shape.SetAsBox(s.width / 60, s.height / 60);
		       		for(var k = 0; k < shape.m_vertices.length; k++){
						shape.m_vertices[k].x += s.position[0] / 30;
						shape.m_vertices[k].y += s.position[1] / 30;
		       		}
		       		fixture.shape = shape;
		       		body.CreateFixture(fixture);
		    	}
		    	else if (s.type == Shape.SHAPE_CIRCLE){
					var shape = new b2CircleShape(s.radius * 2 / 30);
					shape.SetLocalPosition(new b2Vec2(s.position[0] / 30, s.position[1] / 30));
					fixture.shape = shape;
					body.CreateFixture(fixture);
			   	}
			    else if (s.type == Shape.SHAPE_POLYGON){
					var shape = new b2PolygonShape;
					var verts = [];
					for (var k = 0; k < s.vertices.length; k++){
						var vert = new b2Vec2(s.position[0] / 30 + s.vertices[k][0] / 30, s.position[1] / 30 + s.vertices[k][1] / 30);
						verts.push(vert); 
			       	}
			       	shape.SetAsArray(verts);
			       	fixture.shape = shape;
			       	body.CreateFixture(fixture);
			    }
			    else if (s.type == Shape.SHAPE_CHAIN){
					var shape = new b2PolygonShape;
			       	fixture.shape = shape;
			       	for (var k = 0; k < s.vertices.length; k++){
						var vert1 = new b2Vec2(s.position[0] / 30 + s.vertices[k][0] / 30, s.position[1] / 30 + s.vertices[k][1] / 30);
			          	var vert2 = new b2Vec2(s.position[0] / 30 + s.vertices[k < s.vertices.length - 1 ? k + 1 : 0][0] / 30, s.position[1] / 30 + s.vertices[k < s.vertices.length - 1 ? k + 1 : 0][1] / 30);
			          	shape.SetAsEdge(vert1, vert2);
			          	body.CreateFixture(fixture);
			       	}
			    }
		 	}
		}
	};

	WorldLoader.prototype.createJoint = function(j, world){
		if (j.jointType == Joint.JOINT_DISTANCE){
		    var jointDef = new b2DistanceJointDef;
		    jointDef.bodyA = this.loadedBodies[j.bodyA];
		    jointDef.bodyB = this.loadedBodies[j.bodyB];
		    jointDef.localAnchorA = new b2Vec2(j.localAnchorA[0] / 30, j.localAnchorA[1] / 30);
		    jointDef.localAnchorB = new b2Vec2(j.localAnchorB[0] / 30, j.localAnchorB[1] / 30);
		    jointDef.collideConnected = j.collideConnected;
		    jointDef.length = j.length / 30;
		    jointDef.dampingRatio = j.dampingRatio;
		    jointDef.frequencyHZ = j.frequencyHZ;
		    this.loadedJoints.push(world.CreateJoint(jointDef));
		}
		else if (j.jointType == Joint.JOINT_WELD){
			var jointDef = new b2WeldJointDef;
		    jointDef.bodyA = this.loadedBodies[j.bodyA];
		    jointDef.bodyB = this.loadedBodies[j.bodyB];
		    jointDef.localAnchorA = new b2Vec2(j.localAnchorA[0] / 30, j.localAnchorA[1] / 30);
		    jointDef.localAnchorB = new b2Vec2(j.localAnchorB[0] / 30, j.localAnchorB[1] / 30);
		    jointDef.collideConnected = j.collideConnected;
		    jointDef.referenceAngle = j.referenceAngle;
		    this.loadedJoints.push(world.CreateJoint(jointDef));
	  	}
		else if (j.jointType == Joint.JOINT_REVOLUTE){
		    var jointDef = new b2RevoluteJointDef;
		    jointDef.bodyA = this.loadedBodies[j.bodyA];
		    jointDef.bodyB = this.loadedBodies[j.bodyB];
		    jointDef.localAnchorA = new b2Vec2(j.localAnchorA[0] / 30, j.localAnchorA[1] / 30);
		    jointDef.localAnchorB = new b2Vec2(j.localAnchorB[0] / 30, j.localAnchorB[1] / 30);
		    jointDef.collideConnected = j.collideConnected;
		    jointDef.enableLimit  = j.enableLimit;
		    jointDef.enableMotor  = j.enableMotor;
		    jointDef.lowerAngle   = j.lowerAngle * Math.PI / 180;
		    jointDef.maxMotorTorque = j.maxMotorTorque;
		    jointDef.motorSpeed   = j.motorSpeed;
		    jointDef.referenceAngle = j.referenceAngle;
		    jointDef.upperAngle   = j.upperAngle * Math.PI / 180;
		    this.loadedJoints.push(world.CreateJoint(jointDef));
		}
		else if (j.jointType == Joint.JOINT_PULLEY){
		    var jointDef = new b2PulleyJointDef;
		    jointDef.bodyA = this.loadedBodies[j.bodyA];
		    jointDef.bodyB = this.loadedBodies[j.bodyB];
		    jointDef.localAnchorA = new b2Vec2(j.localAnchorA[0] / 30, j.localAnchorA[1] / 30);
		    jointDef.localAnchorB = new b2Vec2(j.localAnchorB[0] / 30, j.localAnchorB[1] / 30);
		    jointDef.collideConnected = j.collideConnected;
		    jointDef.groundAnchorA = new b2Vec2(j.groundAnchorA[0] / 30, j.groundAnchorA[1] / 30);
		    jointDef.groundAnchorB = new b2Vec2(j.groundAnchorB[0] / 30, j.groundAnchorB[1] / 30);
		    jointDef.lengthA = j.lengthA / 30;
		    jointDef.lengthB = j.lengthB / 30;
		    jointDef.maxLengthA = j.maxLengthA / 30;
		    jointDef.maxLengthB = j.maxLengthB / 30;
		    jointDef.ratio = j.ratio;
		    this.loadedJoints.push(world.CreateJoint(jointDef));
		}

	 	// wheel joint is not supported in box2d-web
	 	else if (j.jointType == Joint.JOINT_WHEEL){
	 	// 	for (var f = this.loadedBodies[j.bodyA].GetFixtureList(); f != null; f = f.GetNext()){
			// 	f.m_filter.groupIndex = -1;
			// }
			// for (var f = this.loadedBodies[j.bodyB].GetFixtureList(); f != null; f = f.GetNext()){
			// 	f.m_filter.groupIndex = -1;
			// }
			// create a new body to use as axle
			// var shape = new b2CircleShape(10 / 30);
			// var fixture = new b2FixtureDef;
			// fixture.density = 0;
			// fixture.restitution = 0;
			// fixture.friction = 0;
			// fixture.shape = shape;
			// fixture.isSensor = true;
	 	// 	var bodyDef = new b2BodyDef;
	 	// 	bodyDef.type = b2Body.b2_dynamicBody;
	 	// 	bodyDef.position.Set(this.loadedBodies[j.bodyB].GetPosition().x + j.localAnchorB[0] / 30, this.loadedBodies[j.bodyB].GetPosition().y + j.localAnchorB[1] / 30);
	 	// 	var axle = world.CreateBody(bodyDef);
	 	// 	axle.CreateFixture(fixture);

		    // var revJointDef = new b2RevoluteJointDef;
		    // revJointDef.bodyA = this.loadedBodies[j.bodyA];
		    // revJointDef.bodyB = axle;
		    // revJointDef.localAnchorA = new b2Vec2(axle.GetPosition().x - this.loadedBodies[j.bodyA].GetPosition().x,
		    // 									 axle.GetPosition().y - this.loadedBodies[j.bodyA].GetPosition().y);//new b2Vec2(j.localAnchorA[0] / 30, j.localAnchorA[1] / 30);
		    // revJointDef.localAnchorB = new b2Vec2(0, 0);
		    // revJointDef.collideConnected = false;
		    // revJointDef.enableMotor  = j.enableMotor;
		    // revJointDef.maxMotorTorque = j.maxMotorTorque;
		    // revJointDef.motorSpeed   = j.motorSpeed;
		    // this.loadedJoints.push(world.CreateJoint(revJointDef));

		    // var distJointDef = new b2DistanceJointDef;
		    // distJointDef.bodyA = axle;
		    // distJointDef.bodyB = this.loadedBodies[j.bodyB];
		    // distJointDef.localAnchorA = new b2Vec2(0, 0);
		    // distJointDef.localAnchorB = new b2Vec2(0,0);
		    // distJointDef.collideConnected = false;
		    // distJointDef.length = 1 / 30;
		    // distJointDef.dampingRatio = 0.075;//j.dampingRatio;
		    // distJointDef.frequencyHZ = 4;//j.frequencyHZ;
		    // this.loadedJoints.push(world.CreateJoint(distJointDef));
		}
	};

	WorldLoader.prototype.createGameObject = function(texture, textureData, body){
		var gameObject = new GameObject();
	  	gameObject.sprite = new Image();
	  	gameObject.sprite.src = texture;
  
		if (textureData.length == 2){
	    	gameObject.sprite.width = textureData[0];
		    gameObject.sprite.height = textureData[1];  
		}
	  	else {
			gameObject.spriteData[0] = textureData[0];
		    gameObject.spriteData[1] = textureData[1];
		    gameObject.spriteData[2] = textureData[2];
		    gameObject.spriteData[3] = textureData[3];
		    gameObject.spriteData[4] = textureData[4];
    		gameObject.spriteData[5] = textureData[5];
  		}

  		gameObject.body = body;
  		this.gameObjects.push(gameObject);
	};

	return new WorldLoader;
});
// box2d objects
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

var mouseX, mouseY, mousePVec, isMouseDown, selectedBody, mouseJoint;
var _navigator, gameObjects = [], bodies = [], joints = [];

function GameObject () {
  this.body;
  this.sprite;
  this.spriteData = [];
}

function GameView(canvas, navigator) {
  this.canvas = canvas;
  this.context = canvas.getContext('2d');
  _navigator = navigator;
  this.world;

  gameObjects = [];
  bodies = [];
  joints = [];

  this.hasLoaded = false;
  this.paused = false;
}

/* SETUP */
GameView.prototype.setup = function(scene, fromFile){
  if (this.context){
    if (fromFile){
      var ref = this;
      $.getJSON(scene, function(data){
        ref.init(data);
      });
    }
    else {
      this.init(scene);
    }  
  }
};

/* RESCALE */
GameView.prototype.rescale = function(){
  // canvas.setAttribute('width', window.innerWidth);
  // canvas.setAttribute('height', window.innerHeight);
  // this.draw();
};

/* INIT */
GameView.prototype.init = function(scene){
  // add event listeners
  this.canvas.addEventListener("mousedown", function(e) {
    isMouseDown = true;
    handleMouseMove(e);
    this.addEventListener("mousemove", handleMouseMove, true);
  }, true);

  this.canvas.addEventListener("mouseup", function() {
    this.removeEventListener("mousemove", handleMouseMove, true);
    isMouseDown = false;
    mouseX = undefined;
    mouseY = undefined;
  }, true);

  // create physics world
  this.world = new b2World(new b2Vec2(0, 10), true);

  // set debug draw
  var debugDraw = new b2DebugDraw();
  debugDraw.SetSprite(this.context);
  debugDraw.SetDrawScale(30.0);
  debugDraw.SetFillAlpha(0.5);
  debugDraw.SetLineThickness(1.0);
  debugDraw.SetFlags(b2DebugDraw.e_shapeBit | b2DebugDraw.e_jointBit);
  this.world.SetDebugDraw(debugDraw);

  // load bodies
  for (var i = 0; i < scene.bodies.length; i++){
    createBody(this.world, scene.bodies[i], true);
  }

  // create joints
  for (var i = 0; i < scene.joints.length; i++){
    createJoint(this.world, scene.joints[i]);
  }

  this.hasLoaded = true;
};

/* DRAW */
GameView.prototype.draw = function(){
  this.world.DrawDebugData();
  this.world.ClearForces();

  for (var i = 0; i < gameObjects.length; i++){
    // handle sprite rotation and translation
    this.context.save();
    this.context.translate(gameObjects[i].body.GetPosition().x * 30, gameObjects[i].body.GetPosition().y * 30);
    this.context.rotate(gameObjects[i].body.GetAngle());
    
    if (gameObjects[i].spriteData.length > 0){
      var spriteData  = gameObjects[i].spriteData,
          sourceX     = spriteData[0],
          sourceY     = spriteData[1],
          sourceW     = spriteData[2],
          sourceH     = spriteData[3],
          imageW      = spriteData[4],
          imageH      = spriteData[5];
      this.context.drawImage(gameObjects[i].sprite, sourceX, sourceY, sourceW, sourceH, -imageW / 2, -imageH / 2, imageW, imageH);
      
    }
    else {
      var imageW = gameObjects[i].sprite.width, imageH = gameObjects[i].sprite.height;
      this.context.drawImage(gameObjects[i].sprite, -imageW / 2, -imageH / 2, imageW, imageH);
    }
    this.context.restore();
  }

};

/* UPDATE */
GameView.prototype.update = function(){
  if(isMouseDown && (!mouseJoint)) {
     var body = getBodyAtMouse(this.world);
     if(body) {
        var md = new b2MouseJointDef();
        md.bodyA = this.world.GetGroundBody();
        md.bodyB = body;
        md.target.Set(mouseX, mouseY);
        md.collideConnected = true;
        md.maxForce = 300.0 * body.GetMass();
        mouseJoint = this.world.CreateJoint(md);
        body.SetAwake(true);
     }
  }
  
  if(mouseJoint) {
     if(isMouseDown) {
        mouseJoint.SetTarget(new b2Vec2(mouseX, mouseY));
     } else {
        this.world.DestroyJoint(mouseJoint);
        mouseJoint = null;
     }
  }

  this.world.Step(1 / 60, 10, 10);
};

GameView.prototype.dispose = function(){

};

GameView.prototype.updateGameLogic = function(){
  if (!this.paused){
    this.update();
  }
  this.draw();
}

function handleMouseMove(e) {
  mouseX = _navigator.screenPointToWorld(e.offsetX, e.offsetY)[0] / 30;
  mouseY = _navigator.screenPointToWorld(e.offsetX, e.offsetY)[1] / 30;
}

function getBodyAtMouse(world) {
  mousePVec = new b2Vec2(mouseX, mouseY);
  var aabb = new b2AABB();
  aabb.lowerBound.Set(mouseX - 0.001, mouseY - 0.001);
  aabb.upperBound.Set(mouseX + 0.001, mouseY + 0.001);
  
  // Query the world for overlapping shapes.
  selectedBody = null;
  world.QueryAABB(getBodyCB, aabb);
  return selectedBody;
}

function getBodyCB(fixture) {
  if(fixture.GetBody().GetType() != b2Body.b2_staticBody) {
     if(fixture.GetShape().TestPoint(fixture.GetBody().GetTransform(), mousePVec)) {
        selectedBody = fixture.GetBody();
        return false;
     }
  }
  return true;
}

function createGameObject(texture, textureData, body){
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
  gameObjects.push(gameObject);
}

function createJoint(world, j){

  if (j.jointType == Joint.JOINT_DISTANCE){
    var jointDef = new b2DistanceJointDef;
    jointDef.bodyA = bodies[j.bodyA];
    jointDef.bodyB = bodies[j.bodyB];
    jointDef.localAnchorA = new b2Vec2(j.localAnchorA[0] / 30, j.localAnchorA[1] / 30);
    jointDef.localAnchorB = new b2Vec2(j.localAnchorB[0] / 30, j.localAnchorB[1] / 30);
    jointDef.collideConnected = j.collideConnected;
    jointDef.length = j.length / 30;
    jointDef.dampingRatio = j.dampingRatio;
    jointDef.frequencyHZ = j.frequencyHZ;
    world.CreateJoint(jointDef);
  }
  else if (j.jointType == Joint.JOINT_WELD){
    var jointDef = new b2WeldJointDef;
    jointDef.bodyA = bodies[j.bodyA];
    jointDef.bodyB = bodies[j.bodyB];
    jointDef.localAnchorA = new b2Vec2(j.localAnchorA[0] / 30, j.localAnchorA[1] / 30);
    jointDef.localAnchorB = new b2Vec2(j.localAnchorB[0] / 30, j.localAnchorB[1] / 30);
    jointDef.collideConnected = j.collideConnected;
    jointDef.referenceAngle = j.referenceAngle;
    joints.push(world.CreateJoint(jointDef));
  }
  else if (j.jointType == Joint.JOINT_REVOLUTE){
    var jointDef = new b2RevoluteJointDef;
    jointDef.bodyA = bodies[j.bodyA];
    jointDef.bodyB = bodies[j.bodyB];
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
    joints.push(world.CreateJoint(jointDef));
  }
  else if (j.jointType == Joint.JOINT_PULLEY){
    var jointDef = new b2PulleyJointDef;
    jointDef.bodyA = bodies[j.bodyA];
    jointDef.bodyB = bodies[j.bodyB];
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

    joints.push(world.CreateJoint(jointDef));
  }
  // else if (j.jointType == Joint.JOINT_WHEEL){
  //   this.localAxisA   = [0, 1];
  //   this.enableMotor  = false;
  //   this.maxMotorTorque = 100;
  //   this.motorSpeed   = 100;
  //   this.frequencyHZ  = 60;
  //   this.dampingRatio   = 1;
  // }
}

function createBody(world, b, isPhysicsBody){
  var pB;
  if (isPhysicsBody){
    pB = b;
  }
  else {
    pB = b.toPhysics();
  }

  var bodyDef = new b2BodyDef;
  bodyDef.type = pB.type;
  bodyDef.position.Set(pB.position[0] / 30, pB.position[1] / 30);
  var body = world.CreateBody(bodyDef);
  body.SetAngle(pB.rotation * Math.PI / 180);
  body.SetBullet(pB.isBullet);
  body.SetFixedRotation(pB.isFixedRotation);

  bodies.push(body);

  if (pB.texture)
    createGameObject(pB.texture, pB.textureData, body);

  for (var i = 0; i < pB.fixtures.length; i++){
     var f = pB.fixtures[i];
     var fixture = new b2FixtureDef;
     fixture.density = f.density;
     fixture.restitution = f.restitution;
     fixture.friction = f.friction;
     fixture.isSensor = f.isSensor;

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
  return body;
};
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
    b2MouseJointDef =  Box2D.Dynamics.Joints.b2MouseJointDef;

var mouseX, mouseY, mousePVec, isMouseDown, selectedBody, mouseJoint;

function GameView(canvas) {
  this.canvas = canvas;
  this.context = canvas.getContext('2d');
  this.world;
}

/* SETUP */
GameView.prototype.setup = function(scene){
  if (this.context){
    this.init(scene);
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
  debugDraw.SetFlags(b2DebugDraw.e_shapeBit | b2DebugDraw.e_jointBit | b2DebugDraw.e_centerOfMassBit);
  this.world.SetDebugDraw(debugDraw);

  // load bodies
  for (var i = 0; i < scene.bodies.length; i++){
    createBody(this.world, scene.bodies[i]);
  }

};

/* DRAW */
GameView.prototype.draw = function(){
  this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
  this.context.fillStyle = "#fff";
  this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
  
  this.world.Step(1 / 60, 10, 10);
  this.world.DrawDebugData();
  this.world.ClearForces();
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
};

GameView.prototype.updateGameLogic = function(){
  this.update();
  this.draw();
}

function handleMouseMove(e) {
  mouseX = (e.offsetX) / 30;
  mouseY = (e.offsetY) / 30;
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

function createBody(world, b){
  var pB = b.toPhysics();

  var bodyDef = new b2BodyDef;
  bodyDef.type = pB.type;
  bodyDef.position.Set(pB.position[0] / 30, pB.position[1] / 30);
  var body = world.CreateBody(bodyDef);
  body.SetAngle(pB.rotation * Math.PI / 180);
  body.SetBullet(pB.isBullet);

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
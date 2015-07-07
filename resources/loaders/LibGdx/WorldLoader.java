package physics;

/*
Author: Amit Kumar Mehar

This software is provided 'as-is', without any express or implied
warranty.  In no event will the authors be held liable for any damages
arising from the use of this software.
Permission is granted to anyone to use this software for any purpose,
including commercial applications, and to alter it and redistribute it
freely, subject to the following restrictions:
1. The origin of this software must not be misrepresented; you must not
claim that you wrote the original software. If you use this software
in a product, an acknowledgment in the product documentation would be
appreciated but is not required.
2. Altered source versions must be plainly marked as such, and must not be
misrepresented as being the original software.
3. This notice may not be removed or altered from any source distribution.
*/

import java.io.BufferedReader;
import java.io.IOException;
import java.util.ArrayList;

import com.amu.src.json.JSONArray;
import com.amu.src.json.JSONObject;
import com.badlogic.gdx.Gdx;
import com.badlogic.gdx.files.FileHandle;
import com.badlogic.gdx.math.Vector2;
import com.badlogic.gdx.physics.box2d.Body;
import com.badlogic.gdx.physics.box2d.BodyDef;
import com.badlogic.gdx.physics.box2d.BodyDef.BodyType;
import com.badlogic.gdx.physics.box2d.ChainShape;
import com.badlogic.gdx.physics.box2d.CircleShape;
import com.badlogic.gdx.physics.box2d.FixtureDef;
import com.badlogic.gdx.physics.box2d.Joint;
import com.badlogic.gdx.physics.box2d.PolygonShape;
import com.badlogic.gdx.physics.box2d.World;
import com.badlogic.gdx.physics.box2d.joints.DistanceJoint;
import com.badlogic.gdx.physics.box2d.joints.DistanceJointDef;
import com.badlogic.gdx.physics.box2d.joints.GearJoint;
import com.badlogic.gdx.physics.box2d.joints.GearJointDef;
import com.badlogic.gdx.physics.box2d.joints.PrismaticJoint;
import com.badlogic.gdx.physics.box2d.joints.PrismaticJointDef;
import com.badlogic.gdx.physics.box2d.joints.PulleyJoint;
import com.badlogic.gdx.physics.box2d.joints.PulleyJointDef;
import com.badlogic.gdx.physics.box2d.joints.RevoluteJoint;
import com.badlogic.gdx.physics.box2d.joints.RevoluteJointDef;
import com.badlogic.gdx.physics.box2d.joints.RopeJoint;
import com.badlogic.gdx.physics.box2d.joints.RopeJointDef;
import com.badlogic.gdx.physics.box2d.joints.WeldJoint;
import com.badlogic.gdx.physics.box2d.joints.WeldJointDef;
import com.badlogic.gdx.physics.box2d.joints.WheelJoint;
import com.badlogic.gdx.physics.box2d.joints.WheelJointDef;

/* 
	Json library can be downloaded from : https://github.com/douglascrockford/JSON-java
*/

public class WorldLoader {
	/** meter to pixel ratio */
	public static float RATIO = 30;
	
	private BodyType bodyTypes[] = {
		BodyType.StaticBody,
		BodyType.KinematicBody,
		BodyType.DynamicBody
	};
	private enum ShapeTypes {
		SHAPE_BOX,
		SHAPE_CIRCLE,
		SHAPE_POLYGON,
		SHAPE_CHAIN
	};
	private enum JointTypes {
		JOINT_DISTANCE,
		JOINT_WELD,
		JOINT_REVOLUTE,
		JOINT_WHEEL,
		JOINT_PULLEY,
		JOINT_GEAR, 
		JOINT_PRISMATIC,
		JOINT_ROPE
	};
	
	/** array list of all the bodies loaded to use when creating joints **/
	public ArrayList<Body> loadedBodies;
	
	/** array list of all the joints loaded to use when creating gear joints **/
	private ArrayList<Joint> loadedJoints;
	
	/** to offset scene's position (in pixels) **/
	public float offsetX = 0, offsetY = 0;
	
	/** ready the loader to load new scene **/
	private void reset(){
		if (loadedBodies != null){
			loadedBodies.clear();
			loadedBodies = null;
		}
		loadedBodies = new ArrayList<Body>();
		if (loadedJoints != null){
			loadedJoints.clear();
			loadedJoints = null;
		}
		loadedJoints = new ArrayList<Joint>();
	}
	
	/**
	 * @param data
	 * 			path to json file
	 * @param world
	 * 			world to which bodies will be added
	 * @throws
	 * 			throws IOException if file is not available
	 */
	public void loadJsonScene(String data, World world) throws IOException{
		// reset loader
		reset();
		
		FileHandle handle = Gdx.files.internal(data);
		BufferedReader reader = handle.reader(255);
		String line = null;
		StringBuilder output = new StringBuilder();
		while ((line = reader.readLine()) != null){
			output.append(line);
		}
		String jsonData = output.toString();
		
		JSONObject scene = new JSONObject(jsonData);
		JSONArray bodies = scene.getJSONArray("bodies");
		for (int i = 0; i < bodies.length(); i++){
			JSONObject jsonBody = bodies.getJSONObject(i);
			BodyDef bodyDef = new BodyDef();
			bodyDef.type = bodyTypes[jsonBody.getInt("type")];
			Body body = world.createBody(bodyDef);
			body.setBullet(jsonBody.getBoolean("isBullet"));
			body.setUserData(jsonBody.getString("userData"));
			body.setTransform	(	
									(float) (offsetX / RATIO + jsonBody .getJSONArray("position").getDouble(0) / RATIO), 
									(float) (offsetY / RATIO - jsonBody .getJSONArray("position").getDouble(1) / RATIO), 
									(float) (-jsonBody.getDouble("rotation") * Math.PI / 180)
								);
			body.setFixedRotation(jsonBody.getBoolean("isFixedRotation"));
			body.setLinearDamping((float) jsonBody.getDouble("linearDamping"));
			body.setAngularDamping((float) jsonBody.getDouble("angularDamping"));
			
			// add body to array list to use when creating joints
			loadedBodies.add(body);
			
			ArrayList<FixtureDef> fixtures = loadJsonFixture(jsonBody .getJSONArray("fixtures"));
			for (int j = 0; j < fixtures.size(); j++){
				body.createFixture(fixtures.get(j));
			}
		}
		
		JSONArray joints = scene.getJSONArray("joints");
		createJoints(joints, world);
	}
	
	/**
	 * 
	 * @param jsonFixtures
	 * 			json array containing fixture information
	 * @return
	 * 			returns array list of box2d fixture definition
	 */
	private ArrayList<FixtureDef> loadJsonFixture(JSONArray jsonFixtures){
		ArrayList<FixtureDef> fixtures = new ArrayList<FixtureDef>();
		
		for (int i = 0; i < jsonFixtures.length(); i++){
			JSONObject jsonFixture = jsonFixtures.getJSONObject(i);
			float 	density = (float) jsonFixture.getDouble("density"), 
					restitution = (float) jsonFixture.getDouble("restitution"), 
					friction = (float) jsonFixture.getDouble("friction");
			short  	maskBits = (short) jsonFixture.getDouble("maskBits"),
					categoryBits = (short) jsonFixture.getDouble("categoryBits"),
					groupIndex = (short) jsonFixture.getDouble("groupIndex");
			boolean isSensor = jsonFixture.getBoolean("isSensor");
			
			for (int k = 0; k < jsonFixture.getJSONArray("shapes").length(); k++){
				JSONObject jsonShape = jsonFixture.getJSONArray("shapes").getJSONObject(k);
				
				FixtureDef fixture = new FixtureDef();
				fixture.density = density;
				fixture.friction = friction;
				fixture.restitution = restitution;
				fixture.isSensor = isSensor;
				fixture.filter.maskBits = maskBits;
				fixture.filter.categoryBits = categoryBits;
				fixture.filter.groupIndex = groupIndex;
				
				Vector2 position = new Vector2(jsonShape.getJSONArray("position").getInt(0) / RATIO,
						-jsonShape.getJSONArray("position").getInt(1) / RATIO);

				if (jsonShape.getInt("type") == ShapeTypes.SHAPE_BOX.ordinal()){
					PolygonShape shape = new PolygonShape();
					shape.setAsBox((float)jsonShape.getDouble("width") / (2 * RATIO), (float)jsonShape.getDouble("height") / (2 * RATIO), position, 0);
					fixture.shape = shape;
				}
				else if (jsonShape.getInt("type") == ShapeTypes.SHAPE_CIRCLE.ordinal()){
					CircleShape shape = new CircleShape();
					shape.setRadius((float) jsonShape.getDouble("radius") * 2 / RATIO);
					shape.setPosition(position);
					fixture.shape = shape;
				}
				else if (jsonShape.getInt("type") == ShapeTypes.SHAPE_POLYGON.ordinal()){
					PolygonShape shape = new PolygonShape();
					JSONArray jsonVertices = jsonShape.getJSONArray("vertices");
					Vector2 vertices[] = new Vector2[jsonVertices.length()];
					for (int j = 0; j < jsonVertices.length(); j++){
						Vector2 vertex = new Vector2(position.x + jsonVertices.getJSONArray(j).getInt(0) / RATIO, 
								position.y - jsonVertices.getJSONArray(j).getInt(1) / RATIO);
						vertices[j] = vertex;
					}
					shape.set(vertices);
					fixture.shape = shape;
				}
				else if (jsonShape.getInt("type") == ShapeTypes.SHAPE_CHAIN.ordinal()){
					ChainShape shape = new ChainShape();
					JSONArray jsonVertices = jsonShape.getJSONArray("vertices");
					Vector2 vertices[] = new Vector2[jsonVertices.length()];
					for (int j = 0; j < jsonVertices.length(); j++){
						Vector2 vertex = new Vector2(position.x + jsonVertices.getJSONArray(j).getInt(0) / RATIO, 
								position.y - jsonVertices.getJSONArray(j).getInt(1) / RATIO);
						vertices[j] = vertex;
					}
					shape.createChain(vertices);
					fixture.shape = shape;
				}
				fixtures.add(fixture);
			}
		}
		return fixtures;
	}
	
	/**
	 * 
	 * @param jsonJoints
	 * 			json array containing joints information
	 * @param world
	 * 			world in which joints will be created
	 */
	private void createJoints(JSONArray jsonJoints, World world){
		for (int i = 0; i < jsonJoints.length(); i++){
			JSONObject jsonJoint = jsonJoints.getJSONObject(i);
			
			if (jsonJoint.getInt("jointType") == JointTypes.JOINT_DISTANCE.ordinal()){
				DistanceJointDef jointDef = new DistanceJointDef();
				jointDef.bodyA = loadedBodies.get(jsonJoint.getInt("bodyA"));
				jointDef.bodyB = loadedBodies.get(jsonJoint.getInt("bodyB"));
				jointDef.localAnchorA.set(new Vector2(jsonJoint.getJSONArray("localAnchorA").getInt(0) / RATIO,
													-jsonJoint.getJSONArray("localAnchorA").getInt(1) / RATIO));
				jointDef.localAnchorB.set(new Vector2(jsonJoint.getJSONArray("localAnchorB").getInt(0) / RATIO,
						-jsonJoint.getJSONArray("localAnchorB").getInt(1) / RATIO));
			    jointDef.collideConnected = jsonJoint.getBoolean("collideConnected");
			    jointDef.length           = (float)jsonJoint.getDouble("length") / 30;
			    jointDef.dampingRatio 	  = (float)jsonJoint.getDouble("dampingRatio");
			    jointDef.frequencyHz      = (float)jsonJoint.getDouble("frequencyHZ");
			    
			    DistanceJoint joint = (DistanceJoint) world.createJoint(jointDef);
			    joint.setUserData(jsonJoint.getString("userData"));
			    loadedJoints.add(joint);
			}
			else if (jsonJoint.getInt("jointType") == JointTypes.JOINT_WELD.ordinal()){
				WeldJointDef jointDef = new WeldJointDef();
				jointDef.bodyA = loadedBodies.get(jsonJoint.getInt("bodyA"));
				jointDef.bodyB = loadedBodies.get(jsonJoint.getInt("bodyB"));
				jointDef.localAnchorA.set(new Vector2(jsonJoint.getJSONArray("localAnchorA").getInt(0) / RATIO,
													-jsonJoint.getJSONArray("localAnchorA").getInt(1) / RATIO));
				jointDef.localAnchorB.set(new Vector2(jsonJoint.getJSONArray("localAnchorB").getInt(0) / RATIO,
						-jsonJoint.getJSONArray("localAnchorB").getInt(1) / RATIO));
				jointDef.collideConnected = jsonJoint.getBoolean("collideConnected");
			    
				jointDef.referenceAngle = (float) (-jsonJoint.getDouble("referenceAngle") * Math.PI / 180);
				
				WeldJoint joint = (WeldJoint) world.createJoint(jointDef);
			    joint.setUserData(jsonJoint.getString("userData"));
			    loadedJoints.add(joint);
			}
			else if (jsonJoint.getInt("jointType") == JointTypes.JOINT_REVOLUTE.ordinal()){
				RevoluteJointDef jointDef = new RevoluteJointDef();
				jointDef.bodyA = loadedBodies.get(jsonJoint.getInt("bodyA"));
				jointDef.bodyB = loadedBodies.get(jsonJoint.getInt("bodyB"));
				jointDef.localAnchorA.set(new Vector2(jsonJoint.getJSONArray("localAnchorA").getInt(0) / RATIO,
													-jsonJoint.getJSONArray("localAnchorA").getInt(1) / RATIO));
				jointDef.localAnchorB.set(new Vector2(jsonJoint.getJSONArray("localAnchorB").getInt(0) / RATIO,
						-jsonJoint.getJSONArray("localAnchorB").getInt(1) / RATIO));
			    
				jointDef.collideConnected = jsonJoint.getBoolean("collideConnected");;
			    jointDef.enableLimit  	= jsonJoint.getBoolean("enableLimit");
			    jointDef.enableMotor  	= jsonJoint.getBoolean("enableMotor");
			    jointDef.upperAngle   	= (float) -(jsonJoint.getDouble("lowerAngle") * Math.PI / 180);			// because of y-axis flipping
			    jointDef.maxMotorTorque = (float)jsonJoint.getDouble("maxMotorTorque");
			    jointDef.motorSpeed   	= (float)-jsonJoint.getDouble("motorSpeed");
			    jointDef.referenceAngle = (float) -(jsonJoint.getDouble("referenceAngle") * Math.PI / 180);
			    jointDef.lowerAngle   	= (float) -(jsonJoint.getDouble("upperAngle") * Math.PI / 180);			// because of y-axis flipping
				
				RevoluteJoint joint = (RevoluteJoint) world.createJoint(jointDef);
				joint.setUserData(jsonJoint.getString("userData"));
				loadedJoints.add(joint);
			}
			else if (jsonJoint.getInt("jointType") == JointTypes.JOINT_WHEEL.ordinal()){
				WheelJointDef jointDef = new WheelJointDef();
				jointDef.bodyA = loadedBodies.get(jsonJoint.getInt("bodyA"));
				jointDef.bodyB = loadedBodies.get(jsonJoint.getInt("bodyB"));
				jointDef.localAnchorA.set(new Vector2(jsonJoint.getJSONArray("localAnchorA").getInt(0) / RATIO,
													-jsonJoint.getJSONArray("localAnchorA").getInt(1) / RATIO));
				jointDef.localAnchorB.set(new Vector2(jsonJoint.getJSONArray("localAnchorB").getInt(0) / RATIO,
						-jsonJoint.getJSONArray("localAnchorB").getInt(1) / RATIO));
			    
				jointDef.localAxisA.set(new Vector2((float)jsonJoint.getJSONArray("localAxisA").getDouble(0), (float)-jsonJoint.getJSONArray("localAxisA").getDouble(1)));
				
				jointDef.collideConnected = jsonJoint.getBoolean("collideConnected");;
			    jointDef.enableMotor  	  = jsonJoint.getBoolean("enableMotor");
			    jointDef.maxMotorTorque   = (float)jsonJoint.getDouble("maxMotorTorque");
			    jointDef.motorSpeed   	  = (float)-jsonJoint.getDouble("motorSpeed");
			    jointDef.dampingRatio     = (float)jsonJoint.getDouble("dampingRatio");
			    jointDef.frequencyHz      = (float)jsonJoint.getDouble("frequencyHZ");
			    
				WheelJoint joint = (WheelJoint) world.createJoint(jointDef);
				joint.setUserData(jsonJoint.getString("userData"));
				loadedJoints.add(joint);
			}
			else if (jsonJoint.getInt("jointType") == JointTypes.JOINT_PULLEY.ordinal()){
				PulleyJointDef jointDef = new PulleyJointDef();
				jointDef.bodyA = loadedBodies.get(jsonJoint.getInt("bodyA"));
				jointDef.bodyB = loadedBodies.get(jsonJoint.getInt("bodyB"));
				jointDef.collideConnected = jsonJoint.getBoolean("collideConnected");
				jointDef.localAnchorA.set(new Vector2(jsonJoint.getJSONArray("localAnchorA").getInt(0) / RATIO,
													-jsonJoint.getJSONArray("localAnchorA").getInt(1) / RATIO));
				jointDef.localAnchorB.set(new Vector2(jsonJoint.getJSONArray("localAnchorB").getInt(0) / RATIO,
						-jsonJoint.getJSONArray("localAnchorB").getInt(1) / RATIO));
				jointDef.groundAnchorA.set(new Vector2(offsetX / RATIO + jsonJoint.getJSONArray("groundAnchorA").getInt(0) / RATIO,
						offsetY / RATIO - jsonJoint.getJSONArray("groundAnchorA").getInt(1) / RATIO));
				jointDef.groundAnchorB.set(new Vector2(offsetX / RATIO + jsonJoint.getJSONArray("groundAnchorB").getInt(0) / RATIO,
						offsetY / RATIO - jsonJoint.getJSONArray("groundAnchorB").getInt(1) / RATIO));
				jointDef.lengthA = (float)jsonJoint.getDouble("maxLengthA") / RATIO;
				jointDef.lengthB = (float)jsonJoint.getDouble("maxLengthB") / RATIO;
				jointDef.ratio = (float)jsonJoint.getDouble("ratio");
				
				PulleyJoint joint = (PulleyJoint) world.createJoint(jointDef);
			    joint.setUserData(jsonJoint.getString("userData"));
			    loadedJoints.add(joint);
			}
			else if (jsonJoint.getInt("jointType") == JointTypes.JOINT_GEAR.ordinal()){
				GearJointDef jointDef = new GearJointDef();
				jointDef.bodyA = loadedBodies.get(jsonJoint.getInt("bodyA"));
				jointDef.bodyB = loadedBodies.get(jsonJoint.getInt("bodyB"));
				jointDef.collideConnected = jsonJoint.getBoolean("collideConnected");
				jointDef.ratio = (float)jsonJoint.getDouble("ratio");
				
				jointDef.joint1 = loadedJoints.get(jsonJoint.getInt("joint1"));
				jointDef.joint2 = loadedJoints.get(jsonJoint.getInt("joint2"));
				
				GearJoint joint = (GearJoint) world.createJoint(jointDef);
				joint.setUserData(jsonJoint.getString("userData"));
				loadedJoints.add(joint);
			}
			else if (jsonJoint.getInt("jointType") == JointTypes.JOINT_PRISMATIC.ordinal()){
				PrismaticJointDef jointDef = new PrismaticJointDef();
				jointDef.bodyA = loadedBodies.get(jsonJoint.getInt("bodyA"));
				jointDef.bodyB = loadedBodies.get(jsonJoint.getInt("bodyB"));
				jointDef.localAnchorA.set(new Vector2(jsonJoint.getJSONArray("localAnchorA").getInt(0) / RATIO,
													-jsonJoint.getJSONArray("localAnchorA").getInt(1) / RATIO));
				jointDef.localAnchorB.set(new Vector2(jsonJoint.getJSONArray("localAnchorB").getInt(0) / RATIO,
						-jsonJoint.getJSONArray("localAnchorB").getInt(1) / RATIO));
			    
				jointDef.localAxisA.set(new Vector2((float)jsonJoint.getJSONArray("localAxisA").getDouble(0), (float)-jsonJoint.getJSONArray("localAxisA").getDouble(1)));
				
				jointDef.collideConnected = jsonJoint.getBoolean("collideConnected");;
			    jointDef.enableLimit  	= jsonJoint.getBoolean("enableLimit");
			    jointDef.enableMotor  	= jsonJoint.getBoolean("enableMotor");
			    jointDef.lowerTranslation  = (float) (jsonJoint.getDouble("lowerTranslation") / RATIO);
			    jointDef.maxMotorForce = (float)jsonJoint.getDouble("maxMotorForce");
			    jointDef.motorSpeed   	= (float)jsonJoint.getDouble("motorSpeed");
			    jointDef.referenceAngle = (float) (-jsonJoint.getDouble("referenceAngle") * Math.PI / 180);
			    jointDef.upperTranslation   	= (float) (jsonJoint.getDouble("upperTranslation") / RATIO);;
				
				PrismaticJoint joint = (PrismaticJoint) world.createJoint(jointDef);
				joint.setUserData(jsonJoint.getString("userData"));
				loadedJoints.add(joint);
			}
			else if (jsonJoint.getInt("jointType") == JointTypes.JOINT_ROPE.ordinal()){
				RopeJointDef jointDef = new RopeJointDef();
				jointDef.bodyA = loadedBodies.get(jsonJoint.getInt("bodyA"));
				jointDef.bodyB = loadedBodies.get(jsonJoint.getInt("bodyB"));
				jointDef.localAnchorA.set(new Vector2(jsonJoint.getJSONArray("localAnchorA").getInt(0) / RATIO,
													-jsonJoint.getJSONArray("localAnchorA").getInt(1) / RATIO));
				jointDef.localAnchorB.set(new Vector2(jsonJoint.getJSONArray("localAnchorB").getInt(0) / RATIO,
						-jsonJoint.getJSONArray("localAnchorB").getInt(1) / RATIO));
				
				jointDef.maxLength = (float) (jsonJoint.getDouble("maxLength") / RATIO);
				
				RopeJoint joint = (RopeJoint) world.createJoint(jointDef);
				joint.setUserData(jsonJoint.getString("userData"));
				loadedJoints.add(joint);
			}
			
		}
	}
}

#include "Box2dWorldLoader.h"

Box2dWorldLoader::Box2dWorldLoader()
{
}

Box2dWorldLoader::~Box2dWorldLoader()
{
}

void Box2dWorldLoader::setOffset(float x, float y){
	offsetX = x;
	offsetY = y;
}

void Box2dWorldLoader::loadJsonScene(const char* file, b2World *world){
	cocos2d::FileUtils::getInstance()->addSearchPath("Scenes");
	std::string fullPath = cocos2d::FileUtils::getInstance()->fullPathForFilename(file);
	ssize_t bufferSize;
	const char* mFileData = (const char*)cocos2d::FileUtils::getInstance()->getFileData(fullPath.c_str(), "r", &bufferSize);
	std::string scene(mFileData, bufferSize);

	rapidjson::Document jsonScene;

	if (jsonScene.Parse<0>(scene.c_str()).HasParseError() == false){
		rapidjson::Value& jsonBodies = jsonScene["bodies"];
		loadBodies(jsonBodies, world);
		rapidjson::Value& jsonJoints = jsonScene["joints"];
		loadJoints(jsonJoints, world);
	}
	else {
		cocos2d::log("could not parse the scene!");
	}
}
void Box2dWorldLoader::loadBodies(rapidjson::Value &jsonBodies, b2World *world){
	for (int i = 0; i < jsonBodies.Size(); i++){
		rapidjson::Value &jsonBody = jsonBodies[i];

		rapidjson::Value &pos = jsonBody["position"];
		b2Vec2 position;
		position.x = offsetX / PTM_RATIO + pos[rapidjson::SizeType(0)].GetDouble() / PTM_RATIO;
		position.y = offsetY / PTM_RATIO - pos[rapidjson::SizeType(1)].GetDouble() / PTM_RATIO;
		float rotation = -jsonBody["rotation"].GetDouble() * M_PI / 180.0,
			linearDamping = jsonBody["linearDamping"].GetDouble(),
			angularDamping = jsonBody["angularDamping"].GetDouble();

		bool isBullet = jsonBody["isBullet"].GetBool(),
			isFixedRotation = jsonBody["isFixedRotation"].GetBool();
		int	bodyType = jsonBody["type"].GetInt();
		std::string userData = jsonBody["userData"].GetString();

		b2BodyDef *bodyDef = new b2BodyDef();
		if (bodyType == 0){
			bodyDef->type = b2_staticBody;
		}
		else if (bodyType == 1){
			bodyDef->type = b2_kinematicBody;
		}
		else if (bodyType == 2){
			bodyDef->type = b2_dynamicBody;
		}

		b2Body *body = world->CreateBody(bodyDef);
		body->SetUserData(&userData);
		body->SetTransform(position, rotation);
		body->SetBullet(isBullet);
		body->SetFixedRotation(isFixedRotation);
		body->SetLinearDamping(linearDamping);
		body->SetAngularDamping(angularDamping);

		rapidjson::Value &jsonFixtures = jsonBody["fixtures"];
		std::vector<b2FixtureDef*> fixtures = loadJsonFixture(jsonFixtures);
		for (int j = 0; j < fixtures.size(); j++){
			body->CreateFixture(fixtures.at(j));
		}

		loadedBodies.push_back(body);
	}
}

std::vector<b2FixtureDef*> Box2dWorldLoader::loadJsonFixture(rapidjson::Value &jsonFixtures){
	std::vector<b2FixtureDef*> fixtures;
	for (int i = 0; i < jsonFixtures.Size(); i++){
		rapidjson::Value &jsonFixture = jsonFixtures[i];
		
		float density = jsonFixture["density"].GetDouble(),
			restitution = jsonFixture["restitution"].GetDouble(),
			friction = jsonFixture["friction"].GetDouble();
		int	maskBits = jsonFixture["maskBits"].GetInt(),
			categoryBits = jsonFixture["categoryBits"].GetInt(),
			groupIndex = jsonFixture["groupIndex"].GetInt();
		bool isSensor = jsonFixture["isSensor"].GetBool();

		rapidjson::Value &jsonShapes = jsonFixture["shapes"];
		for (int j = 0; j < jsonShapes.Size(); j++){
			b2FixtureDef *fixtureDef = new b2FixtureDef();
			fixtureDef->isSensor = isSensor;
			fixtureDef->density = density;
			fixtureDef->friction = friction;
			fixtureDef->restitution = restitution;

			fixtureDef->filter.maskBits = maskBits;
			fixtureDef->filter.categoryBits = categoryBits;
			fixtureDef->filter.groupIndex = groupIndex;			

			rapidjson::Value &jsonShape = jsonShapes[j];
			int shapeType = jsonShape["type"].GetInt();
			
			rapidjson::Value &pos = jsonShape["position"];
			b2Vec2 position;
			position.x = pos[rapidjson::SizeType(0)].GetDouble() / PTM_RATIO;
			position.y = -pos[rapidjson::SizeType(1)].GetDouble() / PTM_RATIO;

			if (shapeType == SHAPE_BOX){
				float width = jsonShape["width"].GetDouble() / PTM_RATIO;
				float height = jsonShape["height"].GetDouble() /  PTM_RATIO;
				b2PolygonShape *shape = new b2PolygonShape();
				shape->SetAsBox(width / 2, height / 2, position, 0);
				fixtureDef->shape = shape;
			}
			else if (shapeType == SHAPE_CIRCLE){
				float radius = jsonShape["radius"].GetDouble() * 2 / PTM_RATIO;
				b2CircleShape *shape = new b2CircleShape();
				shape->m_radius = radius;
				shape->m_p.Set(position.x, position.y);
				fixtureDef->shape = shape;
			}
			else if (shapeType == SHAPE_POLYGON){
				rapidjson::Value &jsonVertices = jsonShape["vertices"];
				int vertCount = jsonVertices.Size();
				b2Vec2 *vertices = new b2Vec2[vertCount];
				for (int k = 0; k < vertCount; k++){
					rapidjson::Value &jsonVert = jsonVertices[k];
					vertices[k] = b2Vec2(position.x + jsonVert[rapidjson::SizeType(0)].GetDouble() / PTM_RATIO,
										position.y - jsonVert[rapidjson::SizeType(1)].GetDouble() / PTM_RATIO);
				}
				b2PolygonShape *shape = new b2PolygonShape();
				shape->Set(vertices, vertCount);
				fixtureDef->shape = shape;
			}
			else if (shapeType == SHAPE_CHAIN){
				rapidjson::Value &jsonVertices = jsonShape["vertices"];
				int vertCount = jsonVertices.Size();
				b2ChainShape *shape = new b2ChainShape();
				for (int k = 0; k < vertCount; k++){
					rapidjson::Value &jsonVert = jsonVertices[k];
					b2Vec2 nextVert = b2Vec2(position.x + jsonVert[rapidjson::SizeType(0)].GetDouble() / PTM_RATIO,
											position.y - jsonVert[rapidjson::SizeType(1)].GetDouble() / PTM_RATIO);
					shape->SetNextVertex(nextVert);
				}
				fixtureDef->shape = shape;
			}

			fixtures.push_back(fixtureDef);
		}
	}
	return fixtures;
}

void Box2dWorldLoader::loadJoints(rapidjson::Value &jsonJoints, b2World *world){
	for (int i = 0; i < jsonJoints.Size(); i++){
		rapidjson::Value &jsonJoint = jsonJoints[i];

		int jointType = jsonJoint["jointType"].GetInt();
		
		if (jointType == JOINT_DISTANCE){
			b2DistanceJointDef *jointDef = new b2DistanceJointDef();
			jointDef->bodyA = loadedBodies.at(jsonJoint["bodyA"].GetInt());
			jointDef->bodyB = loadedBodies.at(jsonJoint["bodyB"].GetInt());
			rapidjson::Value &localAnchorA = jsonJoint["localAnchorA"];
			rapidjson::Value &localAnchorB = jsonJoint["localAnchorB"];
			jointDef->localAnchorA.Set(localAnchorA[rapidjson::SizeType(0)].GetDouble() / PTM_RATIO, -localAnchorA[rapidjson::SizeType(1)].GetDouble() / PTM_RATIO);
			jointDef->localAnchorB.Set(localAnchorB[rapidjson::SizeType(0)].GetDouble() / PTM_RATIO, -localAnchorB[rapidjson::SizeType(1)].GetDouble() / PTM_RATIO);
			jointDef->collideConnected = jsonJoint["collideConnected"].GetBool();
			jointDef->length = jsonJoint["length"].GetDouble() / PTM_RATIO;
			jointDef->dampingRatio = jsonJoint["dampingRatio"].GetDouble();
			jointDef->frequencyHz = jsonJoint["frequencyHZ"].GetDouble();

			b2DistanceJoint *joint = (b2DistanceJoint*) world->CreateJoint(jointDef);
			std::string userData = jsonJoint["userData"].GetString();
			joint->SetUserData(&userData);
			loadedJoints.push_back(joint);
		}
		else if (jointType == JOINT_WELD){
			b2WeldJointDef *jointDef = new b2WeldJointDef();
			jointDef->bodyA = loadedBodies.at(jsonJoint["bodyA"].GetInt());
			jointDef->bodyB = loadedBodies.at(jsonJoint["bodyB"].GetInt());
			rapidjson::Value &localAnchorA = jsonJoint["localAnchorA"];
			rapidjson::Value &localAnchorB = jsonJoint["localAnchorB"];
			jointDef->localAnchorA.Set(localAnchorA[rapidjson::SizeType(0)].GetDouble() / PTM_RATIO, -localAnchorA[rapidjson::SizeType(1)].GetDouble() / PTM_RATIO);
			jointDef->localAnchorB.Set(localAnchorB[rapidjson::SizeType(0)].GetDouble() / PTM_RATIO, -localAnchorB[rapidjson::SizeType(1)].GetDouble() / PTM_RATIO);
			jointDef->collideConnected = jsonJoint["collideConnected"].GetBool();
			jointDef->referenceAngle = -jsonJoint["referenceAngle"].GetDouble() * M_PI / 180;

			b2WeldJoint *joint = (b2WeldJoint*)world->CreateJoint(jointDef);
			std::string userData = jsonJoint["userData"].GetString();
			joint->SetUserData(&userData);
			loadedJoints.push_back(joint);
		}
		else if (jointType == JOINT_REVOLUTE){
			b2RevoluteJointDef *jointDef = new b2RevoluteJointDef();
			jointDef->bodyA = loadedBodies.at(jsonJoint["bodyA"].GetInt());
			jointDef->bodyB = loadedBodies.at(jsonJoint["bodyB"].GetInt());
			rapidjson::Value &localAnchorA = jsonJoint["localAnchorA"];
			rapidjson::Value &localAnchorB = jsonJoint["localAnchorB"];
			jointDef->localAnchorA.Set(localAnchorA[rapidjson::SizeType(0)].GetDouble() / PTM_RATIO, -localAnchorA[rapidjson::SizeType(1)].GetDouble() / PTM_RATIO);
			jointDef->localAnchorB.Set(localAnchorB[rapidjson::SizeType(0)].GetDouble() / PTM_RATIO, -localAnchorB[rapidjson::SizeType(1)].GetDouble() / PTM_RATIO);
			jointDef->collideConnected = jsonJoint["collideConnected"].GetBool();
			jointDef->enableLimit = jsonJoint["enableLimit"].GetBool();
			jointDef->referenceAngle = -jsonJoint["referenceAngle"].GetDouble() * M_PI / 180;
			jointDef->upperAngle = -jsonJoint["lowerAngle"].GetDouble() * M_PI / 180;
			jointDef->lowerAngle = -jsonJoint["upperAngle"].GetDouble() * M_PI / 180;
			jointDef->enableMotor = jsonJoint["enableMotor"].GetBool();
			jointDef->motorSpeed = -jsonJoint["motorSpeed"].GetDouble();
			jointDef->maxMotorTorque = jsonJoint["maxMotorTorque"].GetDouble();

			b2RevoluteJoint *joint = (b2RevoluteJoint*)world->CreateJoint(jointDef);
			std::string userData = jsonJoint["userData"].GetString();
			joint->SetUserData(&userData);
			loadedJoints.push_back(joint);
		}
		else if (jointType == JOINT_WHEEL){
			b2WheelJointDef *jointDef = new b2WheelJointDef();
			jointDef->bodyA = loadedBodies.at(jsonJoint["bodyA"].GetInt());
			jointDef->bodyB = loadedBodies.at(jsonJoint["bodyB"].GetInt());
			rapidjson::Value &localAnchorA = jsonJoint["localAnchorA"];
			rapidjson::Value &localAnchorB = jsonJoint["localAnchorB"];
			rapidjson::Value &localAxisA = jsonJoint["localAxisA"];
			jointDef->localAnchorA.Set(localAnchorA[rapidjson::SizeType(0)].GetDouble() / PTM_RATIO, -localAnchorA[rapidjson::SizeType(1)].GetDouble() / PTM_RATIO);
			jointDef->localAnchorB.Set(localAnchorB[rapidjson::SizeType(0)].GetDouble() / PTM_RATIO, -localAnchorB[rapidjson::SizeType(1)].GetDouble() / PTM_RATIO);
			jointDef->localAxisA.Set(localAxisA[rapidjson::SizeType(0)].GetDouble(), -localAxisA[rapidjson::SizeType(1)].GetDouble());
			jointDef->collideConnected = jsonJoint["collideConnected"].GetBool();
			jointDef->enableMotor = jsonJoint["enableMotor"].GetBool();
			jointDef->motorSpeed = -jsonJoint["motorSpeed"].GetDouble();
			jointDef->maxMotorTorque = jsonJoint["maxMotorTorque"].GetDouble();
			jointDef->dampingRatio = jsonJoint["dampingRatio"].GetDouble();
			jointDef->frequencyHz = jsonJoint["frequencyHZ"].GetDouble();

			b2WheelJoint *joint = (b2WheelJoint*)world->CreateJoint(jointDef);
			std::string userData = jsonJoint["userData"].GetString();
			joint->SetUserData(&userData);
			loadedJoints.push_back(joint);
		}
		else if (jointType == JOINT_PULLEY){
			b2PulleyJointDef *jointDef = new b2PulleyJointDef();
			jointDef->bodyA = loadedBodies.at(jsonJoint["bodyA"].GetInt());
			jointDef->bodyB = loadedBodies.at(jsonJoint["bodyB"].GetInt());
			rapidjson::Value &localAnchorA = jsonJoint["localAnchorA"];
			rapidjson::Value &localAnchorB = jsonJoint["localAnchorB"];
			rapidjson::Value &groundAnchorA = jsonJoint["groundAnchorA"];
			rapidjson::Value &groundAnchorB = jsonJoint["groundAnchorB"];
			jointDef->localAnchorA.Set(localAnchorA[rapidjson::SizeType(0)].GetDouble() / PTM_RATIO, -localAnchorA[rapidjson::SizeType(1)].GetDouble() / PTM_RATIO);
			jointDef->localAnchorB.Set(localAnchorB[rapidjson::SizeType(0)].GetDouble() / PTM_RATIO, -localAnchorB[rapidjson::SizeType(1)].GetDouble() / PTM_RATIO);
			jointDef->groundAnchorA.Set(offsetX / PTM_RATIO + groundAnchorA[rapidjson::SizeType(0)].GetDouble() / PTM_RATIO, 
										offsetY / PTM_RATIO - groundAnchorA[rapidjson::SizeType(1)].GetDouble() / PTM_RATIO);
			jointDef->groundAnchorB.Set(offsetX / PTM_RATIO + groundAnchorB[rapidjson::SizeType(0)].GetDouble() / PTM_RATIO,
										offsetY / PTM_RATIO - groundAnchorB[rapidjson::SizeType(1)].GetDouble() / PTM_RATIO);
			jointDef->collideConnected = jsonJoint["collideConnected"].GetBool();
			jointDef->lengthA = jsonJoint["lengthA"].GetDouble() / PTM_RATIO;
			jointDef->lengthB = jsonJoint["lengthB"].GetDouble() / PTM_RATIO;
			jointDef->ratio = jsonJoint["ratio"].GetDouble() / PTM_RATIO;
			
			b2PulleyJoint *joint = (b2PulleyJoint*)world->CreateJoint(jointDef);
			std::string userData = jsonJoint["userData"].GetString();
			joint->SetUserData(&userData);
			loadedJoints.push_back(joint);
		}
		else if (jointType == JOINT_GEAR){
			b2GearJointDef *jointDef = new b2GearJointDef();
			jointDef->bodyA = loadedBodies.at(jsonJoint["bodyA"].GetInt());
			jointDef->bodyB = loadedBodies.at(jsonJoint["bodyB"].GetInt());
			jointDef->joint1 = loadedJoints.at(jsonJoint["joint1"].GetInt());
			jointDef->joint2 = loadedJoints.at(jsonJoint["joint2"].GetInt());
			jointDef->collideConnected = jsonJoint["collideConnected"].GetBool();
			jointDef->ratio = jsonJoint["ratio"].GetDouble() / PTM_RATIO;

			b2GearJoint *joint = (b2GearJoint*)world->CreateJoint(jointDef);
			std::string userData = jsonJoint["userData"].GetString();
			joint->SetUserData(&userData);
			loadedJoints.push_back(joint);
		}
		else if (jointType == JOINT_PRISMATIC){
			b2PrismaticJointDef *jointDef = new b2PrismaticJointDef();
			jointDef->bodyA = loadedBodies.at(jsonJoint["bodyA"].GetInt());
			jointDef->bodyB = loadedBodies.at(jsonJoint["bodyB"].GetInt());
			rapidjson::Value &localAnchorA = jsonJoint["localAnchorA"];
			rapidjson::Value &localAnchorB = jsonJoint["localAnchorB"];
			rapidjson::Value &localAxisA = jsonJoint["localAxisA"];
			jointDef->localAnchorA.Set(localAnchorA[rapidjson::SizeType(0)].GetDouble() / PTM_RATIO, -localAnchorA[rapidjson::SizeType(1)].GetDouble() / PTM_RATIO);
			jointDef->localAnchorB.Set(localAnchorB[rapidjson::SizeType(0)].GetDouble() / PTM_RATIO, -localAnchorB[rapidjson::SizeType(1)].GetDouble() / PTM_RATIO);
			jointDef->localAxisA.Set(localAxisA[rapidjson::SizeType(0)].GetDouble(), -localAxisA[rapidjson::SizeType(1)].GetDouble());
			jointDef->collideConnected = jsonJoint["collideConnected"].GetBool();
			jointDef->enableLimit = jsonJoint["enableLimit"].GetBool();
			jointDef->referenceAngle = -jsonJoint["referenceAngle"].GetDouble() * M_PI / 180;
			jointDef->lowerTranslation = jsonJoint["lowerTranslation"].GetDouble() * PTM_RATIO;
			jointDef->upperTranslation = jsonJoint["upperTranslation"].GetDouble() * PTM_RATIO;
			jointDef->enableMotor = jsonJoint["enableMotor"].GetBool();
			jointDef->motorSpeed = -jsonJoint["motorSpeed"].GetDouble();

			b2PrismaticJoint *joint = (b2PrismaticJoint*)world->CreateJoint(jointDef);
			std::string userData = jsonJoint["userData"].GetString();
			joint->SetUserData(&userData);
			loadedJoints.push_back(joint);
		}
		else if (jointType == JOINT_ROPE){
			b2RopeJointDef *jointDef = new b2RopeJointDef();
			jointDef->bodyA = loadedBodies.at(jsonJoint["bodyA"].GetInt());
			jointDef->bodyB = loadedBodies.at(jsonJoint["bodyB"].GetInt());
			rapidjson::Value &localAnchorA = jsonJoint["localAnchorA"];
			rapidjson::Value &localAnchorB = jsonJoint["localAnchorB"];
			jointDef->localAnchorA.Set(localAnchorA[rapidjson::SizeType(0)].GetDouble() / PTM_RATIO, -localAnchorA[rapidjson::SizeType(1)].GetDouble() / PTM_RATIO);
			jointDef->localAnchorB.Set(localAnchorB[rapidjson::SizeType(0)].GetDouble() / PTM_RATIO, -localAnchorB[rapidjson::SizeType(1)].GetDouble() / PTM_RATIO);
			jointDef->collideConnected = jsonJoint["collideConnected"].GetBool();
			jointDef->maxLength = jsonJoint["maxLength"].GetDouble() / PTM_RATIO;

			b2RopeJoint *joint = (b2RopeJoint*)world->CreateJoint(jointDef);
			std::string userData = jsonJoint["userData"].GetString();
			joint->SetUserData(&userData);
			loadedJoints.push_back(joint);
		}
	}
}

std::vector<b2Body*> Box2dWorldLoader::getLoadedBodies(){
	return loadedBodies;
}

std::vector<b2Joint*> Box2dWorldLoader::getLoadedJoints(){
	return loadedJoints;
}
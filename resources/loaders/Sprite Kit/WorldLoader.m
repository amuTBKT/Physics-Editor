//
//  b2dWorldLoader.m
//
//  Created by Amit Kumar Mehar on 19/07/15.
//  Copyright (c) 2015 Amit Kumar Mehar. All rights reserved.
//

#import <Foundation/Foundation.h>

#import "WorldLoader.h"

@implementation WorldLoader

@synthesize offsetX, offsetY;
@synthesize loadedBodies, loadedJoints;

+(id) init{
    
    return self;
}

-(void) reset{
    // release arrays
    if ([loadedBodies count] > 0){
        [loadedBodies removeAllObjects];
        loadedBodies = nil;
    }
    if ([loadedJoints count] > 0){
        [loadedJoints removeAllObjects];
        loadedJoints = nil;
    }
    
    // reinitialize array
    loadedBodies = [[NSMutableArray alloc] init];
    loadedJoints = [[NSMutableArray alloc] init];
}

-(void) loadJsonSceneFromFile:(NSString *)file : (SKScene*)scene{
    [self reset];
    
    // load the json file
    NSString *filePath = [[NSBundle mainBundle] pathForResource:file ofType:@"json"];
    NSString *data = [[NSString alloc] initWithContentsOfFile:filePath encoding:NSUTF8StringEncoding error:NULL];
    
    // parse the loaded file to json object
    NSDictionary *jsonScene = [data objectFromJSONString];
    
    // load physics bodies
    NSArray *jsonBodies = [jsonScene objectForKey:@"bodies"];
    for (int i = 0, numberOfBodies = [jsonBodies count]; i < numberOfBodies; i++){
        // load body's properties
        NSDictionary *jsonBody = [jsonBodies objectAtIndex:i];
        NSArray *position = [jsonBody objectForKey:@"position"];
        float rotation = -[[jsonBody objectForKey:@"rotation"] floatValue] * M_PI / 180.0,
            linearDamping = [[jsonBody objectForKey:@"linearDamping"] floatValue],
            angularDamping = [[jsonBody objectForKey:@"angularDamping"] floatValue];
        bool isFixedRotation = [[jsonBody objectForKey:@"isFixedRotation"] boolValue];
        int bodyType = [[jsonBody objectForKey:@"type"] integerValue];
        NSString *userData = [jsonBody objectForKey:@"userData"];
        
        // create node for body
        SKNode *body = [[SKNode alloc] init];
        [body setName: userData];
        [body setPosition:CGPointMake(offsetX + [[position objectAtIndex:0] floatValue], offsetY - [[position objectAtIndex:1] floatValue])];
        [body setZRotation:rotation];
        [scene addChild:body];
        
        // load fixtures / shapes for the body
        NSArray *jsonFixtures = [jsonBody objectForKey:@"fixtures"];
        // add fixtures to the body (also initializes physics body for current body node)
        [self loadJsonFixtures:jsonFixtures :body];
        
        if (bodyType == 0){
            [body.physicsBody setDynamic:false];
        }
        // kinematic bodies are not supported in sprite kit
        else if (bodyType == 2){
            [body.physicsBody setDynamic:true];
        }
        [body.physicsBody setLinearDamping:linearDamping];
        [body.physicsBody setAngularDamping:angularDamping];
        [body.physicsBody setAllowsRotation:!isFixedRotation];
        
        [loadedBodies addObject:body.physicsBody];
    }
    
    // load physics joints
    NSArray *jsonJoints = [jsonScene objectForKey:@"joints"];
    for (int i = 0, numberOfJoints = [jsonJoints count]; i < numberOfJoints; i++){
        NSDictionary *jsonJoint = [jsonJoints objectAtIndex:i];
        
        int jointType = [[jsonJoint objectForKey:@"jointType"] integerValue];
        
        if (jointType == JOINT_DISTANCE){
            int indexA = [[jsonJoint objectForKey:@"bodyA"] integerValue];
            int indexB = [[jsonJoint objectForKey:@"bodyB"] integerValue];
            SKPhysicsBody *bodyA = [loadedBodies objectAtIndex:indexA];
            SKPhysicsBody *bodyB = [loadedBodies objectAtIndex:indexB];
            CGPoint anchorA = CGPointMake([[[jsonJoint objectForKey:@"localAnchorA"] objectAtIndex:0] floatValue], -[[[jsonJoint objectForKey:@"localAnchorA"] objectAtIndex:1] floatValue]);
            anchorA.x += bodyA.node.position.x;
            anchorA.y += bodyA.node.position.y;
            CGPoint anchorB = CGPointMake([[[jsonJoint objectForKey:@"localAnchorB"] objectAtIndex:0] floatValue], -[[[jsonJoint objectForKey:@"localAnchorB"] objectAtIndex:1] floatValue]);
            anchorB.x += bodyB.node.position.x;
            anchorB.y += bodyB.node.position.y;
            float dampingRatio = [[jsonJoint objectForKey:@"dampingRatio"] floatValue];
            float frequency = [[jsonJoint objectForKey:@"frequencyHZ"] floatValue];
            
            SKPhysicsJointSpring *joint = [SKPhysicsJointSpring jointWithBodyA:bodyA bodyB:bodyB anchorA:anchorA anchorB:anchorB];
            [joint setDamping:dampingRatio];
            [joint setFrequency:frequency];
            [scene.physicsWorld addJoint:joint];
            
            [loadedJoints addObject:joint];
        }
        else if (jointType == JOINT_WELD){
            int indexA = [[jsonJoint objectForKey:@"bodyA"] integerValue];
            int indexB = [[jsonJoint objectForKey:@"bodyB"] integerValue];
            SKPhysicsBody *bodyA = [loadedBodies objectAtIndex:indexA];
            SKPhysicsBody *bodyB = [loadedBodies objectAtIndex:indexB];
            CGPoint anchorA = CGPointMake([[[jsonJoint objectForKey:@"localAnchorA"] objectAtIndex:0] floatValue], -[[[jsonJoint objectForKey:@"localAnchorA"] objectAtIndex:1] floatValue]);
            anchorA.x += bodyA.node.position.x;
            anchorA.y += bodyA.node.position.y;
            CGPoint anchorB = CGPointMake([[[jsonJoint objectForKey:@"localAnchorB"] objectAtIndex:0] floatValue], -[[[jsonJoint objectForKey:@"localAnchorB"] objectAtIndex:1] floatValue]);
            anchorB.x += bodyB.node.position.x;
            anchorB.y += bodyB.node.position.y;
            float referenceAngle = -[[jsonJoint objectForKey:@"referenceAngle"] floatValue] * M_PI / 180.0;
            
            SKPhysicsJointFixed *joint = [SKPhysicsJointFixed jointWithBodyA:bodyA bodyB:bodyB anchor:anchorB];
            [scene.physicsWorld addJoint:joint];
            
            [loadedJoints addObject:joint];
        }
        else if (jointType == JOINT_REVOLUTE){
            int indexA = [[jsonJoint objectForKey:@"bodyA"] integerValue];
            int indexB = [[jsonJoint objectForKey:@"bodyB"] integerValue];
            SKPhysicsBody *bodyA = [loadedBodies objectAtIndex:indexA];
            SKPhysicsBody *bodyB = [loadedBodies objectAtIndex:indexB];
            CGPoint anchorA = CGPointMake([[[jsonJoint objectForKey:@"localAnchorA"] objectAtIndex:0] floatValue], -[[[jsonJoint objectForKey:@"localAnchorA"] objectAtIndex:1] floatValue]);
            anchorA.x += bodyA.node.position.x;
            anchorA.y += bodyA.node.position.y;
            CGPoint anchorB = CGPointMake([[[jsonJoint objectForKey:@"localAnchorB"] objectAtIndex:0] floatValue], -[[[jsonJoint objectForKey:@"localAnchorB"] objectAtIndex:1] floatValue]);
            anchorB.x += bodyB.node.position.x;
            anchorB.y += bodyB.node.position.y;
            bool enableLimit = [[jsonJoint objectForKey:@"enableLimit"] boolValue];
            float upperAngle = -[[jsonJoint objectForKey:@"lowerAngle"] floatValue] * M_PI / 180.0;
            float lowerAngle = -[[jsonJoint objectForKey:@"upperAngle"] floatValue] * M_PI / 180.0;
            float referenceAngle = -[[jsonJoint objectForKey:@"referenceAngle"] floatValue] * M_PI / 180.0;
            bool enableMotor = [[jsonJoint objectForKey:@"enableMotor"] boolValue];
            float motorSpeed = -[[jsonJoint objectForKey:@"motorSpeed"] floatValue] * M_PI / 180;
            float maxMotorTorque = [[jsonJoint objectForKey:@"maxMotorTorque"] floatValue];
            
            SKPhysicsJointPin *joint = [SKPhysicsJointPin jointWithBodyA:bodyA bodyB:bodyB anchor:anchorB];
            [joint setShouldEnableLimits:enableLimit];
            [joint setUpperAngleLimit:upperAngle];
            [joint setLowerAngleLimit:lowerAngle];
            [joint setRotationSpeed:motorSpeed];
            [scene.physicsWorld addJoint:joint];
            
            [loadedJoints addObject:joint];
        }
        else if (jointType == JOINT_ROPE){
            int indexA = [[jsonJoint objectForKey:@"bodyA"] integerValue];
            int indexB = [[jsonJoint objectForKey:@"bodyB"] integerValue];
            SKPhysicsBody *bodyA = [loadedBodies objectAtIndex:indexA];
            SKPhysicsBody *bodyB = [loadedBodies objectAtIndex:indexB];
            CGPoint anchorA = CGPointMake([[[jsonJoint objectForKey:@"localAnchorA"] objectAtIndex:0] floatValue], -[[[jsonJoint objectForKey:@"localAnchorA"] objectAtIndex:1] floatValue]);
            anchorA.x += bodyA.node.position.x;
            anchorA.y += bodyA.node.position.y;
            CGPoint anchorB = CGPointMake([[[jsonJoint objectForKey:@"localAnchorB"] objectAtIndex:0] floatValue], -[[[jsonJoint objectForKey:@"localAnchorB"] objectAtIndex:1] floatValue]);
            anchorB.x += bodyB.node.position.x;
            anchorB.y += bodyB.node.position.y;
            float maxLength = [[jsonJoint objectForKey:@"maxLength"] floatValue];
            
            SKPhysicsJointLimit *joint = [SKPhysicsJointLimit jointWithBodyA:bodyA bodyB:bodyB anchorA:anchorA anchorB:anchorB];
            [joint setMaxLength:maxLength];
            [scene.physicsWorld addJoint:joint];
            
            [loadedJoints addObject:joint];
        }
    }
}

-(void) loadJsonFixtures : (NSArray*)jsonFixtures : (SKNode*) parent{
    NSMutableArray *bodies = [[NSMutableArray alloc] init];
    
    for (int i = 0, numberOfFixtures = [jsonFixtures count]; i < numberOfFixtures; i++){
        
        // load fixture data
        NSDictionary* jsonFixture = [jsonFixtures objectAtIndex:i];
        float density = [[jsonFixture objectForKey:@"density"] floatValue],
            friction = [[jsonFixture objectForKey:@"friction"] floatValue],
            restitution = [[jsonFixture objectForKey:@"restitution"] floatValue];
        int maskBits = [[jsonFixture objectForKey:@"maskBits"] integerValue],
            categoryBits = [[jsonFixture objectForKey:@"categorykBits"] integerValue],
            groupIndex = [[jsonFixture objectForKey:@"groupIndex"] integerValue];
        
        // load shapes and create physics body
        NSArray *jsonShapes = [jsonFixture objectForKey:@"shapes"];
        for (int j = 0, numberOfShapes = [jsonShapes count]; j < numberOfShapes; j++){
            NSDictionary *jsonShape = [jsonShapes objectAtIndex:j];
            
            NSArray *position = [jsonShape objectForKey:@"position"];
            CGPoint pos = CGPointMake([[position objectAtIndex:0] floatValue], -[[position objectAtIndex:1] floatValue]);
            
            SKPhysicsBody *body;
            
            int shapeType = [[jsonShape objectForKey:@"type"] integerValue];
            if (shapeType == SHAPE_BOX){
                float width = [[jsonShape objectForKey:@"width"] floatValue];
                float height = [[jsonShape objectForKey:@"height"] floatValue];
                body = [SKPhysicsBody bodyWithRectangleOfSize:CGSizeMake(width, height) center: pos];
            }
            else if (shapeType == SHAPE_CIRCLE){
                float radius = [[jsonShape objectForKey:@"radius"] floatValue];
                body = [SKPhysicsBody bodyWithCircleOfRadius:radius * 2 center:pos];
            }
            else if (shapeType == SHAPE_POLYGON){
                NSArray *jsonVerts = [jsonShape objectForKey:@"vertices"];
                
                CGMutablePathRef path = CGPathCreateMutable();
                for (int k = 0, numberOfVertices = [jsonVerts count]; k < numberOfVertices; k++){
                    float x = pos.x + [[[jsonVerts objectAtIndex:k] objectAtIndex:0] floatValue];
                    float y = pos.y - [[[jsonVerts objectAtIndex:k] objectAtIndex:1] floatValue];
                    
                    if (k == 0){
                        CGPathMoveToPoint(path, NULL, x, y);
                    }
                    else {
                        CGPathAddLineToPoint(path, NULL, x, y);
                    }
                    
                }
                
                body = [SKPhysicsBody bodyWithPolygonFromPath:path];
            }
            else if (shapeType == SHAPE_CHAIN){
                NSArray *jsonVerts = [jsonShape objectForKey:@"vertices"];
                
                CGMutablePathRef path = CGPathCreateMutable();
                for (int k = 0, numberOfVertices = [jsonVerts count]; k < numberOfVertices; k++){
                    float x = pos.x + [[[jsonVerts objectAtIndex:k] objectAtIndex:0] floatValue];
                    float y = pos.y - [[[jsonVerts objectAtIndex:k] objectAtIndex:1] floatValue];
                    
                    if (k == 0){
                        CGPathMoveToPoint(path, NULL, x, y);
                    }
                    else {
                        CGPathAddLineToPoint(path, NULL, x, y);
                    }
                    
                }
                
                body = [SKPhysicsBody bodyWithEdgeChainFromPath:path];
            }
            
            [body setDensity:density];
            [body setFriction:friction];
            [body setRestitution:restitution];
            
//            [body setCategoryBitMask:categoryBits];
//            [body setCollisionBitMask:maskBits];
//            [body setContactTestBitMask:groupIndex];
            
            [bodies addObject:body];
            
        }
        
    }
    
    parent.physicsBody = [SKPhysicsBody bodyWithBodies:bodies];
}

@end
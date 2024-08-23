const gravity = 0; // 20000
const airFric = 0.98;
class Collider{
	constructor(rect, collideables){
		this.rect = rect;
		this.collideables = collideables;
	}

	checkCollision(otherCollider){
		return AABBCollision(this.rect, otherCollider.rect);
	}
}

class Entity{
	constructor(id, x, y, w, h){
		this.x = x;
		this.y = y;
		this.w = w;
		this.h = h;
		this.collider = new Collider(this.rect, []);
		this.id = id
	}

	update(dt){ // to be overriden
		console.log("Update was not overriden! entity_id: " + this.id);
	}
	
	draw(){ // to be overriden
		console.log("Draw was not overriden! entity_id: " + this.id);
	}

	onCollision(otherEntity){ // to be overriden
		console.log("Collided with entity_id:" + otherEntity.id);
	}
	
	get rect(){
		return [this.x,this.y,this.w,this.h];
	}
	get center(){
		return {x:this.x+this.w/2, y:this.y+this.h/2};
	}
}

class RigidBody extends Entity{
	constructor(id, x, y, w, h, invMass=1, coeff_restitution=0.1, drag=airFric, grav=gravity){
		super(id, x, y, w, h);
		this.invMass = invMass; // and other various physics attributes
		this.coeff_restitution = coeff_restitution;
		this.vel = [0, 0];
		this.forces = [0,0];
		this.gravity = grav;
		this.drag = drag
	}

	update(dt){
		let accel = math.multiply(this.invMass, this.forces);
		this.forces = [0, this.gravity/this.invMass];

		this.vel = math.add(this.vel, math.multiply(accel, dt));
		this.vel = math.multiply(this.drag, this.vel);

		let magnitude = math.sqrt(this.vel[0]**2 + this.vel[1]**2);
		if(magnitude > 10000){
			console.log('AH')
		}
		this.x += this.vel[0]*dt;
		this.y += this.vel[1]*dt;

		this.collider.rect = this.rect;
	}

	onCollision(otherEntity){
		if(otherEntity instanceof StaticBody){ // if collision with staticbody
			let mtv = this.collider.checkCollision(otherEntity);
			let norm = normalize(mtv);

			this.x += mtv[0];
			this.y += mtv[1];
			this.collider.rect = this.rect;

			let invM1 = this.invMass;
			let invM2 = 0;

			let rel_vel = this.vel;
			rel_vel = math.dot(rel_vel, norm);
			let et = this.coeff_restitution;
			let Vj = -(1+et) * rel_vel;
			let J = Vj/(invM1+invM2);

			this.applyImpulse(math.multiply(norm, J));
		}else{ // collision with another rigidboy
			let mtv = this.collider.checkCollision(otherEntity);
			let norm = normalize(mtv);

			let offset = 0.6;
			// need to figure out a way to handle objs being pushed into
			// static objs, maybe checking collisions on both after move 
			// and undoing one if its colliding with another but thats expensive
			this.x += mtv[0]*offset;
			this.y += mtv[1]*offset;
			this.collider.rect = this.rect;
			otherEntity.x -= mtv[0]*offset;
			otherEntity.y -= mtv[1]*offset;
			otherEntity.collider.rect = otherEntity.rect;

			let e_1 = this.coeff_restitution;
			let e_2 = otherEntity.coeff_restitution;

			let invM1 = this.invMass;
			let invM2 = otherEntity.invMass;

			let rel_vel = math.subtract(this.vel, otherEntity.vel);
			rel_vel = math.dot(rel_vel, norm);
			let et = math.max(e_1,e_2);
			let Vj = -(1+et) * rel_vel;
			let J = Vj/(invM1+invM2);

			this.applyImpulse(math.multiply(norm, J));
			otherEntity.applyImpulse(math.multiply(norm, -J));
			/* debugging stuff
			console.log("BEFORE");
			console.log("main ID: " + this.id);
			console.log("other ID: " + otherEntity.id);

			console.log("main vel: " + this.vel);
			console.log("other vel: " + otherEntity.vel);

			console.log("norm: " + norm);

			console.log("AFTER J: " + J);
			console.log("main ID: " + this.id);
			console.log("other ID: " + otherEntity.id);

			console.log("main vel: " + this.vel);
			console.log("other vel: " + otherEntity.vel);

			console.log("norm: " + norm);
			*/
		}
	}

	applyImpulse(J){ // J represents the impulse (mag x dir)
		this.vel = math.add(this.vel, math.multiply(this.invMass, J));
	}

	applyForce(forceVec){
		this.forces = math.add(this.forces, forceVec);
	}

	draw(){
		// drawing can be handled by child classes
		drawRect(this.rect, "black");
	}
}

class StaticBody extends Entity{
	constructor(id, x, y, w, h){
		super(id, x, y, w, h);
		this.invMass = 1; // and other various physics attributes
	}

	update(dt){
		// static obj doesnt need to update 
	}

	draw(){
		// drawing can be handled by child classes
		drawRect(this.rect, "black");
	}

	onCollision(otherEntity){}
}

/*
 * so basically, a world contains a bunch of entities all of which have basic
 * functions like draw, update, onCollision, and a collider obj which
 * contains a collisionLayer, every entity on the same layer is checked for collision
 * maybe change later to handle multiple layers that the obj belongs to
 * then layers the obj collides with
 * to create other entities like a player class
 * class Player extends RigidBody{}
 * then just override draw and update but make sure to call super.update() for physics
 * stuff. Also override on collision funciton if needed, on collision just resolves
 * by moving mtv and other physicsy shit
*/
class World{
	constructor(){
		this.entities = {};
		// "id": {collisionTag, collisions}
		this.collisionLayers = {};
		this.toRemove = [];
	}

	deleteEntity(id){
		this.toRemove.push(id);
	}

	update(dt){
		for(let id in this.entities){
			let entity = this.entities[id];
			entity.update(dt);
		}
		for(let id of this.toRemove){
			for(let tag in this.collisionLayers){
				this.collisionLayers[tag] = this.collisionLayers[tag].filter(x => !this.toRemove.includes(x));
			}
			delete this.entities[id];
			
		}
		this.toRemove = [];
	}

	draw(){
		for(let id in this.entities){
			let entity = this.entities[id];
			entity.draw();
		}
	}

	addEntity(entity, collisionTag, tagsToCollideWith){
		let inputEntity = entity;
		inputEntity.collider.collideables = tagsToCollideWith;
		this.entities[entity.id] = inputEntity; // add collideables to entity for collision stuff

		if(collisionTag in this.collisionLayers){ // create collision layer if necessary
			this.collisionLayers[collisionTag].push(entity.id);
		}else{
			this.collisionLayers[collisionTag] = [entity.id];
		}
	}

	removeEntity(id){
		delete this.entities[id]; // might cause issues idk
	}

	checkCollisions(entity){
		//console.log(this.collisionLayers);
		for(let tag of entity.collider.collideables){
			try{
				for(let id of this.collisionLayers[tag]){
					const otherEntity = this.entities[id];
					if(entity.collider.checkCollision(otherEntity.collider)){
						entity.onCollision(otherEntity);
					}
				}
			}
			catch(e){
			}
		}
	}
	collisions(){
		for(let i in this.entities){
			this.checkCollisions(this.entities[i]);
		}
	}
}


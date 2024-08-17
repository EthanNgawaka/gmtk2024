class Bullet extends RigidBody{
	constructor(id, x, y, w, h, dir, bulletManagerRef){
		super(id, x, y, w, h);
		this.speed = 400;
		this.manager = bulletManagerRef;
		this.drag = 1;
		this.vel = math.multiply(this.speed, dir);
		this.lifetime = 5;
	}

	update(dt){
		super.update(dt);
		this.lifetime -= dt;
		if(this.lifetime <= 0){
			this.manager.deleteBullet(this.id);
		}
	}
}

class BulletManager{
	constructor(){
		this.bullets = [];
		this.baseSize = 16;
		this.toRemove = [];
	}

	deleteBullet(id){
		world.deleteEntity(id);
		this.toRemove.push(id);
	}

	createBullet(x,y,dir){
		let id = "bullet"+this.bullets.length*math.random(0,999999999);
		this.bullets.push(id);
		let playerSize = world.entities["player"].size;
		let bulletSize = this.baseSize*playerSize;
		world.addEntity(new Bullet(id, x-bulletSize/2, y-bulletSize/2, bulletSize, bulletSize, dir, this), id, ["walls"]);
	}

	update(dt){
		for(let id of this.bullets){
			try{
				world.entities[id].update(dt);
			}
			catch(e){
				console.log(e, id);
				this.toRemove.push(id);
			}
		}
		this.bullets = this.bullets.filter(x => !this.toRemove.includes(x));
		this.toRemove = [];
	}

	draw(){
		for(let id of this.bullets){
			try{
				world.entities[id].draw();
			}
			catch(e){
				console.log(e, id);
				world.deleteEntity(id);
			}
		}
	}
}

class Player extends RigidBody{
	constructor(x,y){
		super("player", x, y, 64, 64);
		this.size = 1.5;
		this.speed = 8000;
		this.maxSpeed = 8000;
		this.drag = 0.8;
		this.maxSize = 64;
		this.oldSize = this.size;
		this.bulletManager = new BulletManager();

		this.gunType = "base";
		this.gunCooldown = 0;
		this.gunCooldownMax = {"base":0.25};
	}

	updateSize(){
		let sizeDiff = 1 + this.size - this.oldSize;
		this.speed = this.maxSpeed / this.size;
		let testRect = enlargeRect(this.rect, sizeDiff, sizeDiff);
		this.x = testRect[0];
		this.y = testRect[1];
		this.w = testRect[2];
		this.h = testRect[3];
		this.oldSize = this.size;
		Camera.scale = 1/(this.size+0.25);
		this.size+=0.001
	}

	update(dt){
		this.updateSize();
		this.input();
		super.update(dt);

		this.gun(dt);
		this.bulletManager.update(dt);
	}

	draw(){
		super.draw();
		
		this.bulletManager.draw();
	}

	input(){
		let movementVec = [0,0];
		if(checkKey("KeyE")){
			this.size += 0.1;
		}
		if(checkKey("KeyQ")){
			this.size -= 0.1;
		}
		if(this.size <= 0.1){
			this.size = 0.1;
		}
		if(checkKey("KeyW")){
			movementVec[1] = -1;
		}
		if(checkKey("KeyA")){
			movementVec[0] = -1;
		}
		if(checkKey("KeyS")){
			movementVec[1] = 1;
		}
		if(checkKey("KeyD")){
			movementVec[0] = 1;
		}
		movementVec = normalize(movementVec);
		this.applyForce(math.multiply(movementVec, this.speed));
	}

	gun(dt){
		if(this.gunCooldown > 0){
			this.gunCooldown -= dt;
		}
		if(mouse.down.left && this.gunCooldown <= 0){
			let [mouseWorldX, mouseWorldY] = getMousePos();

			let playerCenterX = this.center.x;
			let playerCenterY = this.center.y;

			let dx = mouseWorldX - playerCenterX;
			let dy = mouseWorldY - playerCenterY;
			let length = Math.sqrt(dx * dx + dy * dy);
			let dir = [dx / length, dy / length];

			switch(this.gunType){
				case "base":
					dir = math.multiply(dir, 3);
					this.bulletManager.createBullet(this.center.x, this.center.y, dir);
					this.gunCooldown = this.gunCooldownMax["base"];
					break
				case "minigun":
					break
				case "shotgun":
					break
			}
		}
	}
	get center(){
		return {x:this.x+this.w/2, y:this.y+this.h/2};
	}
}

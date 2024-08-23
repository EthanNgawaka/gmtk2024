class PickupManager{
	constructor(){
		this.pickups = [];
		this.toRemove = [];
		this.shrinkSpawned = false;
	}

	addPickup(x, y, type){
		if(type == "shrink"){
			this.shrinkSpawned = true;
		}
		let id = "pickup"+this.pickups.length+math.random(0,1000);
		this.pickups.push(id);
		world.addEntity(new Pickup(id, x,y, type, this), "pickups", ["player"]);
	}

	deletePickup(id){
		if(world.entities[id].type == "shrink"){
			this.shrinkSpawned = false;
		}
		this.toRemove.push(id);
		world.deleteEntity(id);
	}

	update(){
		this.pickups = this.pickups.filter(x => !this.toRemove.includes(x));
		this.toRemove = [];
	}
}

class Pickup extends StaticBody{
	constructor(id, x,y,type, manager){
		super(id, x,y,70,70);
		this.drawScale = 0;
		this.type = type
		this.manager = manager;
		this.col = "yellow";
		this.timer = 0;
		switch(type){
			case "shrink":
				this.sprite = new image("assets/shrink.png");
				this.col = "blue";
				break;
			case "minigun":
				this.sprite = new image("assets/minigun_pickup.png");
				this.w = 130;
				this.h = 130;
				break;
			case "shotgun":
				this.sprite = new image("assets/shotgun_pickup.png");
				this.w = 130;
				this.h = 130;
				break;
			case "hp":
				this.sprite = new image("assets/heart.png");
				this.col = "red";
				break;
		}
	}
	draw(){
		if(this.drawScale < 1){
			this.drawScale += 0.05;
		}

		this.timer += 1;
		if(this.timer % 10 == 0){
			particleManager.sparkle(this.center.x-this.w/2, this.center.y-this.h/4, 1, this.col);
		}
		let drawRect = [this.x,this.y,this.w,this.h];
		let temp_rect = enlargeRect(drawRect, this.drawScale, this.drawScale);
		let rect = getWorldRect(temp_rect);
		this.sprite.drawImg(rect[0], rect[1], rect[2], rect[3], 1);
	}
	onCollision(otherEntity){
		if(otherEntity instanceof Player){
			switch(this.type){
				case "shotgun":
					otherEntity.pickups.push("shotgun");
					break;
				case "minigun":
					otherEntity.pickups.push("minigun");
					break;
				case "hp":
					otherEntity.hp += 1;
					break;
				case "shrink":
					otherEntity.shrinking = otherEntity.shrinkMax;
					break;
			}
			particleManager.sparkle(this.center.x,this.center.y,25,this.col,1000);
			this.manager.deletePickup(this.id);
		}
	}
}

class Bullet extends RigidBody{
	constructor(id, x, y, w, h, dir, bulletManagerRef, dmg){
		super(id, x, y, w, h);
		this.speed = 2000;
		this.manager = bulletManagerRef;
		this.drag = 1;
		this.vel = math.multiply(this.speed, dir);
		this.maxLifetime = 8;
		this.lifetime = this.maxLifetime;
		this.dmg = dmg
		this.sprite = new image("assets/bullet.png");
	}
	draw(){
		let scl = 2*this.lifetime/this.maxLifetime;
		let rect = getWorldRect(enlargeRect(this.rect,scl,scl));
		this.sprite.drawImg(rect[0],rect[1],rect[2],rect[3], 1);
	}

	update(dt){
		super.update(dt);
		this.lifetime -= dt;
		if(this.lifetime <= 0){
			this.manager.deleteBullet(this.id);
		}
	}

	onCollision(otherEntity){
		if(otherEntity instanceof Enemy){
			otherEntity.stunTimer = otherEntity.stunTimerMax;
			let ydiff = this.center.y-otherEntity.center.y;
			let xdiff = this.center.x-otherEntity.center.x;
			let theta = math.atan2(ydiff,xdiff);
			let dir = this.vel;
			particleManager.bloodSplatter(otherEntity.center.x, otherEntity.center.y, 2,theta);
			//let dir = [math.cos(theta), math.sin(theta)];
			otherEntity.applyForce(math.multiply(10000,normalize(dir)));
			this.applyForce(math.multiply(-100000,normalize(dir)));
			otherEntity.hp -= this.dmg;
			this.hitTimer = this.hitTimerMax;
			this.manager.deleteBullet(this.id);
		}
		this.lifetime = 0;
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
		let id = "bullet"+this.bullets.length+math.random(0,1000);
		this.bullets.push(id);
		let ply =world.entities["player"]; 
		let playerSize = ply.size**2;
		let dmg = 1;
		switch(ply.gunType){
			case "base":
				this.baseSize = 16;
				break;
			case "minigun":
				this.baseSize = 8;
				dmg /= 2;
				break;
			case "shotgun":
				this.baseSize = 8;
				dmg *= 0.8;
				break;
		}
		dmg *= ply.size;
		dmg = math.max(dmg, 0.3);
		let bulletSize = math.max(this.baseSize*playerSize, 6);
		let offset = math.multiply(dir, 32*playerSize);
		world.addEntity(new Bullet(id, x-bulletSize/2 + offset[0], y-bulletSize/2+offset[1], bulletSize, bulletSize, dir, this, dmg), "bullets", ["walls", "enemies"]);
	}

	update(dt){
		this.bullets = this.bullets.filter(x => !this.toRemove.includes(x));
		this.toRemove = [];
	}
}

class Player extends RigidBody{
	constructor(x,y){
		super("player", x, y, 64, 64);
		this.size = 1.21;
		this.speed = 8000;
		this.maxSpeed = 8000;
		this.drag = 0.8;
		this.oldSize = this.size;
		this.bulletManager = new BulletManager();
		this.spriteSheet = new spriteSheet("assets/player_spritesheet.png", 64*2, 64*2, 2, this.x, this.y, this.w, this.h);
		this.spriteSheet.addState("right_down", 1, 5);
		this.spriteSheet.addState("left_down", 2, 5);
		this.spriteSheet.addState("right_up", 3, 5);
		this.spriteSheet.addState("left_up", 4, 5);
		this.spriteSheet.addState("hit", 5, 1);
		this.spriteSheet.addState("right_stationary", 6, 1);
		this.spriteSheet.addState("left_stationary", 7, 1);

		this.movementDir = "left";
		this.hitTimer = 0;
		this.hitTimerMax = 0.3;

		this.pickups = [];
		this.pickupTimer = 0;
		this.pickupTimerMax = 15;
		this.shrinking = 0;
		this.shrinkMax = 1;
		this.hp = 3;
		this.heartImg = new image("assets/heart.png");

		this.spriteSheet.bounce = true;
		this.spriteSheet.setState("right_down");
		this.dt = 0;
		this.shotgunImg = new image('assets/shotgun_pickup.png');
		this.minigunImg = new image('assets/minigun_pickup.png');
		this.baseImg = new image('assets/base_gun.png');
		this.shotgunImgFlip = new image('assets/shotgun_pickup_f.png');
		this.minigunImgFlip = new image('assets/minigun_pickup_f.png');
		this.baseImgFlip = new image('assets/base_gun_f.png');

		this.gunType = "base";
		this.gunCooldown = 0;
		this.gunCooldownMax = {
			"base":0.35,
			"minigun":0.05,
			"shotgun":1.05,
		};
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
		Camera.scale = 1/(this.size+1);
		if(Camera.scale > 1.2){
			Camera.scale = 1.2;
		}
		//this.size+=0.001
	}

	update(dt){
		this.dt = dt;
		this.updateSize();
		if(this.hitTimer <= 0){
			this.input();
		}
		super.update(dt);

		this.gun(dt);
		if(this.shrinking > 0){
			this.shrinking -= dt;
			this.size -= 0.01;
		}
	}

	draw(){
		[this.spriteSheet.x, this.spriteSheet.y, this.spriteSheet.draww, this.spriteSheet.drawh] = enlargeRect(getWorldRect(this.rect),2,2);
		if(this.hitTimer > 0){
			this.hitTimer -= this.dt;
			this.spriteSheet.setState("hit");
			this.spriteSheet.sheetX = 0;
			this.spriteSheet.changeW = this.spriteSheet.w;
		}
		this.spriteSheet.draw();
		this.spriteSheet.frameCalc(0);
		for(let i = 0; i < this.hp; i++){
			this.heartImg.drawImg(64+i*32*1.35, windowH-80, 32,32,1);
		}

		let rect = getWorldRect([this.center.x, this.center.y, 0, 0]);
		if(this.pickupTimer > 0){
			let angle = this.pickupTimer/this.pickupTimerMax;
			drawArc(rect[0], rect[1] , 90, angle*360, "#67a2d2");
		}

		let [mouseX, mouseY] = getMousePos();
		let dx = mouseX - this.center.x;
		let dy = mouseY - this.center.y;
		let dir_theta = math.atan2(dy,dx)+math.pi/4;
		let gunW = 25*this.size;
		let gunH = 25*this.size;
		rect = getWorldRect([this.center.x, this.center.y + gunH/2,0,0]);
		switch(this.gunType){
			case "base":
				if(math.abs(dir_theta-math.pi/4) > math.pi/2){
					dir_theta += math.pi/2;
					this.baseImgFlip.drawRotatedImg(rect[0],rect[1],gunW,gunH,1,dir_theta,gunW/2,gunH/2);
				}else{
					this.baseImg.drawRotatedImg(rect[0],rect[1],gunW,gunH,1,dir_theta,gunW/2,gunH/2);
				}
				break;
			case "shotgun":
				if(math.abs(dir_theta-math.pi/4) > math.pi/2){
					dir_theta += math.pi/2;
					this.shotgunImgFlip.drawRotatedImg(rect[0],rect[1],gunW,gunH,1,dir_theta,gunW/2,gunH/2);
				}else{
					this.shotgunImg.drawRotatedImg(rect[0],rect[1],gunW,gunH,1,dir_theta,gunW/2,gunH/2);
				}
				break;
			case "minigun":
				if(math.abs(dir_theta-math.pi/4) > math.pi/2){
					dir_theta += math.pi/2;
					this.minigunImgFlip.drawRotatedImg(rect[0],rect[1],gunW,gunH,1,dir_theta,gunW/2,gunH/2);
				}else{
					this.minigunImg.drawRotatedImg(rect[0],rect[1],gunW,gunH,1,dir_theta,gunW/2,gunH/2);
				}
				break;
		}

	}

	input(){
		let movementVec = [0,0];
		let spriteDirVert = "down";
		if(checkKey("KeyW")){
			movementVec[1] = -1;
			spriteDirVert = "up";
		}
		if(checkKey("KeyA")){
			movementVec[0] = -1;
			this.movementDir = "left";
		}
		if(checkKey("KeyS")){
			movementVec[1] = 1;
			spriteDirVert = "down";
		}
		if(checkKey("KeyD")){
			movementVec[0] = 1;
			this.movementDir = "right";
		}
		if(movementVec[0] == 0 && movementVec[1] == 0){
			spriteDirVert = "stationary";
			this.spriteSheet.bounce = false;
			this.spriteSheet.sheetX = 0;
			this.spriteSheet.changeW = this.spriteSheet.w;
		}else{
			this.spriteSheet.bounce = true;
		}

		this.spriteSheet.setState(this.movementDir+"_"+spriteDirVert);
		movementVec = normalize(movementVec);
		this.applyForce(math.multiply(movementVec, this.speed));
	}

	gun(dt){
		if(this.pickupTimer > 0){
			this.pickupTimer -= dt;
		}else{
			this.gunType = "base";
			if(this.pickups.length > 0){
				let pickupType = this.pickups[this.pickups.length-1];
				this.gunType = pickupType;
				this.pickups.pop();
				this.pickupTimer = this.pickupTimerMax;
			}
		}
		if(this.gunCooldown > 0){
			this.gunCooldown -= dt;
		}
		if(mouse.down.left && this.gunCooldown <= 0){
			let [mouseWorldX, mouseWorldY] = getMousePos();

			let playerCenterX = this.center.x;
			let playerCenterY = this.center.y;

			let dx = mouseWorldX - playerCenterX;
			let dy = mouseWorldY - playerCenterY;
			let dir_theta = math.atan2(dy,dx);
			let kb = 10000;
			let dir = [];

			let deg = math.pi/180;
			let innac = 0;
			let sizeMod = math.min(this.size, 2.1);

			switch(this.gunType){
				case "base":
					innac = deg * 3;
					dir_theta += math.random(-innac, innac);
					dir = [math.cos(dir_theta), math.sin(dir_theta)];
					this.bulletManager.createBullet(this.center.x, this.center.y, dir);
					this.gunCooldown = this.gunCooldownMax["base"]*sizeMod;
					this.applyForce(math.multiply(-kb,dir));
					if(dir_theta > math.pi/2){
						dir_theta += math.pi;
					}
					particleManager.shell(this.center.x, this.center.y, dir_theta);
					Camera.shake = 0.1;
					Camera.shakeIntensity = 50;
					break
				case "shotgun":
					innac = deg * 9;
					let bulletCount = 7;
					for(let i = 0; i < bulletCount; i++){
						dir_theta += math.random(-innac, innac);
						let rand_speed = random(0.9,1.6);
						dir = [math.cos(dir_theta)*rand_speed, math.sin(dir_theta)*rand_speed];
						this.bulletManager.createBullet(this.center.x, this.center.y, dir);
					}
					if(dir_theta > math.pi/2){
						dir_theta += math.pi;
					}
					particleManager.shell(this.center.x, this.center.y, dir_theta, 32);
					Camera.shake = 0.1;
					Camera.shakeIntensity = 500;
					kb = 100000;
					this.applyForce(math.multiply(-kb,dir));
					this.gunCooldown = this.gunCooldownMax["shotgun"]*sizeMod;
					break
				case "minigun":
					innac = deg * 5;
					dir_theta += math.random(-innac, innac);
					dir = [math.cos(dir_theta)*2.4, math.sin(dir_theta)*2.4];
					this.bulletManager.createBullet(this.center.x, this.center.y, dir);
					this.gunCooldown = this.gunCooldownMax["minigun"]*sizeMod;
					this.applyForce(math.multiply(-kb,dir));
					Camera.shake = 0.1;
					Camera.shakeIntensity = 150;
					if(dir_theta > math.pi/2){
						dir_theta += math.pi;
					}
					particleManager.shell(this.center.x, this.center.y, dir_theta, 13);
					break
			}
		}
	}
}

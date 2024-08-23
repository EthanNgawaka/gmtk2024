class WallManager{
	constructor(){
		this.walls = [];
	}
	
	addWall(x,y,w,h){
		let id = "wall"+this.walls.length+math.random(0,1000);
		this.walls.push(id);
		world.addEntity(new Wall(id, x,y,w,h), "walls", ["player"]);
	}
}
let wallManager = new WallManager();

class Wall extends StaticBody{
	constructor(id,x,y,w,h){
		super(id,x,y,w,h);
	}
}

class Enemy extends RigidBody{
	constructor(id, x, y, w, h){
		super(id, x, y, w, h);
		this.speed = 120;
		this.spawnScale = 0;
		this.stunTimer = 0;
		this.stunTimerMax = 0.8;
		this.hp = 6;
		this.spriteSheet = new spriteSheet("assets/enemy_spritesheet.png", 64, 43, 2, x,y,w,h);
		this.spriteSheet.addState("fly", 1,3);
		this.spriteSheet.addState("hit", 2,1);
	}

	AI(){
		let pl = world.entities['player'];
		let dir = [pl.center.x-this.x,pl.center.y-this.y];
		dir = normalize(dir);
		this.vel = math.multiply(this.speed, dir);
	}

	draw(){
		[this.spriteSheet.x, this.spriteSheet.y, this.spriteSheet.draww, this.spriteSheet.drawh] = enlargeRect(getWorldRect(this.rect),this.spawnScale, this.spawnScale);
		if(this.spawnScale < 1){
			this.spawnScale += 0.05;
		}
		if(this.stunTimer > 0){
			this.spriteSheet.setState("hit");
			this.spriteSheet.sheetX = 0;
			this.spriteSheet.changeW = this.spriteSheet.w;
		}else{
			this.spriteSheet.setState("fly");
		}
		this.spriteSheet.draw();
		this.spriteSheet.frameCalc(0);
	}

	update(dt){
		if(this.stunTimer <= 0){
			this.AI();
		}else{
			this.stunTimer -= dt;
		}
		super.update(dt);

		if(this.hp <= 0){
			enemyManager.deleteEnemy(this.id);
		}
	}

	onCollision(otherEntity){
		if(otherEntity instanceof Bullet && this.stunTimer <= 0){
			this.stunTimer = this.stunTimerMax;
			let ydiff = this.center.y-otherEntity.center.y;
			let xdiff = this.center.x-otherEntity.center.x;
			let theta = math.atan2(ydiff,xdiff);
			let dir = [math.cos(theta), math.sin(theta)];
			particleManager.bloodSplatter(this.center.x, this.center.y, 2,theta);
			this.applyForce(math.multiply(10000,normalize(dir)));
			this.hp -= otherEntity.dmg;
			bulletManager.deleteBullet(otherEntity.id);
		}
		else if(otherEntity instanceof Player && this.stunTimer <= 0){
			this.stunTimer = this.stunTimerMax;
			let ydiff = this.center.y-otherEntity.center.y;
			let xdiff = this.center.x-otherEntity.center.x;
			let theta = math.atan2(ydiff,xdiff);
			let dir = [math.cos(theta), math.sin(theta)];
			this.applyForce(math.multiply(10000,normalize(dir)));
			otherEntity.applyForce(math.multiply(-100000,normalize(dir)));
			otherEntity.hitTimer = otherEntity.hitTimerMax;
			otherEntity.hp -= 1;
			Camera.shake = 0.3;
			Camera.shakeIntensity = 100;
			particleManager.bloodSplatter(otherEntity.center.x, otherEntity.center.y, 8, theta);
		}else{
			super.onCollision(otherEntity);
		}
	}
}

class EnemyManager{
	constructor(){
		this.enemies = [];
		this.toRemove = [];
		this.timer = 0;
		this.spawnTime = 5;
	}
	
	addEnemy(x,y){
		let id = "enemy"+this.enemies.length+math.random(0,1000);
		let w = 64*1.5;
		let h = 43*1.5;
		this.enemies.push(id);
		world.addEntity(new Enemy(id, x,y,w,h), "enemies", ["walls", "player", "enemies"]);
	}

	deleteEnemy(id){
		this.toRemove.push(id);
		world.deleteEntity(id);
	}

	update(dt){
		this.enemies = this.enemies.filter(x => !this.toRemove.includes(x));
		this.toRemove = [];
		this.timer -= dt;
		if(this.timer <= 0){
			this.timer = this.spawnTime;
			spawnEnemy();
		}
	}
}

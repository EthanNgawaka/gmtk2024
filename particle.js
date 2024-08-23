class ParticleManager{
	constructor(){
		this.particles = [];
		this.toRemove = [];
	}

	deleteParticle(id){
		this.toRemove.push(id);
		world.deleteEntity(id);
	}

	update(dt){
		this.particles = this.particles.filter(x => !this.toRemove.includes(x));
		this.toRemove = [];
	}

	addParticle(type, id, x, y, w, h, col, lifetime=1, vel=[0,0], grav=0){
		this.particles.push(id);
		world.addEntity(new Particle(this, type, id, x, y, w, h, col, lifetime, vel, grav), "particles", []);
	}
	sparkle(x,y,num,in_col,in_speed = 100){
		let speed = in_speed;
		let type = "sparkle";
		for(let i = 0; i < num; i ++){
			let w = 64*math.random(0.5,1.5);
			let h = w;
			let lifetime = 2*math.random(0.2,1.8);
			let id = "particle"+this.particles.length+math.random(0,1000);
			let col = in_col;
			let theta = random(-math.pi*2, math.pi*2);
			let dir = [math.cos(theta), math.sin(theta)];
			let vel = math.multiply(dir, speed*math.random(0.2,1.8));
			this.addParticle(type, id, x, y, w, h, col, lifetime, vel, -100);
		}
	}
	shell(x,y, angle, w_in = 20){
		let speed = 500;
		let type = "shell";
		let w = w_in*math.random(0.8,1.2)*world.entities['player'].size;
		let h = w;
		let lifetime = 4*math.random(0.2,1.8);
		let id = "particle"+this.particles.length+math.random(0,1000);
		let col = "yellow";
		let theta = angle+math.pi*1.43// + math.random(-math.pi/4, math.pi/4);
		if(angle < -math.pi/2 && angle > -math.pi){
			theta+=math.pi;
		}
		let dir = [math.cos(theta), math.sin(theta)];
		let vel = math.multiply(dir, speed*math.random(0.8,1.2));
		this.addParticle(type, id, x, y, w, h, col, lifetime, vel, 1000);
	}

	bloodSplatter(x,y,num,angle){
		let speed = 800;
		let type = "blood";
		for(let i = 0; i < num; i ++){
			let w = 20*math.random(0.5,1.5);
			let h = w;
			let col = "red";
			let lifetime = 2*math.random(0.2,1.8);
			let id = "particle"+this.particles.length+math.random(0,1000);
			let theta = angle+math.pi+random(-math.pi/8, math.pi/8);
			let dir = [math.cos(theta), math.sin(theta)];
			let vel = math.multiply(dir, speed*math.random(0.2,1.8));
			this.addParticle(type, id, x, y, w, h, col, lifetime, vel, 1000);
		}
	}
}

class Particle extends RigidBody{
	constructor(manager, type, id, x,y,w,h,col,lifetime,vel,grav){
		super(id, x,y,w,h);

		this.maxLifetime = lifetime;
		this.lifetime = this.maxLifetime;
		this.col = col;
		this.vel = vel;
		this.gravity = grav;
		this.manager = manager;
		this.type = type;
		this.angle = math.random(0, math.pi);
		if(this.type == "sparkle"){
			this.sprite = new spriteSheet("assets/sparkle_"+this.col+".png", 65, 64, 5, this.x, this.y, this.w, this.h);
			this.sprite.addState("sparkle", 1, 9);
			this.sprite.bounce = true;
		}else{
			this.sprite = new image("assets/"+this.type+".png");
		}
	}

	draw(){
		let rect = getWorldRect(this.rect);
		//drawRect(this.rect, this.col, 1, this.col, this.lifetime/this.maxLifetime);
		if(this.type=="sparkle"){
			[this.sprite.x, this.sprite.y, this.sprite.draww, this.sprite.drawh] = rect;
			this.sprite.draw(this.lifetime/this.maxLifetime);
			this.sprite.frameCalc(0);
		}else if(this.type == "shell"){
			this.angle += math.pi/24;
			this.sprite.drawRotatedImg(rect[0],rect[1],rect[2],rect[3],this.lifetime/this.maxLifetime, this.angle, rect[2]/2, rect[3]/2);
		}
		else{
			this.sprite.drawImg(rect[0],rect[1],rect[2],rect[3],this.lifetime/this.maxLifetime);
		}
	}
	update(dt){
		this.lifetime -= dt;
		super.update(dt);
		if(this.lifetime <= 0){
			this.manager.deleteParticle(this.id);
		}
	}

}
let particleManager = new ParticleManager();

let world = new World;

let enemyManager = new EnemyManager();
let pickupManager = new PickupManager();


//pickupManager.addPickup(200, 10, "minigun");
//pickupManager.addPickup(300, 10, "shotgun");
//pickupManager.addPickup(200, 300, "shrink");
//pickupManager.addPickup(400, 300, "hp");
//enemyManager.addEnemy(10,10);

world.addEntity(new Player(windowW/2, windowH/2), "player", ["walls"]);

let playSize = 2000;
let padding = 200;
let playerMaxSize = 2;
let growthRate = 0.0005;
//wallManager.addWall(-playSize, -playSize, playSize*2, padding);
//wallManager.addWall(-playSize, playSize, playSize*2, padding);
//wallManager.addWall(-playSize, -playSize, padding, playSize*2);
//wallManager.addWall(0,0,0,0);
function seededRandom(seed){
	const a = 1664525;
    const c = 1013904223;
    const m = Math.pow(2, 32);

    let state = seed;

	state = (a * state + c) % m;
	return state / m;
}

let floor = new image("assets/floor.png");
let floor2 = new image("assets/floor2.png");
function drawFloor(){
	let ply = world.entities["player"];
	let invScl = 0.5 + 1/Camera.scale;
	let w = 64 * 2;
	let h = 64 * 2;
	let x = math.floor((ply.x-windowW*0.8*invScl)/w)*w;
	let y = math.floor((ply.y-windowH*0.8*invScl)/h)*h;
	for(let i = 0; i < windowW*2*invScl/w; i++){
		for(let j = 0; j < windowH*2*invScl/h; j++){
			let rect = getWorldRect([x+i*w, y+j*h, w+1, h+1]);
			let rand = 0;
			if(rand>0.5){
				floor2.drawImg(rect[0],rect[1],rect[2],rect[3],1,0);
			}else{
				floor.drawImg(rect[0],rect[1],rect[2],rect[3],1,0);
			}
		}
	}

}

function spawnEnemy(){
	let player = world.entities['player'];
	let [x,y] = getSpawnLoc();
	enemyManager.spawnTime = 2*math.max(0.1,math.exp(-timer/100));
	enemyManager.addEnemy(x, y);
}
function formatSeconds(seconds) {
    // Calculate minutes and seconds
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);

    // Pad the minutes and seconds with leading zeros if needed
    const paddedMinutes = String(minutes).padStart(2, '0');
    const paddedSeconds = String(secs).padStart(2, '0');

    // Return the formatted string
    return `${paddedMinutes}:${paddedSeconds}`;
}
function getSpawnLoc(){
	let ply = world.entities["player"];
	let w = 64*1.5;
	let invScl = 1/Camera.scale;
	let h = 43*1.5;
	let x = math.floor((ply.x-windowW*0.8*invScl)/w)*w;
	let y = math.floor((ply.y-windowH*0.8*invScl)/h)*h;
	let maxX = w*windowW*2*invScl/w;
	let maxY = h*windowH*2*invScl/h;
	if(math.random(0,1)>0.5){ // up or down
		x += math.random(-w,maxX);
		if(math.random(0,1) > 0.5){ // up
			y += maxY;
		}
	}else{ // left or right
		y += math.random(-h,windowW);
		if(math.random(0,1) > 0.5){ // left
			x += maxX;
		}
	}
	return [ x, y ];
}

function spawnShrink(){
	let [x,y] = getSpawnLoc();
	pickupManager.addPickup(x, y, "shrink");
	x += math.random(-600, 600);
	y += math.random(-600, 600);
	let type = "hp";
	if(math.random() > 0.4){ // heart
		type = "hp";
	}else if(math.random() > 0.5){
		type = "shotgun";
	}else{
		type = "minigun";
	}
	pickupManager.addPickup(x, y,type);
}

function spawnPikcup(){
	let [x,y] = getSpawnLoc();
	let type = "hp";
	if(math.random() > 0.4){ // heart
		type = "hp";
	}else if(math.random() > 0.5){
		type = "shotgun";
	}else{
		type = "minigun";
	}
	pickupManager.addPickup(x, y,type);
}

let test = (1/1.2)-0.4;
let timer = 0;
let arrow = new image("assets/arrow.png");
let clock = new image("assets/clock.png");
function drawArrow(player){
	let size_rect_scale = (player.size-test)/(playerMaxSize-test);
	size_rect_scale -= 0.5;
	if(size_rect_scale >= 0 && pickupManager.shrinkSpawned&&player.shrinking <= 0){
		let id = 0;
		for(let _ of pickupManager.pickups){
			let entity = world.entities[_];
			if(entity.type == "shrink"){
				id = entity.id;
			}
		}
		let shrink = world.entities[id];
		let x = shrink.x+shrink.w/2;
		let y = shrink.y+shrink.h/2;
		let w = 32 * player.size;
		let h = 32 * player.size;
		let dy = player.center.y - y;
		let dx = player.center.x - x;
		let theta = math.atan2(dy,dx);
		let dist = 128 * player.size;
		let drawX = player.center.x - math.cos(theta) *dist;
		let drawY = player.center.y - math.sin(theta) *dist;
		dist = math.sqrt(dx**2 + dy**2);
		if(dist > 500){
			let scaling = math.min(3,dist/500);
			let rect = enlargeRect(getWorldRect([drawX, drawY, w, h]), scaling, scaling);
			arrow.drawRotatedImg(rect[0],rect[1],rect[2],rect[3],1,theta-math.pi/2,w/2,h/2);
		}
	}
}

let gameOver = false;
let bar_mid = new image("assets/barHorizontal_white_mid.png");
let bar_left = new image("assets/barHorizontal_white_left.png");
let bar_right = new image("assets/barHorizontal_white_right.png");
let dot = new image("assets/dotBlue.png");
function drawBar(player){
	let size_rect_scale = (player.size-test)/(playerMaxSize-test);
	size_rect_scale -= 0.5;

	let scale = math.max(size_rect_scale + 0.5,0.1);
	scale *= 2;
	let h = 30;
	let pointRect = enlargeRect([windowW/2 + size_rect_scale*windowW/2, 30, h, h], scale, scale);
	let rightX = windowW/2 - windowW/4 + windowW/2 + 20;
	let rightY = 30;
	bar_mid.drawImg(windowW/2 - windowW/4, rightY, windowW/2+20, h);
	bar_right.drawImg(rightX, rightY, 10, h, 1);
	bar_left.drawImg(windowW/2 - windowW/4 - 10, rightY, 10,h,1);
	showText("Itty Bitty", 302, 52, 20);
	showText("Humongous", 685, 52, 20);
	dot.drawImg(pointRect[0], pointRect[1], pointRect[2], pointRect[3], 1);
}
function gameOverFunc(){
	Camera.shake = 1;
	Camera.shakeIntensity = 500;
	freeze = 100;
	gameOver = true;
}
function draw(){
	let scl = 1+Camera.scale;
	drawRect([0,0,windowW,windowH],"white",1,"white",1,true);
	//drawRect([0,0,windowW,windowH],"red");
	drawFloor();
	world.draw();

	let player = world.entities['player']
	drawBar(player);
	drawArrow(player);

	clock.drawImg(10,10,128*1.7,64*1.7, 1);
	let max_pickups = math.round(3*math.log(timer/40+2));
	if(math.round(timer) % 25 == 0 && pickupManager.pickups.length < max_pickups){
		for(let id of pickupManager.pickups){
			let entity = world.entities[id];
			let di = dist(entity.x,entity.y, player.x, player.y);
			if(di > 2000){
				pickupManager.deletePickup(entity.id);
			}
		}

		spawnPikcup();
	}
	showText(formatSeconds(timer), 120, 75, 40);
	if(!pickupManager.shrinkSpawned){
		spawnShrink();
	}
}

function update(DT){
	let dt = DT;
	if(timer > 0.1){
		world.update(dt);
		world.collisions();
		let player = world.entities['player']
		player.bulletManager.update(dt);

		enemyManager.update(dt);
		pickupManager.update(dt);
		particleManager.update(dt);

		if(player.size >= playerMaxSize){
			gameOverFunc();
		}else{
			player.size += growthRate;
		}

		if(player.size <= test){
			player.size = test;
		}
		if(player.hp <= 0){
			gameOverFunc();
		}
	}
	timer += dt;
}

function updateCamera(dt){
	let player = world.entities["player"]
	let target = [player.center.x-windowW/2, player.center.y-windowH/2];
	if(Camera.shake > 0){
		Camera.shake -= dt;
		target[0] += math.random(-Camera.shakeIntensity, Camera.shakeIntensity);
		target[1] += math.random(-Camera.shakeIntensity, Camera.shakeIntensity);
	}else{
		Camera.shakeIntensity = 50;
	}

	Camera.x = lerp(Camera.x, target[0], 0.1);
	Camera.y = lerp(Camera.y, target[1], 0.1);
	//console.log(player.center.x,player.center.y);
	//Camera.scale = player.size;
}

let previousTime = 0
let transitionTimer = 0;

function drawTransition(dt){
	if(transitionTimer > 0){
		transitionTimer -= dt;
		let alp = transitionTimer*2;
		drawRect([0,0,windowW,windowH], "white", 1, "white", math.max(alp,0), true);
		let scl = 1.2 * math.exp(-10*(transitionTimer-0.5)**2)-0.09;
		let rect = [0,0,windowW*scl, windowH];
		drawRect(rect, "black", 1, "black", 1, true);
	}
}

function reset(){
	menu = false;
	Camera.shake = 0;
	gameOver = false;
	world.entities = {};
	world.collisionLayers = {};
	world.addEntity(new Player(windowW/2, windowH/2), "player", ["walls"]);
	enemyManager = new EnemyManager();
	pickupManager = new PickupManager();
	particleManager = new ParticleManager();
	timer = 0;
	freeze = 0;
}

let menu = true;
let menuImg = new image("assets/menu.png");
let buttonImg = new image("assets/blue_button00.png");
let tutorial = false;
let tut_image = new image("assets/tutorial.png");
function menuFunc(){
	if(tutorial){
		drawRect([0,0,windowW,windowH], "black", 1, "black", 1, true);
		tut_image.drawImg(windowW/2 - 319/2, 0, 320, 540, 1);
		if(checkKey("Space")){
			tutorial = false;
			reset();
			transitionTimer = 1;
		}
	}else{
		menuImg.drawImg(0,0,windowW,windowH,1);
		let menuButtonRect = [windowW/2-125, windowH/2-32, 250, 64];
		let [mouseX, mouseY] = [mouse.x,mouse.y];
		if(AABBCollision(menuButtonRect, [mouseX, mouseY, 0,0])){
			menuButtonRect = enlargeRect(menuButtonRect, 1.1, 1.1);
			if(mouse.pressed.left){
				tutorial = true;
				transitionTimer = 1;
			}
		}
		buttonImg.drawImg(menuButtonRect[0]-10, menuButtonRect[1]+10, menuButtonRect[2], menuButtonRect[3], 0.3);
		buttonImg.drawImg(menuButtonRect[0], menuButtonRect[1], menuButtonRect[2], menuButtonRect[3], 1);
	}
}

let redButton = new image("assets/red_button00.png");
let yellowButton = new image("assets/yellow_button00.png");
function main(currentTime){ // requestAnimationFrame passes in a timestamp
	if(previousTime < 150){previousTime=currentTime;} // prevents skipping at startup
	let dt = (currentTime-previousTime)/1000; // in seconds
	previousTime = currentTime;

	if(menu){
		menuFunc();
	}else{
		if(freeze <= 0){
			update(dt);
		}
		updateCamera(dt);
		draw();

		if(gameOver){
			let menuButtonRect = [windowW/2-128, windowH/2-32, 256, 64];
			let [mouseX, mouseY] = [mouse.x,mouse.y];
			if(AABBCollision(menuButtonRect, [mouseX, mouseY, 0,0])){
				menuButtonRect = enlargeRect(menuButtonRect, 1.1, 1.1);
				if(mouse.pressed.left){
					menu = true;
					transitionTimer = 1;
				}
			}
			let retryButtonRect = [windowW/2-128, windowH/2+48, 256, 64];
			if(AABBCollision(retryButtonRect, [mouseX, mouseY, 0,0])){
				retryButtonRect = enlargeRect(retryButtonRect, 1.1, 1.1);
				if(mouse.pressed.left){
					reset();
					transitionTimer = 1;
				}
			}
			redButton.drawImg(menuButtonRect[0], menuButtonRect[1], menuButtonRect[2], menuButtonRect[3], 1);
			yellowButton.drawImg(retryButtonRect[0], retryButtonRect[1], retryButtonRect[2], retryButtonRect[3], 1);
			showText("Game Over!", windowW/2, windowH/2-100, 100, "black", true);
		}
	}
	drawTransition(dt);

	oldKeys = {...keys};
	mouseUpdate();

	// recursive loop
	requestAnimationFrame(main);
}

requestAnimationFrame(main);

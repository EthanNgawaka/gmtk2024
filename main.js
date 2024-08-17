let world = new World;

class WallManager{
	constructor(){
		this.walls = [];
	}
	
	addWall(x,y,w,h){
		let id = "wall"+this.walls.length;
		this.walls.push(id);
		world.addEntity(new Wall(id, x,y,w,h), "walls", "player");
	}
}
let wallManager = new WallManager();

class Wall extends StaticBody{
	constructor(id,x,y,w,h){
		super(id,x,y,w,h);
	}
}

world.addEntity(new Player(windowW/2, windowH/2), "player", ["walls"]);
wallManager.addWall(100, 200, 300, 300);
console.log(world.entities);

function draw(){
	let scl = 1+Camera.scale;
	drawRect([0,0,windowW,windowH],"white",1,"white",1,true);
	drawRect([0,0,windowW,windowH],"red");
	world.draw();
}

function update(dt){
	world.update(dt);
	world.collisions();

	updateCamera(dt);
}

function updateCamera(dt){
	let player = world.entities["player"]

	Camera.x = lerp(Camera.x, player.center.x-windowW/2, 0.1);
	Camera.y = lerp(Camera.y, player.center.y-windowH/2, 0.1);
	//console.log(player.center.x,player.center.y);
	//Camera.scale = player.size;
}

let previousTime = 0
function main(currentTime){ // requestAnimationFrame passes in a timestamp
	if(previousTime < 150){previousTime=currentTime;} // prevents skipping at startup
	const dt = (currentTime-previousTime)/1000; // in seconds
	previousTime = currentTime;

    update(dt);
    draw();

	oldKeys = {...keys};
	mouseUpdate();

	// recursive loop
	requestAnimationFrame(main);
}

requestAnimationFrame(main);

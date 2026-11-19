import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';

let scene, renderer;
let camera;
let info;
let grid;
let estrella,
  Planetas = [],
  Lunas = [];
let t0 = 0;
let accglobal = 0.001;
let timestamp;
let perfil, plano;
let raycaster;
const MAX_POINTS = 500;
let npuntos;

let camcontrols; 
let miNave;

const configuracion = {
  modoSeleccionado: 'Vista General',
  planetaElegido: 'Venus'
};

let menuPlanetas = null;

const gui = new GUI();

gui.add(configuracion, 'modoSeleccionado', ["Planetas", "Satelite", "Vista General", "Vista Nave", "Posicionar Nave"])
  .name('Elegir Modo')
  .onChange((valor) => {
    
    if (valor === "Planetas") {
      if (!menuPlanetas) {
        menuPlanetas = gui.add(configuracion, 'planetaElegido', ['Mercurio', 'Venus', 'Tierra', 'Marte', 'Jupiter', 'Saturno', 'Urano', 'Neptuno'])
          .name('¿Qué planeta?')
          .onChange((planeta) => {
             console.log("Has elegido el planeta:", planeta);
          });
      }
    } 
    
    else {
      if (menuPlanetas) {
        menuPlanetas.destroy(); 
        menuPlanetas = null;   
      }
    }
  });


const texturaTierra = new THREE.TextureLoader().load("src/texturas/tierra8k.jpg");
const texturaMercurio = new THREE.TextureLoader().load("src/texturas/2k_mercury.jpg");
const texturaVenus = new THREE.TextureLoader().load("src/texturas/2k_venus_atmosphere.jpg");
const texturaMarte = new THREE.TextureLoader().load("src/texturas/2k_mars.jpg");
const texturaJupiter = new THREE.TextureLoader().load("src/texturas/2k_jupiter.jpg");
const texturaSaturno = new THREE.TextureLoader().load("src/texturas/2k_saturn.jpg");
const texturaUrano = new THREE.TextureLoader().load("src/texturas/2k_uranus.jpg");
const texturaNeptuno = new THREE.TextureLoader().load("src/texturas/2k_neptune.jpg");
const texturaLuna = new THREE.TextureLoader().load("src/moon_1024.jpg");
const texturaSol = new THREE.TextureLoader().load("src/8k_sun.jpg");

const texturaEuropa = new THREE.TextureLoader().load("src/Europa.png");
const texturaGanymede = new THREE.TextureLoader().load("src/ganymede.jpg");
const texturaIo = new THREE.TextureLoader().load("src/Io.png");
const texturaTitan = new THREE.TextureLoader().load("src/Titan.png");

const texturaNave = new THREE.TextureLoader().load("src/texturas/nave.jpg");

init();
animationLoop();

function init() {
  info = document.createElement("div");
  info.style.position = "absolute";
  info.style.top = "30px";
  info.style.width = "100%";
  info.style.textAlign = "center";
  info.style.color = "#fff";
  info.style.fontWeight = "bold";
  info.style.backgroundColor = "transparent";
  info.style.zIndex = "1";
  info.style.fontFamily = "Monospace";
  info.innerHTML = "three.js - sol y planetas";
  document.body.appendChild(info);

  //Defino cámara
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 0, 10);

  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  camcontrols = new OrbitControls(camera, renderer.domElement);


  
  Estrella(2.5, 0xffff00, texturaSol);
  //Planetas del sistema solar
  Planeta(0.25, 3.8, 1.6, 0xffffff, 1.0, 1, texturaMercurio);
  Planeta(0.45, 5.2, 1.2, 0xffffff, 1.0, 1.0, texturaVenus);
  Planeta(0.5, 6.8, 1, 0xffffff, 1.0, 1.0, texturaTierra);
  Planeta(0.32, 8.5, 0.8, 0xffffff, 1.0, 1.0, texturaMarte);
  Planeta(1.35, 12, 0.4, 0xffffff, 1.0, 1.0, texturaJupiter);
  Planeta(1.15, 16.50, 0.30, 0xffffff, 1.0, 1.0, texturaSaturno);
  Planeta(0.85, 22.50, 0.20, 0xffffff, 1.0, 1.0, texturaUrano);
  Planeta(0.80, 28.50, 0.15, 0xffffff, 1.0, 1.0, texturaNeptuno);

  Luna(Planetas[2], 0.14, 1.1, 3.2, 0xffffff, 0.0, texturaLuna);

  miNave = Nave(Planetas[2], 0.08, 0.9, 2, 0xffffff, 0.2, texturaNave);

  Luna(Planetas[4], 0.14, 1.8, 4, 0xffffff, 0.0, texturaIo);
  Luna(Planetas[4], 0.13, 2.3, 2.8, 0xffffff, 0.0, texturaEuropa);
  Luna(Planetas[4], 0.20, 2.9, 1.8, 0xffffff, 0.0, texturaGanymede);
  Luna(Planetas[5], 0.20, 2.4, 2.2, 0xffffff, 0.0, texturaTitan);

  //Inicio tiempo
  t0 = Date.now();
  //EsferaChild(objetos[0],3.0,0,0,0.8,10,10, 0x00ff00);

  let geometryp = new THREE.PlaneGeometry(2000, 2000);
  let materialp = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    side: THREE.DoubleSide,
  });
  plano = new THREE.Mesh(geometryp, materialp);
  plano.visible = false;
  scene.add(plano);


  raycaster = new THREE.Raycaster();

  let geometry = new THREE.BufferGeometry();
  
  // 2. Preparas un "almacén" vacío para los puntos (MAX_POINTS * 3 coordenadas x,y,z)
  let positions = new Float32Array(MAX_POINTS * 3);
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  // Configuras para que empiece dibujando 0 puntos
  npuntos = 0;
  geometry.setDrawRange(0, npuntos);
  let material = new THREE.LineBasicMaterial({ color: 0xff0000 });
  
  // 3. Creas la línea y la guardas en la variable global 'perfil'
  // IMPORTANTE: Escribe solo 'perfil =', NO 'let perfil ='
  perfil = new THREE.Line(geometry, material); 
  
  // Añades la línea a la escena
  scene.add(perfil);

  
  let isDragging = false;
  let startX = 0;
  let startY = 0;

  renderer.domElement.addEventListener("mousedown", (e) => {
    isDragging = false;
    startX = e.clientX;
    startY = e.clientY;
  });

  renderer.domElement.addEventListener("mousemove", (e) => {

    if (Math.abs(e.clientX - startX) > 3 || Math.abs(e.clientY - startY) > 3) {
      isDragging = true;
    }
  });

  renderer.domElement.addEventListener("mouseup", (e) => {
    if (!isDragging) {
      onDocumentMouseDown(e);
    }
  });


}

function Estrella(rad, col, texture = undefined) {
  let geometry = new THREE.SphereGeometry(rad, 10, 10);
  let material = new THREE.MeshBasicMaterial({ color: col });
  estrella = new THREE.Mesh(geometry, material);

  if (texture != undefined) {
    material.map = texture;
  }

  scene.add(estrella);
}

function Planeta(radio, dist, vel, col, f1, f2, texture = undefined) {
  let geom = new THREE.SphereGeometry(radio, 10, 10);
  let mat = new THREE.ShaderMaterial({
    vertexShader: vertexShaderPlaneta(),
    fragmentShader: fragmentShaderPlaneta(),
  });
  let planeta = new THREE.Mesh(geom, mat);

  planeta.userData.radio = radio;
  planeta.userData.dist = dist;
  planeta.userData.speed = vel;
  planeta.userData.f1 = f1;
  planeta.userData.f2 = f2;

  if (texture != undefined) {
    mat.map = texture;
  }

  Planetas.push(planeta);
  scene.add(planeta);

  //Dibuja trayectoria, con
  let curve = new THREE.EllipseCurve(
    0,
    0, // centro
    dist * f1,
    dist * f2 // radios elipse
  );
  //Crea geometría
  let points = curve.getPoints(50);
  let geome = new THREE.BufferGeometry().setFromPoints(points);
  let mate = new THREE.LineBasicMaterial({ color: 0xffffff });
  // Objeto
  let orbita = new THREE.Line(geome, mate);
  scene.add(orbita);

}

function Luna(planeta, radio, dist, vel, col, angle, texture = undefined) {
  var pivote = new THREE.Object3D();
  pivote.rotation.x = angle; //si no nulo, rotación suera de plano
  planeta.add(pivote);
  var geom = new THREE.SphereGeometry(radio, 10, 10);
  var mat = new THREE.MeshBasicMaterial({ color: col });
  var luna = new THREE.Mesh(geom, mat);
  luna.userData.dist = dist;
  luna.userData.speed = vel;

  if (texture != undefined) {
    mat.map = texture;
  }


  Lunas.push(luna);
  pivote.add(luna);
}

//Bucle de animación
function animationLoop() {
  timestamp = (Date.now() - t0) * accglobal;

  requestAnimationFrame(animationLoop);

  //Modifica rotación de todos los objetos
  for (let object of Planetas) {
    object.position.x =
      Math.cos(timestamp * object.userData.speed) *
      object.userData.f1 *
      object.userData.dist;
    object.position.y =
      Math.sin(timestamp * object.userData.speed) *
      object.userData.f2 *
      object.userData.dist;
  }

  for (let object of Lunas) {
    object.position.x =
      Math.cos(timestamp * object.userData.speed) * object.userData.dist;
    object.position.y =
      Math.sin(timestamp * object.userData.speed) * object.userData.dist;
  }

  if (configuracion.modoSeleccionado === "Vista Nave" && miNave) {

    let posicionNave = new THREE.Vector3();
    miNave.getWorldPosition(posicionNave);

    
    camera.position.set(posicionNave.x, posicionNave.y + 0.1, posicionNave.z + 0.3);

    let posicionPlaneta = new THREE.Vector3();
    miNave.userData.planetaPadre.getWorldPosition(posicionPlaneta);

    camcontrols.target.copy(posicionPlaneta);

    camcontrols.update(); 
  }
  else if (configuracion.modoSeleccionado === "Vista General") {
    camcontrols.target.set(0, 0, 0);
    camcontrols.update();
  }

  renderer.render(scene, camera);
}

function onDocumentMouseDown(event) {
  //Conversión coordenadas del puntero
  const mouse = {
    x: (event.clientX / renderer.domElement.clientWidth) * 2 - 1,
    y: -(event.clientY / renderer.domElement.clientHeight) * 2 + 1,
  };

  //Intersección, define rayo
  raycaster.setFromCamera(mouse, camera);

  // Intersecta
  const intersects = raycaster.intersectObject(plano);
  // ¿Hay alguna intersección?
  if (intersects.length > 0) {
    //Añade vértice a la pòlilínea
    const vertices = perfil.geometry.attributes.position.array;

    vertices[npuntos * 3] = intersects[0].point.x;
    vertices[npuntos * 3 + 1] = intersects[0].point.y;
    vertices[npuntos * 3 + 2] = intersects[0].point.z;
    npuntos++;
    //Muestra el valor de la intersección
    console.log(intersects[0].point);

    let posX = intersects[0].point.x;
    let posY = intersects[0].point.y; 


    let radioOrbita = Math.sqrt(posX * posX + posY * posY);

    if (configuracion.modoSeleccionado == "Planetas") {
      switch (configuracion.planetaElegido){
        case "Mercurio":

          Planeta(0.25, radioOrbita, 1.6, 0xffffff, 1.0, 1.5, texturaMercurio);

          break;
        
        case "Venus":

          Planeta(0.45, radioOrbita, 1.2, 0xffffff, 1.0, 1.5, texturaVenus);

          break;

        case "Tierra":

          Planeta(0.5, radioOrbita, 1.0, 0xffffff, 1.0, 1.5, texturaTierra);

          break;

        case "Marte":

          Planeta(0.32, radioOrbita, 0.8, 0xffffff, 1.0, 1.5, texturaMarte);

          break;
        
        case "Jupiter":

          Planeta(1.35, radioOrbita, 0.4, 0xffffff, 1.0, 1.5, texturaJupiter);

          break;

        case "Saturno":

          Planeta(1.15, radioOrbita, 0.30, 0xffffff, 1.0, 1.5, texturaSaturno);

          break;

        case "Urano":

          Planeta(0.85, radioOrbita, 0.2, 0xffffff, 1.0, 1.5, texturaUrano);

          break;
        
        case "Neptuno":

          Planeta(0.80, radioOrbita, 0.15, 0xffffff, 1.0, 1.5, texturaNeptuno);

          break;
        
      }
    }
    else if(configuracion.modoSeleccionado == "Satelite"){
      const puntoClic = intersects[0].point;
  
      let planetaMasCercano = null;
      let distanciaMinima = Infinity; 

      Planetas.forEach((planeta) => {

        const distancia = puntoClic.distanceTo(planeta.position);
        if (distancia < distanciaMinima) {
          distanciaMinima = distancia;
          planetaMasCercano = planeta;
        }
      });
      
      let radioPlaneta = planetaMasCercano.userData.radio;
      let distanciaPlaneta = radioPlaneta + 0.7;

      Luna(planetaMasCercano, 0.15, distanciaPlaneta, -3.5, 0xffffff, 0.0, texturaLuna);

    } else if(configuracion.modoSeleccionado == "Posicionar Nave"){
      const puntoClic = intersects[0].point;
  
      let planetaMasCercano = null;
      let distanciaMinima = Infinity; 

      Planetas.forEach((planeta) => {

        const distancia = puntoClic.distanceTo(planeta.position);
        if (distancia < distanciaMinima) {
          distanciaMinima = distancia;
          planetaMasCercano = planeta;
        }
      });

      if (miNave) {

        const index = Lunas.indexOf(miNave);
        if (index > -1) {
          Lunas.splice(index, 1);
        }

        if (miNave.parent && miNave.parent.parent) {
          miNave.parent.parent.remove(miNave.parent);
        }

        miNave.geometry.dispose();
        miNave.material.dispose();
      }

      let radioPlaneta = planetaMasCercano.userData.radio;
      let distanciaPlaneta = radioPlaneta + 1;

      miNave = Nave(planetaMasCercano, 0.08, distanciaPlaneta, 2, 0xffffff, 0.2, texturaNave);

    }
  }
}

function Nave(planeta, radio, dist, vel, col, angle, texture = undefined) {
  var pivote = new THREE.Object3D();
  pivote.rotation.x = angle;
  planeta.add(pivote);
  let geom = new THREE.ConeGeometry(radio, radio * 2.5, 8);
  geom.rotateZ(-Math.PI / 2);
  var mat = new THREE.MeshBasicMaterial({ color: col });
  var nave = new THREE.Mesh(geom, mat);
  nave.userData.dist = dist;
  nave.userData.speed = vel;
  nave.userData.planetaPadre = planeta;

  if (texture != undefined) {
    mat.map = texture;
  }


  Lunas.push(nave);
  pivote.add(nave);

  return nave;
}

function vertexShaderPlaneta() {
    return `
      varying vec3 vWorldPos;
      void main() {
        // Calculamos la posición global del vértice en la escena (incluyendo su traslación en X e Y)
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPos = worldPosition.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPosition;
      }
    `;
  }
  
  function fragmentShaderPlaneta() {
    return `
      varying vec3 vWorldPos;
      void main() {
        // Mapeamos las coordenadas X e Y de la escena a colores RGB suaves
        float r = clamp(vWorldPos.x * 0.05 + 0.5, 0.1, 1.0);
        float g = clamp(vWorldPos.y * 0.05 + 0.5, 0.1, 1.0);
        float b = 0.85;
        gl_FragColor = vec4(r, g, b, 1.0);
      }
    `;
  }
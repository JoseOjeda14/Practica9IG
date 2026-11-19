import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

let scene, renderer;
let camera;
let info;
let grid;
let camcontrols;
let uniforms;
let objetos = [];
let Planetas = [];
let t0 = 0;
let accglobal = 0.001;
let timestamp;

init();
animationLoop();

function init() {
  camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 0, 15);

  scene = new THREE.Scene();
  renderer = new THREE.WebGLRenderer();
  renderer.setPixelRatio(window.devicePixelRatio);

  document.body.appendChild(renderer.domElement);

  //Objetos
  uniforms = {
    u_time: {
      type: "f",
      value: 0.0,
    },
    u_resolution: {
      type: "v2",
      value: new THREE.Vector2(),
    },
    u_mouse: {
      type: "v2",
      value: new THREE.Vector2(),
    },
  };

  t0 = Date.now();

  FondoShader();
  EsferaShader(0, 0, 0, 1, 10, 10, fragmentShader_centro());
  for (let i = 0; i < 6; i++) {
    let p = Planeta(0.35, 4.5, 1.2 + i * 0.15, 0xffffff, 1.0, 1.0);
    p.userData.desfase = i * 0.16;
  }

  camcontrols = new OrbitControls(camera, renderer.domElement);

  onWindowResize();
  window.addEventListener("resize", onWindowResize, false);
}

function onWindowResize(e) {
  renderer.setSize(window.innerWidth, window.innerHeight);
  uniforms.u_resolution.value.x = renderer.domElement.width;
  uniforms.u_resolution.value.y = renderer.domElement.height;
}

//Evento de ratón
document.onmousemove = function (e) {
  //Normaliza las coordenadas del puntero
  uniforms.u_mouse.value.x = e.pageX / window.innerWidth;
  uniforms.u_mouse.value.y = e.pageY / window.innerHeight;
};

function EsferaShader(px, py, pz, radio, nx, ny, fragsh) {
  let geometry = new THREE.SphereBufferGeometry(radio, nx, ny);
  let material = new THREE.ShaderMaterial({
    uniforms: uniforms,
    //Shaders
    fragmentShader: fragsh,
    vertexShader: vertexShader(),
  });

  let mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(px, py, pz);
  scene.add(mesh);
  objetos.push(mesh);

  return mesh;
}

function vertexShader() {
  return `
				varying vec3 vUv; 
				varying vec4 modelViewPosition; 
				
				void main() {
				  vUv = position; 
				  vec4 modelViewPosition = modelViewMatrix * vec4(vUv, 1.0);
				  gl_Position = projectionMatrix * modelViewPosition; 
				}
			  `;
}

function Planeta(radio, dist, vel, col, f1, f2) {
  let planeta = EsferaShader(
    dist * f1,
    0,
    0,
    radio,
    10,
    10,
    fragmentShader_planeta()
  );

  planeta.userData.radio = radio;
  planeta.userData.dist = dist;
  planeta.userData.speed = vel;
  planeta.userData.f1 = f1;
  planeta.userData.f2 = f2;

  Planetas.push(planeta);

  let curve = new THREE.EllipseCurve(0, 0, dist * f1, dist * f2);
  //Crea geometría
  let points = curve.getPoints(50);
  let geome = new THREE.BufferGeometry().setFromPoints(points);
  let mate = new THREE.LineBasicMaterial({ color: 0xffffff });

  return planeta;
}

function FondoShader() {
  let geometry = new THREE.SphereGeometry(100, 32, 32);
  let material = new THREE.ShaderMaterial({
    uniforms: uniforms,
    vertexShader: vertexShader(),
    fragmentShader: fragmentShader_fondo(),
    side: THREE.BackSide,
  });

  let fondo = new THREE.Mesh(geometry, material);
  scene.add(fondo);
}

function fragmentShader_planeta() {
  return `
    uniform vec2 u_resolution;
    uniform float u_time;

    void main() {
      vec2 p = (gl_FragCoord.xy * 2.0 - u_resolution) / min(u_resolution.x, u_resolution.y);
      p += cameraPosition.xy * 0.03;

      float r = length(p);
      float a = atan(p.y, p.x) + sin(r * 10.0 - u_time * 3.0) * 0.2;

      float z = 1.6 / (r + 0.08) + u_time * 1.8;
      float patron = step(0.0, sin(z * 6.0 + a * 3.0 + 3.1416));

      vec3 col1 = vec3(0.05, 0.05, 0.14);
      vec3 col2 = vec3(0.60, 0.55, 0.95);

      gl_FragColor = vec4(mix(col1, col2, patron), 1.0);
    }
  `;
}

function fragmentShader_fondo() {
  return `
    uniform vec2 u_resolution;
    uniform float u_time;

    void main() {
      vec2 p = (gl_FragCoord.xy * 2.0 - u_resolution) / min(u_resolution.x, u_resolution.y);
      p += cameraPosition.xy * 0.03;

      float r = length(p);
      float a = atan(p.y, p.x);

      float z = 1.6 / (r + 0.08) + u_time * 1.8;
      float patron = step(0.0, sin(z * 6.0 + a * 3.0));

      vec3 col1 = vec3(0.03, 0.03, 0.08);
      vec3 tinte = vec3(0.28 + sin(cameraPosition.x * 0.15) * 0.12, 0.25, 0.48 + cos(cameraPosition.y * 0.15) * 0.12);
      vec3 col2 = tinte * smoothstep(0.0, 0.3, r);

      gl_FragColor = vec4(mix(col1, col2, patron), 1.0);
    }
  `;
}

function fragmentShader_centro() {
  return `
    uniform vec2 u_resolution;
    uniform float u_time;

    void main() {
      vec2 p = (gl_FragCoord.xy * 2.0 - u_resolution) / min(u_resolution.x, u_resolution.y);
      p += cameraPosition.xy * 0.03;

      float r = length(p);
      float a = atan(p.y, p.x);

      float z = 1.6 / (r + 0.22) + u_time * 9.0;
      
      float patron = step(0.0, sin(z * 6.0 - a * 3.0));

      vec3 colOscuro = vec3(0.03, 0.03, 0.09);
      vec3 colBrillo = vec3(0.65, 0.60, 0.95);

      gl_FragColor = vec4(mix(colOscuro, colBrillo, patron), 1.0);
    }
  `;
}

function animationLoop() {
  requestAnimationFrame(animationLoop);
  timestamp = (Date.now() - t0) * accglobal;
  uniforms.u_time.value += 0.05;

  for (let object of objetos) {
    object.rotation.y += 0.01;
  }

  for (let object of Planetas) {
    let ciclo =
      (timestamp * object.userData.speed * 0.4 + object.userData.desfase) % 1.0;

    let radioActual = (1.0 - ciclo) * object.userData.dist;
    let angulo = ciclo * Math.PI * 6.0;
    object.position.x = Math.cos(angulo) * radioActual * object.userData.f1;
    object.position.y = Math.sin(angulo) * radioActual * object.userData.f2;

    object.position.z = (1.0 - ciclo) * 8.0;
    let escala = Math.max(0.05, 1.0 - ciclo);
    object.scale.set(escala, escala, escala);
  }

  renderer.render(scene, camera);
}

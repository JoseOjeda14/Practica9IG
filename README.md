# Practica 9 IG

# Vórtice Gravitacional

Proyecto de gráficos generativos basado en **Fragment Shaders**. La pieza crea una ilusión de profundidad infinita mediante un túnel en espiral que absorbe hacia el centro, un núcleo pulsante que rota en sentido inverso y una cascada de planetas que caen en espiral utilizando camuflaje óptico.

El proyecto se divide en dos entregas:
1. **Shader 2D en *The Book of Shaders*:** Implementación optimizada bajo la restricción de **Tiny Code** ($\le 512$ bytes) junto con su versión legible comentada.
2. **Escena 3D Interactiva en CodeSandbox (Three.js):** Integración de los shaders sobre geometrías esféricas en un sistema planetario tridimensional con cámara orbital.

---

## 1. Concepto Visual y Fundamento Matemático

Para lograr la ilusión óptica de absorción y profundidad sin que los elementos parezcan superpuestos artificialmente, se aplican tres técnicas principales en el *Fragment Shader*:

* **Perspectiva de Túnel Infinito:** Tras convertir las coordenadas de pantalla a coordenadas polares, se calcula la profundidad. Al dividir por el radio, las franjas se estrechan progresivamente hacia el origen, generando una sensación de caída hacia el fondo.
* **Camuflaje Óptico:** Los planetas comparten exactamente la misma paleta cromática y la misma función de onda que el túnel de fondo, pero desplazando su fase. De este modo, las franjas claras de cada planeta coinciden con las franjas oscuras del fondo, integrándolos en el vórtice.
* **Singularidad Central Contrarrotatoria:** Dentro del radio central, se invierte el signo del ángulo, se aumenta la velocidad de rotación y se suaviza la curvatura para evitar el *aliasing* en el eje y potenciar el efecto de succión.



https://github.com/user-attachments/assets/77da6c7d-ef18-4ed5-8449-b5ac501bced7



---

## 2. Entrega *The Book of Shaders*

### Versión Minificada
Código optimizado en una única línea para su ejecución directa en el editor web de *The Book of Shaders*, cumpliendo el límite de 512 bytes:

```glsl
precision mediump float;uniform vec2 u_resolution;uniform float u_time;void main(){vec2 R=u_resolution,p=(gl_FragCoord.xy*2.-R)/R.y;float t=u_time,r=length(p),a=atan(p.y,p.x),m=0.,s=r<.28+sin(t*6.)/50.?-1.:1.,z=1.6/(r+(s<0.?.22:.08))+t*(s<0.?12.:10.),c,d,f;for(int i=0;i<6;i++){f=float(i);c=fract(t*(.4+f*.05)+f*.16);d=1.-c;if(length(p-cos(c*18.85-vec2(0.,1.57))*d*.85)<d*.07)m=1.;}gl_FragColor=vec4(mix(vec3(.03,.03,.1),s<0.||m>0.?vec3(.65,.6,.95):vec3(.3,.27,.5),step(0.,sin(z*6.+s*a*3.+m*3.14))),1.);}

```


https://github.com/user-attachments/assets/3911ccf5-d3e7-4a0f-b26f-ca0fcca75e94



---

## 3. Escena 3D en CodeSandbox: Sistema Planetario

Además de la escena principal del vórtice (script_32_shader_mousetime.js), el proyecto incluye una segunda implementación en src/codigoplanetas.js sobre el sistema solar completo:Color Dinámico según Posición (X, Y): A medida que los planetas describen sus órbitas alrededor del Sol, sus coordenadas espaciales (x, y) se normalizan respecto al radio máximo de su órbita para modular dinámicamente los canales de color RGB en tiempo real, o mediante ShaderMaterial leyendo la posición mundial vWorldPos. De este modo, cada planeta varía su tonalidad cromática en función del cuadrante orbital en el que se encuentre.


https://github.com/user-attachments/assets/4d0c8f4e-b35b-4877-a192-bd11e7bfd207


## Uso de IA

Se ha utilizado IA como herramienta de apoyo para comprimir el código GLSL de la versión de The Book of Shaders, logrando cumplir con la restricción de tamaño Tiny Code.


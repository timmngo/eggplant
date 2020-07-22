import * as THREE from './three.module.js';
import { GLTFLoader } from './GLTFLoader.js';

var camera, scene, renderer;

var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2( 1, 1 );
var rotationMatrix = new THREE.Matrix4().makeRotationX( 0.1 );
var instanceMatrix = new THREE.Matrix4();
var matrix = new THREE.Matrix4();

var mesh;
var meshGreen;
var amount = 10;
const radius = 20
var count = Math.pow( amount, 3 );
var dummy = new THREE.Object3D();

init();
animate();

function init() {

    camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.1, 1000 );

    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0xf0f0f0 );

    var light = new THREE.DirectionalLight( 0xffffdd, 1.2 );
    light.position.set( 1, 1, 1 ).normalize();

    var backlight = new THREE.DirectionalLight( 0x0099cc, 0.1 );
    backlight.position.set( -0.9, -0.9, -1.1 ).normalize();

    var ambLight = new THREE.AmbientLight( 0x808080 ); // soft white light

    scene.add( light );
    scene.add( ambLight );
    scene.add( backlight );

    var gltfLoader = new GLTFLoader();
    gltfLoader.load('eggplant.glb', function ( gltf ) {
            let geometry = gltf.scene.children[1].geometry;
            geometry.computeVertexNormals();
            
            let geometryGreen = gltf.scene.children[2].geometry;
            geometryGreen.computeVertexNormals();

            // var material = new THREE.MeshNormalMaterial();
            let material = new THREE.MeshPhysicalMaterial({
                color: '#493142',
                roughness: 0.4,
            });

            var materialGreen = new THREE.MeshPhysicalMaterial({
                color: '#8abb4c',
                roughness: 0.9,
            });

            mesh = new THREE.InstancedMesh( geometry, material, count );
            mesh.instanceMatrix.setUsage( THREE.DynamicDrawUsage ); // will be updated every frame
            scene.add( mesh );

            meshGreen = new THREE.InstancedMesh( geometryGreen, materialGreen, count );
            meshGreen.instanceMatrix.setUsage( THREE.DynamicDrawUsage ); // will be updated every frame
            scene.add( meshGreen );

            setRandomTransformation();
        },
        // called while loading is progressing
        function ( xhr ) {
            console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
        },
        // called when loading has errors
        function ( error ) {
            console.log( 'An error happened' );
        }
    );

    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );

    document.body.appendChild( renderer.domElement );
    document.addEventListener( 'mousemove', onDocumentMouseMove, false );
    window.addEventListener( 'resize', onWindowResize, false );
}

function onWindowResize() {
    let w = window.innerWidth;
    let h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize( w, h );
}

function onDocumentMouseMove( event ) {
    event.preventDefault();
    mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
}

function animate() {
    requestAnimationFrame( animate );
    render();
}

function setRandomTransformation() {
    if ( mesh && meshGreen ) {

        for ( var i = 0; i < 1000; i ++ ) {
            dummy.position.x = Math.random() * 130 - 65;
            dummy.position.y = Math.random() * 130 - 65;
            dummy.position.z = Math.random() * 130 - 65;

            dummy.rotation.x = Math.random() * 2 * Math.PI;
            dummy.rotation.y = Math.random() * 2 * Math.PI;
            dummy.rotation.z = Math.random() * 2 * Math.PI;

            let xScale = 2.5 * Math.random() + 1.0;
            let yzScale = 2 * Math.random() + 1.5;
            dummy.scale.x = xScale;
            dummy.scale.y = yzScale;
            dummy.scale.z = yzScale;

            dummy.updateMatrix();

            mesh.setMatrixAt( i, dummy.matrix );
            meshGreen.setMatrixAt( i, dummy.matrix );
        }

        mesh.instanceMatrix.needsUpdate = true;
        meshGreen.instanceMatrix.needsUpdate = true;

    }
}

function render() {

    raycaster.setFromCamera( mouse, camera );

    if (!mesh) {
        return;
    }

    var intersection = raycaster.intersectObject( mesh );

    if ( intersection.length > 0 ) {

        var instanceId = intersection[ 0 ].instanceId;

        mesh.getMatrixAt( instanceId, instanceMatrix );
        meshGreen.getMatrixAt( instanceId, instanceMatrix );
        matrix.multiplyMatrices( instanceMatrix, rotationMatrix );

        mesh.setMatrixAt( instanceId, matrix );
        meshGreen.setMatrixAt( instanceId, matrix );
        mesh.instanceMatrix.needsUpdate = true;
        meshGreen.instanceMatrix.needsUpdate = true;

    }

    var time = Date.now() * 0.0004;

    camera.position.x = radius * Math.sin( time );
    camera.position.y = radius * Math.sin( time );
    camera.position.z = radius * Math.cos( time );
    camera.lookAt( scene.position );

    camera.updateMatrixWorld();

    renderer.render( scene, camera );

}
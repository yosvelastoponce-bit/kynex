import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
export function createLaboratoryVisual(scene,origin,floorY) {
  const root=new THREE.Group(); root.name='KYNEX RESOURCE LAB 01'; root.position.set(origin.x,floorY,origin.z); scene.add(root)
  let disposed=false
  const release=(model)=>model.traverse(o=>{o.geometry?.dispose(); for(const m of [].concat(o.material??[]))m.dispose()})
  const ready=new GLTFLoader().loadAsync(`${import.meta.env.BASE_URL}models/resource-lab-01.glb`).then(gltf=>{
    if(disposed){release(gltf.scene);return}
    gltf.scene.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true}})
    root.add(gltf.scene)
    for(const z of [-1.6,1.6]) {const light=new THREE.PointLight(0xc5eee0,6,6);light.position.set(-8,2.2,z);root.add(light)}
  })
  return {root,ready,dispose(){disposed=true;scene.remove(root);release(root)}}
}

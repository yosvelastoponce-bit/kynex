// One shared layout for collision, proximity and Blender geometry. Units: metres, base-local.
export const LAB_LAYOUT={minX:-10,maxX:-6,minZ:-3,maxZ:3,height:2.8,volumeM3:70}
export const LAB_STATIONS=[
  {id:'resource-reception',x:-7,z:-2.25,label:'Registrar muestra',tab:'register'},
  {id:'resource-visual',x:-9.35,z:-1.7,label:'Inspección visual',tab:'visual'},
  {id:'resource-microscope',x:-9.35,z:0,label:'Microscopio virtual',tab:'microscopy'},
  {id:'resource-elemental',x:-9.35,z:1.7,label:'Consultar análisis elemental',tab:'elemental'},
  {id:'resource-life',x:-6.55,z:1.9,label:'Investigar soporte vital',tab:'life'},
  {id:'resource-energy',x:-8,z:2.5,label:'Investigar energía',tab:'energy'},
  {id:'resource-shielding',x:-8,z:-2.5,label:'Investigar blindaje',tab:'shielding'},
  {id:'resource-console',x:-7.4,z:0.9,label:'Consola científica',tab:'catalog'},
]
export const LAB_OBSTACLES=[
  {x1:-10.12,x2:-9.92,z1:-3.12,z2:3.12},
  {x1:-10.12,x2:-5.92,z1:-3.12,z2:-2.92},{x1:-10.12,x2:-5.92,z1:2.92,z2:3.12},
  {x1:-6.08,x2:-5.92,z1:-3,z2:-.9},{x1:-6.08,x2:-5.92,z1:.9,z2:3},
  {x1:-6,x2:-4.9,z1:-1.04,z2:-.9},{x1:-6,x2:-4.9,z1:.9,z2:1.04},
  {x1:-9.85,x2:-9,z1:-2.6,z2:2.6},
  {x1:-7.5,x2:-6.4,z1:-2.8,z2:-1.9},
  {x1:-8.6,x2:-7.5,z1:2.2,z2:2.85},
  {x1:-8.6,x2:-7.5,z1:-2.85,z2:-2.3},
  {x1:-6.9,x2:-6.2,z1:1.55,z2:2.5},
  {x1:-7.8,x2:-7,z1:.65,z2:1.1},
]
export function inLaboratory(x,z) {return (x>-9.9&&x<-6&&Math.abs(z)<2.9)||(x>=-6&&x<=-4.7&&Math.abs(z)<.9)}

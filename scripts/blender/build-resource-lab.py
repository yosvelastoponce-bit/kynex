"""Author RESOURCE LAB 01. Coordinates below are Three.js base-local metres.
Run: blender --background --python scripts/blender/build-resource-lab.py
No external textures, text signs or scientific identification by appearance.
"""
import bpy, math
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
def material(name,color,metal=0,emission=0):
    m=bpy.data.materials.new(name); m.diffuse_color=(*color,1); m.use_nodes=True
    n=m.node_tree.nodes.get('Principled BSDF'); n.inputs['Base Color'].default_value=(*color,1)
    n.inputs['Metallic'].default_value=metal; n.inputs['Roughness'].default_value=.48
    if emission:
        n.inputs['Emission Color'].default_value=(*color,1); n.inputs['Emission Strength'].default_value=emission
    return m
shell=material('ceramic pressure shell',(.55,.63,.64),.35)
dark=material('graphite instruments',(.045,.075,.09),.5)
deck=material('brushed metal',(.23,.3,.32),.65)
mint=material('display glass',(.1,.7,.55),.2,1.6)
blue=material('elemental instrument',(.07,.18,.3),.4)
white=material('diffuse LED',(.7,.85,.8),0,2)
gold=material('copper fittings',(.62,.35,.12),.65)
rock=material('reference replica',(.4,.39,.36))
def box(name,x,y,z,w,h,d,mat,bevel=0):
    bpy.ops.mesh.primitive_cube_add(size=1,location=(x,-z,y)); o=bpy.context.object; o.name=name
    o.dimensions=(w,d,h); bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    o.data.materials.append(mat)
    if bevel:
        b=o.modifiers.new('rounded edges','BEVEL'); b.width=bevel; b.segments=2
        o.modifiers.new('weighted normals','WEIGHTED_NORMAL')
    return o
def cylinder(name,x,y,z,r,h,mat):
    bpy.ops.mesh.primitive_cylinder_add(vertices=12,radius=r,depth=h,location=(x,-z,y))
    o=bpy.context.object; o.name=name; o.data.materials.append(mat); return o

box('lab floor',-8,-.08,0,4.2,.16,6.2,deck)
box('lab ceiling',-8,2.88,0,4.2,.16,6.2,shell)
box('west wall',-10.02,1.4,0,.16,2.8,6.15,shell)
for z in [-3.02,3.02]: box('pressure wall',-8,1.4,z,4.2,2.8,.16,shell)
for z in [-1.95,1.95]: box('east doorway wall',-6.02,1.4,z,.16,2.8,2.1,shell)
box('door lintel',-6.02,2.66,0,.16,.32,1.8,deck)
box('connector floor',-5.5,-.05,0,1.2,.1,2,deck)
box('connector ceiling',-5.5,2.68,0,1.2,.12,2,shell)
for z in [-.98,.98]: box('sealed connector',-5.5,1.3,z,1.2,2.7,.16,shell)
for x in [-9.8,-6.2]:
    for z in [-2.8,2.8]:
        box('corner rib',x,1.4,z,.12,2.8,.12,deck)
        cylinder('foundation support',x,-1,z,.09,2,deck)
for z in [-1.9,0,1.9]:
    box('ceiling light',-8,2.75,z,2.8,.05,.18,white)
    box('walkway strip',-8,.015,z,2.9,.015,.025,mint)

# Three compact scientific benches, separated along the west wall.
for name,z in [('visual',-1.7),('microscope',0),('elemental',1.7)]:
    box(name+' bench',-9.4,.4,z,.85,.8,1.3,dark,.025)
    box(name+' worktop',-9.35,.84,z,1,.08,1.4,shell,.015)
box('inspection light mast',-9.65,1.2,-1.7,.045,.7,.045,gold)
box('inspection light head',-9.4,1.52,-1.7,.55,.05,.14,white)
box('visual tray',-9.25,.92,-1.7,.45,.07,.55,deck)
for z in [-1.85,-1.6]:
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1,radius=.09,location=(-9.25,-z,1.04))
    bpy.context.object.name='unidentified replica'; bpy.context.object.data.materials.append(rock)
box('microscope base',-9.25,.94,0,.45,.07,.55,deck)
box('microscope arm',-9.55,1.15,0,.06,.5,.08,blue)
cylinder('microscope objective',-9.25,1.23,0,.07,.23,dark)
box('microscope bridge',-9.4,1.4,0,.4,.08,.12,deck)
box('elemental reference terminal',-9.3,1.2,1.7,.5,.62,.8,blue,.04)
box('elemental display',-9.03,1.32,1.7,.02,.29,.5,mint)
# Receipt desk, central console, three research terminals and sealed sample archive.
box('reception',-6.95,.43,-2.35,1.1,.86,.9,deck,.035)
for z in [-2.55,-2.2]: cylinder('sample container',-6.9,.98,z,.1,.22,dark)
box('central console',-7.4,.55,.9,.8,1.1,.45,dark,.03)
box('console screen',-7.4,1.15,.9,.65,.12,.36,mint)
for name,x,z,w,d in [('life',-6.55,1.95,.7,.95),('energy',-8,2.55,1.1,.65),('shielding',-8,-2.55,1.1,.55)]:
    box(name+' terminal',x,.72,z,w,1.44,d,blue,.025)
    box(name+' screen',x,1.5,z,w*.82,.08,d*.85,mint)
box('sample storage',-9,1.6,-2.72,.65,1.3,.35,deck)
for y in [1.15,1.55,1.95]: box('storage drawer',-9,y,-2.5,.55,.28,.09,dark)
for x in [-9.8,-6.2]: box('ventilation duct',x,2.56,0,.16,.17,5.7,deck)

scene=bpy.context.scene; scene['classification']='SCENARIO: fictional educational pressurized laboratory'
scene['coordinate_convention']='Three local x,y,z maps to Blender x,-z,y; glTF Y-up export'
source=ROOT/'assets-source/laboratory/resource-lab-01.blend'
output=ROOT/'public/models/resource-lab-01.glb'
source.parent.mkdir(parents=True,exist_ok=True); output.parent.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=str(source))
bpy.ops.export_scene.gltf(filepath=str(output),export_format='GLB',export_yup=True,export_apply=True,export_extras=True)
print('RESOURCE_LAB_EXPORTED',source,output)

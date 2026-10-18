"""Procedural beaded jewellery models for the Hadorn configurator.

Run (from repo root):
  /Applications/Blender.app/Contents/MacOS/Blender -b -P scripts/blender/make_beaded_models.py

Writes assets-src/models/{beaded-necklace,beaded-bracelet,beaded-earrings,beaded-anklet}.glb in real-world
metres, upright, centred on the origin. Every model uses the same named materials so one configurator
schema works across them:
  Beads   main bead colour            Accent  every Nth bead, a second colour
  Metal   clasp / ear wires           Cord    the thread between beads
  Charm   optional pendant (hidden by the viewer unless the customer adds it)
"""
import math
import os
import bpy
from mathutils import Euler, Vector

OUT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'assets-src', 'models'))
os.makedirs(OUT_DIR, exist_ok=True)


def reset_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def make_material(name, rgb, metallic=0.0, roughness=0.4):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes['Principled BSDF']
    bsdf.inputs['Base Color'].default_value = (*rgb, 1.0)
    bsdf.inputs['Metallic'].default_value = metallic
    bsdf.inputs['Roughness'].default_value = roughness
    return mat


def materials():
    return {
        'Beads': make_material('Beads', (0.55, 0.09, 0.05), 0.0, 0.22),  # deep coral
        'Accent': make_material('Accent', (0.90, 0.84, 0.70), 0.0, 0.3),  # ivory
        'Metal': make_material('Metal', (0.79, 0.64, 0.36), 1.0, 0.25),  # gold
        'Cord': make_material('Cord', (0.08, 0.05, 0.03), 0.0, 0.8),
        'Charm': make_material('Charm', (0.79, 0.64, 0.36), 1.0, 0.25),
    }


def sphere_mesh(name, radius, scale=(1, 1, 1), segments=18, rings=10, material=None):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments, ring_count=rings, radius=radius)
    obj = bpy.context.active_object
    obj.scale = scale
    bpy.ops.object.transform_apply(scale=True)
    obj.name = name
    obj.data.name = name
    if material:
        obj.data.materials.append(material)
    for poly in obj.data.polygons:
        poly.use_smooth = True
    return obj


def polyline_samples(fn, n=2400):
    return [Vector(fn(i / n)) for i in range(n + 1)]


def walk_even(points, spacing, closed):
    """Points spaced `spacing` apart along the polyline, with the tangent at each."""
    out, acc, nxt = [], 0.0, spacing / 2
    for a, b in zip(points[:-1], points[1:]):
        seg = (b - a).length
        while acc + seg >= nxt:
            t = (nxt - acc) / seg
            out.append((a.lerp(b, t), (b - a).normalized()))
            nxt += spacing
        acc += seg
    return out, acc


def add_cord(name, fn, radius, material, n=600):
    curve = bpy.data.curves.new(name, 'CURVE')
    curve.dimensions = '3D'
    curve.bevel_depth = radius
    curve.bevel_resolution = 2
    spline = curve.splines.new('POLY')
    pts = polyline_samples(fn, n)
    spline.points.add(len(pts) - 1)
    for p, v in zip(spline.points, pts):
        p.co = (v.x, v.y, v.z, 1)
    spline.use_cyclic_u = False
    obj = bpy.data.objects.new(name, curve)
    bpy.context.collection.objects.link(obj)
    obj.data.materials.append(material)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.convert(target='MESH')
    obj.name = name
    return obj


def place_beads(path_fn, mats, bead_r, accent_every, spacing_factor=2.0, skip=None, scale_fn=None):
    pts = polyline_samples(path_fn)
    # Fit a whole number of beads around the loop so the first and last don't pile up at the seam.
    length = sum((b - a).length for a, b in zip(pts[:-1], pts[1:]))
    count = max(1, round(length / (bead_r * spacing_factor)))
    spacing = length / count
    placed, total = walk_even(pts, spacing, closed=True)
    main = sphere_mesh('BeadMesh', bead_r, material=mats['Beads'])
    accent = sphere_mesh('AccentMesh', bead_r * 1.35, scale=(1, 1, 0.85), material=mats['Accent'])
    main_mesh, accent_mesh = main.data, accent.data
    bpy.data.objects.remove(main)
    bpy.data.objects.remove(accent)
    objs = []
    for i, (pos, tangent) in enumerate(placed):
        if skip and skip(pos):
            continue
        is_accent = accent_every and (i % accent_every == accent_every - 1)
        obj = bpy.data.objects.new(('Accent' if is_accent else 'Bead') + f'_{i:03d}', accent_mesh if is_accent else main_mesh)
        obj.location = pos
        bpy.context.collection.objects.link(obj)
        objs.append(obj)
    return objs, total


def add_clasp(location, rotation, mats, size=0.006):
    bpy.ops.mesh.primitive_cylinder_add(vertices=14, radius=size, depth=size * 2.2, location=location, rotation=rotation)
    clasp = bpy.context.active_object
    clasp.name = 'Clasp'
    clasp.data.materials.append(mats['Metal'])
    for poly in clasp.data.polygons:
        poly.use_smooth = True
    return clasp


def add_charm(location, mats, kind='drop', size=0.012):
    parts = []
    if kind == 'drop':
        charm = sphere_mesh('CharmBody', size, scale=(0.75, 1.5, 0.45), material=mats['Charm'])
        charm.location = location + Vector((0, -size * 1.55, 0))
        parts.append(charm)
    else:
        charm = sphere_mesh('CharmBody', size, material=mats['Charm'])
        charm.location = location + Vector((0, -size * 1.1, 0))
        parts.append(charm)
    bpy.ops.mesh.primitive_torus_add(major_radius=size * 0.35, minor_radius=size * 0.1, location=location, rotation=(math.pi / 2, 0, 0))
    ring = bpy.context.active_object
    ring.name = 'CharmRing'
    ring.data.materials.append(mats['Charm'])
    parts.append(ring)
    return parts


def uprighten():
    """Geometry above is authored Y-up (glTF convention); Blender is Z-up, so tip everything
    through a parent rotated 90 degrees about X so the exported model stands upright."""
    root = bpy.data.objects.new('Root', None)
    bpy.context.collection.objects.link(root)
    root.rotation_euler = (math.pi / 2, 0, 0)
    for obj in list(bpy.context.scene.objects):
        if obj is not root and obj.parent is None:
            obj.parent = root


def export(name):
    uprighten()
    bpy.ops.object.select_all(action='DESELECT')
    path = os.path.join(OUT_DIR, f'{name}.glb')
    bpy.ops.export_scene.gltf(
        filepath=path,
        export_format='GLB',
        export_apply=True,
        export_cameras=False,
        export_lights=False,
        export_yup=True,
    )
    print('wrote', path, round(os.path.getsize(path) / 1024), 'KB')


# --- models -----------------------------------------------------------------

def necklace(mats):
    R, DROP = 0.078, 0.095  # neck radius, front drop (metres)

    def path(t):
        th = 2 * math.pi * t
        front = (1 + math.sin(th)) / 2  # 1 at the front, 0 at the back
        return (R * math.cos(th), -DROP * front ** 2.2, R * math.sin(th) * 0.92)

    add_cord('Cord', path, 0.0006, mats['Cord'])
    place_beads(path, mats, 0.0042, accent_every=6, spacing_factor=2.05)
    back = Vector(path(0.75))
    add_clasp(back, (math.pi / 2, 0, 0), mats, size=0.004)
    add_charm(Vector(path(0.25)), mats, 'drop', size=0.011)


def bracelet(mats, radius=0.034, bead_r=0.0042, charm_size=0.0085, accent_every=5):
    def path(t):
        th = 2 * math.pi * t
        return (radius * math.cos(th), radius * math.sin(th), 0.0)

    add_cord('Cord', path, 0.0006, mats['Cord'])
    place_beads(path, mats, bead_r, accent_every=accent_every, spacing_factor=2.05,
                skip=lambda p: p.y < -radius + bead_r * 2.4 and abs(p.x) < bead_r * 2.4)
    bottom = Vector((0, -radius, 0))
    add_clasp(bottom, (0, math.pi / 2, 0), mats, size=0.0048)
    add_charm(bottom, mats, 'ball', size=charm_size)


def anklet(mats):
    bracelet(mats, radius=0.046, bead_r=0.0036, charm_size=0.009, accent_every=7)


def earrings(mats):
    for side in (-1, 1):
        x0 = side * 0.03
        bpy.ops.mesh.primitive_torus_add(major_radius=0.006, minor_radius=0.0009, location=(x0, 0.0, 0), rotation=(math.pi / 2, 0, 0))
        wire = bpy.context.active_object
        wire.name = f'EarWire_{side}'
        wire.data.materials.append(mats['Metal'])
        y = -0.012
        sizes = [0.0045, 0.0055, 0.0065, 0.0055, 0.0042]
        for i, r in enumerate(sizes):
            bead = sphere_mesh(f'DropBead_{side}_{i}', r, material=mats['Accent'] if i == 2 else mats['Beads'])
            y -= r
            bead.location = (x0, y, 0)
            y -= r + 0.0004
        add_cord(f'Thread_{side}', lambda t, x0=x0, y=y: (x0, -0.006 + (y + 0.006) * t, 0), 0.0004, mats['Cord'], n=20)


MODELS = {
    'beaded-necklace': necklace,
    'beaded-bracelet': bracelet,
    'beaded-earrings': earrings,
    'beaded-anklet': anklet,
}

for name, build in MODELS.items():
    reset_scene()
    build(materials())
    export(name)

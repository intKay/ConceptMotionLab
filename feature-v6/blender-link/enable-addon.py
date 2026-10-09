import addon_utils
import bpy
import json

loaded = addon_utils.enable('blender_mcp', default_set=True)
if loaded is None:
    raise RuntimeError('Blender MCP addon failed to load')
prefs = bpy.context.preferences.addons['blender_mcp'].preferences
prefs.telemetry_consent = False
bpy.ops.wm.save_userpref()
print('BLENDER_LINK_CHECK ' + json.dumps({'enabled': True, 'telemetry_consent': prefs.telemetry_consent, 'version': bpy.app.version_string}))

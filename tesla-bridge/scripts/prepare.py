# SPDX-License-Identifier: GPL-3.0-only
"""Apply the explicit French onboarding overlay to the pinned WheelPlay source."""
import json
import shutil
import subprocess
import sys
from pathlib import Path
import xml.etree.ElementTree as ET

overlay = Path(__file__).resolve().parents[1]
root = Path(sys.argv[1]).resolve()
spec = json.loads((overlay / "upstream.json").read_text())
actual = subprocess.check_output(["git", "-C", str(root), "rev-parse", "HEAD"], text=True).strip()
if actual != spec["commit"]:
    raise SystemExit("Refusing to patch an unexpected upstream revision")
android = "http://schemas.android.com/apk/res/android"
ET.register_namespace("android", android)
manifest = root / "common/src/main/AndroidManifest.xml"
doc = ET.parse(manifest)
app = doc.getroot().find("application")
entry = next(a for a in app.findall("activity") if a.get(f"{{{android}}}name") == "com.shilapi.xcertplay.DiPlayActivity")
launchers = [f for f in entry.findall("intent-filter") if any(c.get(f"{{{android}}}name") == "android.intent.category.LAUNCHER" for c in f.findall("category"))]
if len(launchers) != 1:
    raise SystemExit("Unexpected launcher manifest layout")
entry.remove(launchers[0])
welcome = ET.SubElement(app, "activity", {f"{{{android}}}name": "fr.eleprettre.teslabridge.WelcomeActivity", f"{{{android}}}exported": "true"})
f = ET.SubElement(welcome, "intent-filter")
ET.SubElement(f, "action", {f"{{{android}}}name": "android.intent.action.MAIN"})
ET.SubElement(f, "category", {f"{{{android}}}name": "android.intent.category.LAUNCHER"})
doc.write(manifest, encoding="utf-8", xml_declaration=True)
target = root / "common/src/main/java/fr/eleprettre/teslabridge"
target.mkdir(parents=True, exist_ok=True)
shutil.copy2(overlay / "overlay/WelcomeActivity.java", target)
strings = root / "mobile/src/main/res/values/strings.xml"
s = ET.parse(strings)
s.getroot().find("string[@name='app_name']").text = "Passerelle Tesla"
s.write(strings, encoding="utf-8", xml_declaration=True)
build = root / "mobile/build.gradle.kts"
original = build.read_text()
old = 'applicationId = "moe.feng.wheelplay"'
if original.count(old) != 1:
    raise SystemExit("Unexpected application ID")
build.write_text(original.replace(old, 'applicationId = "fr.eleprettre.teslabridge"'))
shutil.copy2(overlay / "README.md", root / "PASSERELLE-TESLA.md")
shutil.copy2(overlay / "upstream.json", root / "PASSERELLE-UPSTREAM.json")
print("Applied French onboarding to " + actual)

"""Build the public Forge sites together for GitHub Pages."""
import os
from pathlib import Path
import subprocess
import sys
import json
import shutil

BASE = 'https://e-leprettre.github.io/'
PROJECTS = ['eleprettre', 'snt', 'nsi-1ere', 'nsi-tle',
            'bts-mecp-physique-chimie', 'bts-mecp-cosmetologie',
            'bts-mecp-option-marque-dev-pro']
OUTPUT = Path('site').resolve()
OUTPUT.mkdir(exist_ok=True)
versions = {}
for project in PROJECTS:
    source = Path('forge-home' if project == 'eleprettre' else 'forge-' + project)
    repository = f'https://forge.apps.education.fr/eleprettre/{project}'
    if not source.exists():
        subprocess.run(['git', 'clone', '--depth', '1', repository + '.git', str(source)], check=True)
    versions[project] = subprocess.check_output(['git', '-C', str(source), 'rev-parse', 'HEAD'], text=True).strip()
    destination = OUTPUT if project == 'eleprettre' else OUTPUT / project
    environment = dict(os.environ, CI_PAGES_URL=BASE if project == 'eleprettre' else BASE + project + '/',
                       CI_PROJECT_URL=repository, CI_COMMIT_AUTHOR='Elisabeth Le Prettre', EDIT_VARIABLE='-/edit/main/docs/')
    subprocess.run([sys.executable, '-m', 'mkdocs', 'build', '--site-dir', str(destination)],
                   cwd=source, env=environment, check=True)

replacements = {
    'https://eleprettre.forge.apps.education.fr/': BASE,
    'https://eleprettre-118562.forge.apps.education.fr/': BASE,
    'https://bts-mecp-physique-chimie-688080.forge.apps.education.fr/': BASE + 'bts-mecp-physique-chimie/',
    'https://bts-mecp-cosmetologie-f42365.forge.apps.education.fr/': BASE + 'bts-mecp-cosmetologie/',
}
for path in OUTPUT.rglob('*'):
    if path.is_file() and path.suffix in {'.html', '.json', '.js', '.css', '.xml'}:
        try:
            content = path.read_text(encoding='utf-8')
        except UnicodeDecodeError:
            continue
        for old, new in replacements.items():
            content = content.replace(old, new)
        path.write_text(content, encoding='utf-8')
for project in PROJECTS:
    page = OUTPUT / ('index.html' if project == 'eleprettre' else project + '/index.html')
    if not page.is_file():
        raise RuntimeError(f'Missing homepage: {project}')
(OUTPUT / '.nojekyll').touch()
(OUTPUT / 'replication.json').write_text(json.dumps(versions, indent=2) + '\n')
print('Verified all seven homepages. Source revisions:', versions)

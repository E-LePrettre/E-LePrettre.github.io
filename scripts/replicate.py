"""Build the public Forge sites together for GitHub Pages."""
import os
from pathlib import Path
import subprocess
import sys
import json
import shutil
import re
from urllib.parse import urljoin, urlsplit, unquote, quote
from html import escape, unescape

BASE = 'https://e-leprettre.github.io/'
PROJECTS = ['eleprettre', 'snt', 'nsi-1ere', 'nsi-tle',
            'bts-mecp-physique-chimie', 'bts-mecp-cosmetologie',
            'bts-mecp-option-marque-dev-pro']
if os.environ.get('REPLICATE_PROJECT'):
    PROJECTS = [os.environ['REPLICATE_PROJECT']]
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
    interpreter = sys.executable
    if project == 'eleprettre':
        home_env = Path('.build/home-env').resolve()
        interpreter = str(home_env / 'bin/python')
        if not Path(interpreter).exists():
            subprocess.run([sys.executable, '-m', 'venv', str(home_env)], check=True)
            subprocess.run([interpreter, '-m', 'pip', 'install', 'mkdocs-material'], check=True)
    subprocess.run([interpreter, '-m', 'mkdocs', 'build', '--site-dir', str(destination)],
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
repairs = []
missing = []
for page in OUTPUT.rglob('*.html'):
    content = page.read_text(encoding='utf-8')
    course = OUTPUT / page.relative_to(OUTPUT).parts[0]
    if not course.is_dir():
        course = OUTPUT
    def repair_image(match):
        prefix, delimiter, raw = match.group(1), match.group(2), match.group(3)
        src = unescape(raw).replace('\\', '/')
        url = urlsplit(urljoin(BASE + page.relative_to(OUTPUT).as_posix(), src))
        if url.netloc != 'e-leprettre.github.io':
            return match.group(0)
        target = OUTPUT / unquote(url.path.lstrip('/'))
        if not target.is_file() and not urlsplit(src).scheme and not src.startswith('/'):
            for parent in [page.parent, *page.parent.parents]:
                if not parent.is_relative_to(course):
                    break
                candidate = (parent / unquote(urlsplit(src).path)).resolve()
                if candidate.is_relative_to(course) and candidate.is_file():
                    target = candidate
                    break
            if not target.is_file():
                candidates = list(course.rglob(Path(unquote(url.path)).name))
                if len(candidates) == 1 and candidates[0].is_file():
                    target = candidates[0]
        if not target.is_file():
            missing.append({'page':page.relative_to(OUTPUT).as_posix(), 'src':raw})
            return match.group(0)
        corrected = '/' + quote(target.relative_to(OUTPUT).as_posix(), safe='/')
        if url.query:
            corrected += '?' + url.query
        if url.fragment:
            corrected += '#' + url.fragment
        if corrected != raw:
            repairs.append({'page':page.relative_to(OUTPUT).as_posix(), 'src':raw, 'corrected':corrected})
        return prefix + delimiter + escape(corrected, quote=True) + delimiter
    content = re.sub(r'(<img\b[^>]*?\bsrc\s*=\s*)([\"\x27])(.*?)(?:\2)', repair_image, content, flags=re.I|re.S)
    page.write_text(content, encoding='utf-8')
(OUTPUT / 'image-audit.json').write_text(json.dumps({'repairs':repairs,'missing_source_images':missing},ensure_ascii=False,indent=2))
print(f'Image audit: {len(repairs)} normalized references; {len(missing)} references to absent source images.')
for project in PROJECTS:
    page = OUTPUT / ('index.html' if project == 'eleprettre' else project + '/index.html')
    if not page.is_file():
        raise RuntimeError(f'Missing homepage: {project}')
(OUTPUT / '.nojekyll').touch()
(OUTPUT / 'replication.json').write_text(json.dumps(versions, indent=2) + '\n')
print('Verified all seven homepages. Source revisions:', versions)

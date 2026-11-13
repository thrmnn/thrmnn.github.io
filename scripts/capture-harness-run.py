#!/usr/bin/env python3
"""Capture the agent-harness example eval suite, per case and per check (and each call's input and returned hits), into
scripts/assets/agent-harness/eval-run.json: once as committed, once with the
change the suite's own comment describes (TITLE_WEIGHT 2 -> 1 in
examples/kb_search.py). Each case's tool call goes through a Tracer, so the
trace events are the repo's own. Needs a checkout of thrmnn/agent-harness.

    python3 scripts/capture-harness-run.py <path-to-agent-harness-checkout>
"""
import json
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).parent.parent
OUT = ROOT / "scripts/assets/agent-harness/eval-run.json"
RUNNER = '''
import json, sys
sys.path.insert(0, "src"); sys.path.insert(0, "examples")
from agent_harness import Tracer
from agent_harness.evals import _apply
import eval_cases, kb_search
tracer = Tracer()
registry = kb_search.build_registry(tracer)
out = []
for case in eval_cases.CASES:
    res = registry.call(case.tool, **case.input)
    checks = [_apply(c, res.value) is None for c in case.checks]
    ev = tracer.events[-1]
    hits = [{"id": h["id"], "score": h["score"]} for h in res.value["hits"]] if "hits" in res.value else [{"id": res.value["id"]}]
    out.append({"case": case.name, "tool": ev["tool"], "version": ev["version"],
                "ok": ev["ok"], "checks": checks, "input": case.input, "hits": hits})
print(json.dumps(out))
'''


def run(src: Path, broken: bool):
    work = Path(tempfile.mkdtemp())
    shutil.copytree(src, work / "r", ignore=shutil.ignore_patterns(".git"))
    if broken:
        f = work / "r/examples/kb_search.py"
        s = f.read_text()
        assert s.count("\nTITLE_WEIGHT = 2\n") == 1
        f.write_text(s.replace("\nTITLE_WEIGHT = 2\n", "\nTITLE_WEIGHT = 1\n"))
    p = subprocess.run([sys.executable, "-c", RUNNER], cwd=work / "r", capture_output=True, text=True, check=True)
    shutil.rmtree(work)
    return json.loads(p.stdout)


src = Path(sys.argv[1])
commit = subprocess.run(["git", "-C", str(src), "rev-parse", "--short", "HEAD"], capture_output=True, text=True, check=True).stdout.strip()
OUT.write_text(json.dumps({"commit": commit, "committed": run(src, False), "changed": run(src, True)}, indent=1))
print("wrote", OUT, commit)

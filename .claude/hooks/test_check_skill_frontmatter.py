"""Tests for check-skill-frontmatter.py. Run: python3 -m unittest discover -s .claude/hooks"""
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

HOOK = Path(__file__).with_name("check-skill-frontmatter.py")


def run_hook(path):
    payload = json.dumps({"tool_input": {"file_path": str(path)}})
    return subprocess.run([sys.executable, str(HOOK)], input=payload, capture_output=True, text=True)


class CheckSkillFrontmatter(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.skill = Path(self.tmp.name, ".claude", "skills", "demo", "SKILL.md")
        self.skill.parent.mkdir(parents=True)

    def tearDown(self):
        self.tmp.cleanup()

    def check(self, text):
        self.skill.write_text(text)
        return run_hook(self.skill)

    def test_valid_skill_passes(self):
        self.assertEqual(self.check("---\nname: demo\ndescription: Does a thing.\n---\nbody\n").returncode, 0)

    def test_block_scalar_description_passes(self):
        self.assertEqual(self.check("---\nname: demo\ndescription: >\n  Folded text.\n---\n").returncode, 0)

    def test_invalid_cases_exit_2(self):
        cases = {
            "no frontmatter": "# demo\n",
            "no closing line": "---\nname: demo\ndescription: x\n",
            "bad name": "---\nname: Demo_Skill\ndescription: x\n---\n",
            "missing description": "---\nname: demo\n---\n",
            "invalid yaml": "---\nname: demo\ndescription: [unclosed\n---\n",
            "description too long": "---\nname: demo\ndescription: " + "x" * 1100 + "\n---\n",
        }
        for label, text in cases.items():
            with self.subTest(label):
                result = self.check(text)
                self.assertEqual(result.returncode, 2, result.stderr)
                self.assertIn("Invalid skill frontmatter", result.stderr)

    def test_non_skill_path_ignored(self):
        other = Path(self.tmp.name, "README.md")
        other.write_text("# not a skill\n")
        self.assertEqual(run_hook(other).returncode, 0)

    def test_malformed_input_ignored(self):
        result = subprocess.run([sys.executable, str(HOOK)], input="not json", capture_output=True, text=True)
        self.assertEqual(result.returncode, 0)


if __name__ == "__main__":
    unittest.main()

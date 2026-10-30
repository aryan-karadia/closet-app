#!/bin/sh
# Check script for Agent C test suite (refs ISSUE-29, ISSUE-30).
# Runs the suite with Node built-in test runner, no dependencies to install.
# Usage: sh scripts/check-tests.sh
# From the repo root: sh scripts/check-tests.sh
# Reports pass, fail, and pending (skipped) counts from the node:test summary.
# Exit code: 0 if no test failed, 1 if any test failed.
# Pending (skipped) implementation-gated tests do NOT fail the script, but
# they are reported, and TEST-PLAN.md marks them RED (awaiting implementation).
# No em dashes are used in this file.

set -eu
cd "$(dirname "$0")/.."

echo "Running closet app spec test suite with node:test..."
echo "Runner: node --test (built-in, no install required)"
echo "Command: node --test --test-reporter=tap \$(find tests -name '*.test.js' | sort)"

# TAP output to a temp file so counts can be reported even on failure.
TMP_OUT="$(mktemp)"
trap 'rm -f "$TMP_OUT"' EXIT INT TERM

set +e
# Pass test files explicitly. Passing a directory to node --test is not
# reliable in this environment, so find is used instead.
# shellcheck disable=SC2046
node --test --test-reporter=tap $(find tests -name '*.test.js' | sort) > "$TMP_OUT" 2>&1
STATUS=$?
set -e

# Read the node:test summary lines, for example "# pass 79", "# fail 0", "# skipped 19".
PASS_COUNT=$(grep '^# pass ' "$TMP_OUT" | sed 's/^# pass //' | tail -n 1)
FAIL_COUNT=$(grep '^# fail ' "$TMP_OUT" | sed 's/^# fail //' | tail -n 1)
PENDING_COUNT=$(grep '^# skipped ' "$TMP_OUT" | sed 's/^# skipped //' | tail -n 1)
TOTAL_COUNT=$(grep '^# tests ' "$TMP_OUT" | sed 's/^# tests //' | tail -n 1)
if [ -z "$PASS_COUNT" ]; then PASS_COUNT=0; fi
if [ -z "$FAIL_COUNT" ]; then FAIL_COUNT=0; fi
if [ -z "$PENDING_COUNT" ]; then PENDING_COUNT=0; fi
if [ -z "$TOTAL_COUNT" ]; then TOTAL_COUNT=0; fi

echo "----------------------------------------"
echo "Test results:"
echo "  total:   $TOTAL_COUNT"
echo "  pass:    $PASS_COUNT"
echo "  fail:    $FAIL_COUNT"
echo "  pending: $PENDING_COUNT (skipped, RED awaiting implementation)"
echo "  node exit code: $STATUS"
echo "----------------------------------------"

if [ "$FAIL_COUNT" != "0" ] || [ "$STATUS" -ne 0 ]; then
  echo "Result: FAIL, see output below."
  cat "$TMP_OUT"
  exit 1
fi

echo "Result: PASS (with $PENDING_COUNT pending implementation-gated tests)."
echo "Pending tests are not green. See tests/TEST-PLAN.md for RED status."
cat "$TMP_OUT"
exit 0

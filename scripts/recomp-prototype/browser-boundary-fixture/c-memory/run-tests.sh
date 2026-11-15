#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")"
ulimit -v 262144 || exit 12
timeout --kill-after=2s 15s gcc -std=c11 -Wall -Wextra -Werror -pedantic -O1 -fsanitize=undefined -fno-sanitize-recover=all guest_memory_port.c test.c -o test-native
timeout --kill-after=2s 15s ./test-native
